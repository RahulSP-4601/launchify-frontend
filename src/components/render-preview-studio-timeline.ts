"use client";

import { Dispatch, SetStateAction } from "react";

import { EditPlanScene } from "@/lib/types";

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

export function buildSceneTimeline(scenes: EditPlanScene[]): SceneTimelineEntry[] {
  let previewCursor = 0;
  let previousEnd = 0;
  return [...scenes].filter((scene) => scene.end > scene.start).sort((left, right) => left.start - right.start).flatMap((scene) => {
    const windows = clipWindowsForScene(scene, previousEnd);
    return windows.map(([sourceStart, sourceEnd]) => {
      const duration = sourceEnd - sourceStart;
      const entry = { ...scene, sourceStart, sourceEnd, previewStart: previewCursor, previewEnd: previewCursor + duration };
      previewCursor += duration;
      previousEnd = sourceEnd;
      return entry;
    });
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
    if (!previous || start - previous[1] > 0.18) {
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
  let clipStart = Math.max(scene.start, start - 0.1, previousEnd);
  let clipEnd = Math.min(scene.end, end + 0.1);
  if (clipEnd - clipStart > 3.4) {
    [clipStart, clipEnd] = centeredClipWindow(scene, start, end, clipStart, clipEnd);
  }
  if (clipEnd - clipStart < 0.45) {
    clipEnd = Math.min(scene.end, Math.max(clipEnd, clipStart + 0.45));
  }
  return clipEnd - clipStart >= 0.45 ? [clipStart, clipEnd] : null;
}

function centeredClipWindow(
  scene: EditPlanScene,
  start: number,
  end: number,
  clipStart: number,
  clipEnd: number,
): [number, number] {
  const anchor = clipActionAnchor(scene, start, end);
  let centeredStart = Math.max(clipStart, anchor - 3.4 * 0.45);
  let centeredEnd = Math.min(clipEnd, Math.max(anchor + 3.4 * 0.55, centeredStart + 3.4));
  centeredStart = Math.max(clipStart, centeredEnd - 3.4);
  centeredEnd = Math.min(clipEnd, centeredStart + 3.4);
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
