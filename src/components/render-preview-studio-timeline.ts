"use client";

import { Dispatch, SetStateAction } from "react";

import { EditPlanScene, RecordingSessionRecord } from "@/lib/types";

export type SceneTimelineEntry = EditPlanScene & {
  sourceStart: number;
  sourceEnd: number;
  previewStart: number;
  previewEnd: number;
};

type PlaybackState = {
  time: number;
  shouldEndPlayback: boolean;
};

const MIN_CLIP_DURATION_SECONDS = 0.45;
const CLIP_PADDING_SECONDS = 0.1;
const MAX_CLIP_DURATION_SECONDS = 3.4;
const MERGE_GAP_SECONDS = 0.18;
const MIN_ACTION_REEL_SECONDS = 12;
const MIN_SOURCE_COVERAGE_RATIO = 0.6;

export function activeSceneForSourceTime(scenes: EditPlanScene[], currentTime: number) {
  return scenes.find((scene) => currentTime >= scene.start && currentTime <= scene.end) ?? null;
}

export function activeSceneForPreviewTime(sceneTimeline: SceneTimelineEntry[], currentTime: number) {
  return sceneTimeline.find((scene) => currentTime >= scene.previewStart && currentTime <= scene.previewEnd) ?? null;
}

export function seekScene(
  video: HTMLVideoElement | null,
  scene: EditPlanScene,
  sceneTimeline: SceneTimelineEntry[],
  usesRenderedPreview: boolean,
  setSelectedScene: Dispatch<SetStateAction<number | null>>,
) {
  if (!video) return;
  video.currentTime = usesRenderedPreview ? sceneTimeline.find((entry) => entry.scene_number === scene.scene_number)?.previewStart ?? 0 : scene.start;
  setSelectedScene(scene.scene_number);
  void video.play().catch(() => undefined);
}

export function buildSceneTimeline(
  scenes: EditPlanScene[],
  recordingSession: RecordingSessionRecord | null,
): SceneTimelineEntry[] {
  const sortedScenes = [...scenes].filter((scene) => scene.end > scene.start).sort((left, right) => left.start - right.start);
  const sourceBounds = sceneSourceBounds(sortedScenes, recordingSession);
  const sceneWindows = shouldUseContextualSceneWindows(sortedScenes, sourceBounds)
    ? contextualSceneWindows(sortedScenes, sourceBounds)
    : actionSceneWindows(sortedScenes);
  let previewCursor = 0;
  return sceneWindows.map(({ scene, sourceStart, sourceEnd }) => {
    const duration = sourceEnd - sourceStart;
    const entry = { ...scene, sourceStart, sourceEnd, previewStart: previewCursor, previewEnd: previewCursor + duration };
    previewCursor += duration;
    return entry;
  });
}

export function sourceTimeForRenderedPreview(sceneTimeline: SceneTimelineEntry[], previewTime: number) {
  const scene = sceneTimeline.find((entry) => previewTime >= entry.previewStart && previewTime <= entry.previewEnd);
  if (!scene) {
    return sceneTimeline.at(-1)?.sourceEnd ?? 0;
  }
  const previewDuration = Math.max(scene.previewEnd - scene.previewStart, 0.001);
  const sourceDuration = Math.max(scene.sourceEnd - scene.sourceStart, 0.001);
  const progress = Math.min(Math.max((previewTime - scene.previewStart) / previewDuration, 0), 1);
  return scene.sourceStart + sourceDuration * progress;
}

export function previewTimeForSourceTime(sceneTimeline: SceneTimelineEntry[], sourceTime: number) {
  if (!sceneTimeline.length) {
    return sourceTime;
  }
  const active = sceneTimeline.find((entry) => sourceTime >= entry.sourceStart && sourceTime <= entry.sourceEnd);
  if (active) {
    const sourceDuration = Math.max(active.sourceEnd - active.sourceStart, 0.001);
    const previewDuration = Math.max(active.previewEnd - active.previewStart, 0.001);
    const progress = Math.min(Math.max((sourceTime - active.sourceStart) / sourceDuration, 0), 1);
    return active.previewStart + previewDuration * progress;
  }
  if (sourceTime <= sceneTimeline[0].sourceStart) {
    return sceneTimeline[0].previewStart;
  }
  const previous = [...sceneTimeline].reverse().find((entry) => sourceTime >= entry.sourceEnd);
  return previous?.previewEnd ?? sceneTimeline.at(-1)?.previewEnd ?? 0;
}

export function sourceTimeForPreviewTime(sceneTimeline: SceneTimelineEntry[], previewTime: number) {
  const active = sceneTimeline.find((entry) => previewTime >= entry.previewStart && previewTime <= entry.previewEnd);
  if (!active) {
    return sceneTimeline.at(-1)?.sourceEnd ?? 0;
  }
  const previewDuration = Math.max(active.previewEnd - active.previewStart, 0.001);
  const sourceDuration = Math.max(active.sourceEnd - active.sourceStart, 0.001);
  const progress = Math.min(Math.max((previewTime - active.previewStart) / previewDuration, 0), 1);
  return active.sourceStart + sourceDuration * progress;
}

export function clampSourceTimeToScenes(sceneTimeline: SceneTimelineEntry[], sourceTime: number) {
  if (!sceneTimeline.length) {
    return sourceTime;
  }
  const activeScene = sceneTimeline.find((scene) => sourceTime >= scene.start && sourceTime <= scene.end);
  if (activeScene) {
    return sourceTime;
  }
  if (sourceTime < sceneTimeline[0].start) {
    return sceneTimeline[0].start;
  }
  return [...sceneTimeline].reverse().find((scene) => sourceTime > scene.end)?.end ?? sceneTimeline.at(-1)!.end;
}

export function normalizeScenePlaybackTime(
  sceneTimeline: SceneTimelineEntry[],
  sourceTime: number,
  isPlaying: boolean,
): PlaybackState {
  if (!sceneTimeline.length) {
    return { time: sourceTime, shouldEndPlayback: false };
  }
  const activeScene = sceneTimeline.find((scene) => sourceTime >= scene.start && sourceTime <= scene.end);
  if (activeScene) {
    return { time: sourceTime, shouldEndPlayback: false };
  }
  if (sourceTime < sceneTimeline[0].start) {
    return { time: sceneTimeline[0].start, shouldEndPlayback: false };
  }
  return gapPlaybackState(sceneTimeline, sourceTime, isPlaying) ?? { time: sceneTimeline.at(-1)!.end, shouldEndPlayback: isPlaying };
}

export function formatPreviewRange(sceneTimeline: SceneTimelineEntry[], scene: EditPlanScene) {
  const entries = sceneTimeline.filter((item) => item.scene_number === scene.scene_number);
  if (!entries.length) {
    return `${scene.start.toFixed(1)}s - ${scene.end.toFixed(1)}s`;
  }
  return `${entries[0].previewStart.toFixed(1)}s - ${entries.at(-1)!.previewEnd.toFixed(1)}s`;
}

function gapPlaybackState(
  sceneTimeline: SceneTimelineEntry[],
  sourceTime: number,
  isPlaying: boolean,
): PlaybackState | null {
  for (let index = 0; index < sceneTimeline.length - 1; index += 1) {
    const currentScene = sceneTimeline[index];
    const nextScene = sceneTimeline[index + 1];
    if (sourceTime > currentScene.end && sourceTime < nextScene.start) {
      return { time: isPlaying ? nextScene.start : currentScene.end, shouldEndPlayback: false };
    }
  }
  return null;
}

function actionSceneWindows(scenes: EditPlanScene[]) {
  const windows: Array<{ scene: EditPlanScene; sourceStart: number; sourceEnd: number }> = [];
  let previousEnd = 0;
  for (const scene of scenes) {
    for (const [sourceStart, sourceEnd] of clipWindowsForScene(scene, previousEnd)) {
      windows.push({ scene, sourceStart, sourceEnd });
      previousEnd = sourceEnd;
    }
  }
  return windows;
}

function shouldUseContextualSceneWindows(
  scenes: EditPlanScene[],
  sourceBounds: { start: number; end: number },
) {
  if (!scenes.length) {
    return false;
  }
  const actionDuration = actionSceneWindows(scenes).reduce((sum, window) => sum + (window.sourceEnd - window.sourceStart), 0);
  const sourceDuration = Math.max(sourceBounds.end - sourceBounds.start, 0);
  return actionDuration < Math.max(MIN_ACTION_REEL_SECONDS, sourceDuration * MIN_SOURCE_COVERAGE_RATIO);
}

function contextualSceneWindows(
  scenes: EditPlanScene[],
  sourceBounds: { start: number; end: number },
) {
  if (!scenes.length) {
    return [];
  }
  const windows: Array<{ scene: EditPlanScene; sourceStart: number; sourceEnd: number }> = [];
  let previousEnd = sourceBounds.start;
  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const nextScene = scenes[index + 1] ?? null;
    const sourceStart = previousEnd;
    const sourceEnd = nextScene ? Math.max((scene.end + nextScene.start) / 2, scene.end) : sourceBounds.end;
    if (sourceEnd - sourceStart < MIN_CLIP_DURATION_SECONDS) {
      continue;
    }
    windows.push({ scene, sourceStart, sourceEnd });
    previousEnd = sourceEnd;
  }
  return windows;
}

function sceneSourceBounds(
  scenes: EditPlanScene[],
  recordingSession: RecordingSessionRecord | null,
) {
  const sessionStart = parseTimestamp(recordingSession?.started_at);
  const sessionEnd = parseTimestamp(recordingSession?.ended_at);
  const fallbackStart = scenes[0]?.start ?? 0;
  const fallbackEnd = scenes.at(-1)?.end ?? 0;
  const hasSessionStart = recordingSession !== null && recordingSession.started_at.trim() !== "";
  const start = hasSessionStart ? Math.min(sessionStart, fallbackStart) : fallbackStart;
  const end = sessionEnd > start ? sessionEnd : fallbackEnd;
  return { start: Math.max(start, 0), end: Math.max(end, fallbackEnd) };
}

function parseTimestamp(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

function clipWindowsForScene(scene: EditPlanScene, previousEnd: number): Array<[number, number]> {
  const windows = mergeClipWindows(candidateClipWindows(scene));
  const clips: Array<[number, number]> = [];
  let floor = previousEnd;
  for (const [start, end] of windows) {
    const clip = boundedClipWindow(scene, start, end, floor);
    if (!clip) continue;
    clips.push(clip);
    floor = clip[1];
  }
  if (clips.length) {
    return clips;
  }
  const fallback = boundedClipWindow(scene, scene.start, scene.end, previousEnd);
  return fallback ? [fallback] : [];
}

function candidateClipWindows(scene: EditPlanScene): Array<[number, number]> {
  const windows = scene.zooms.map((zoom) => [zoom.start, zoom.end] as [number, number]);
  windows.push(...scene.highlights.map((highlight) => [highlight.start, highlight.end] as [number, number]));
  if (scene.action_timestamp !== null) {
    windows.push([scene.action_timestamp - 0.45, scene.action_timestamp + 1.15]);
  }
  return windows.length ? windows : [[scene.start, scene.end]];
}

function mergeClipWindows(windows: Array<[number, number]>): Array<[number, number]> {
  const merged: Array<[number, number]> = [];
  for (const [start, end] of [...windows].sort((left, right) => left[0] - right[0])) {
    if (end - start <= 0.05) continue;
    const previous = merged.at(-1);
    if (!previous || start - previous[1] > MERGE_GAP_SECONDS) {
      merged.push([start, end]);
      continue;
    }
    previous[1] = Math.max(previous[1], end);
  }
  return merged;
}

function boundedClipWindow(
  scene: EditPlanScene,
  start: number,
  end: number,
  previousEnd: number,
): [number, number] | null {
  let clipStart = Math.max(scene.start, start - CLIP_PADDING_SECONDS, previousEnd);
  let clipEnd = Math.min(scene.end, end + CLIP_PADDING_SECONDS);
  if (clipEnd - clipStart > MAX_CLIP_DURATION_SECONDS) {
    [clipStart, clipEnd] = centeredClipWindow(scene, start, end, clipStart, clipEnd);
  }
  if (clipEnd - clipStart < MIN_CLIP_DURATION_SECONDS) {
    clipEnd = Math.min(scene.end, Math.max(clipEnd, clipStart + MIN_CLIP_DURATION_SECONDS));
  }
  return clipEnd - clipStart >= MIN_CLIP_DURATION_SECONDS ? [clipStart, clipEnd] : null;
}

function centeredClipWindow(
  scene: EditPlanScene,
  start: number,
  end: number,
  clipStart: number,
  clipEnd: number,
): [number, number] {
  const anchor = clipActionAnchor(scene, start, end);
  let centeredStart = Math.max(clipStart, anchor - MAX_CLIP_DURATION_SECONDS * 0.45);
  let centeredEnd = Math.min(clipEnd, Math.max(anchor + MAX_CLIP_DURATION_SECONDS * 0.55, centeredStart + MAX_CLIP_DURATION_SECONDS));
  centeredStart = Math.max(clipStart, centeredEnd - MAX_CLIP_DURATION_SECONDS);
  centeredEnd = Math.min(clipEnd, centeredStart + MAX_CLIP_DURATION_SECONDS);
  return [centeredStart, centeredEnd];
}

function clipActionAnchor(scene: EditPlanScene, start: number, end: number) {
  if (scene.action_timestamp !== null && scene.action_timestamp >= start && scene.action_timestamp <= end) {
    return scene.action_timestamp;
  }
  const highlight = scene.highlights
    .filter((item) => item.end > start && item.start < end)
    .sort((left, right) => (Math.min(right.end, end) - Math.max(right.start, start)) - (Math.min(left.end, end) - Math.max(left.start, start)))[0];
  if (highlight) {
    return Math.min(Math.max((highlight.start + highlight.end) / 2, start), end);
  }
  return Math.min(Math.max((start + end) / 2, start), end);
}
