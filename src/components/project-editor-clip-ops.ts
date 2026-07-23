"use client";

import type { ProjectEditorDraft } from "@/components/project-editor-draft";
import { projectDraftFromSequence } from "@/components/project-editor-sequence-ops";
import { draftScenesFromTracks, mapCaptionClip, relatedClipIds } from "@/components/project-editor-sequence-utils";
import type { ProjectEditorClip, ProjectEditorSequence } from "@/lib/types";

export function deleteSelectedClip(draft: ProjectEditorDraft) {
  if (!draft.selectedClipId) return draft;
  const sequence = draft.sequence;
  const track = sequence.tracks.find((item) => item.clips.some((clip) => clip.id === draft.selectedClipId));
  const clip = track?.clips.find((item) => item.id === draft.selectedClipId);
  if (!track || !clip || track.locked || clip.locked) return draft;
  if (track.kind === "video") {
    if (clip.kind === "source_video") return draft;
    const linkedClipIds = relatedClipIds(sequence, clip);
    const nextTracks = sequence.tracks.map((currentTrack) => ({
      ...currentTrack,
      clips: currentTrack.clips.filter((item) => !linkedClipIds.has(item.id)),
    }));
    return projectDraftFromSequence(
      { ...draft, selectedClipId: "" },
      nextSequence(sequence, nextTracks),
    );
  }
  const nextTracks = sequence.tracks.map((track) => ({
    ...track,
    clips: track.clips.filter((item) => item.id !== clip.id),
  }));
  return {
    ...draft,
    captions: clip.kind === "caption" ? draft.captions.filter((caption) => `caption-clip-${caption.id}` !== clip.id) : draft.captions,
    selectedClipId: "",
    sequence: nextSequence(sequence, nextTracks),
  };
}

export function moveSelectedClip(draft: ProjectEditorDraft, deltaSeconds: number) {
  return updateSelectedClip(draft, (clip, track) => shiftWithinTrack(clip, track.clips, deltaSeconds));
}

export function trimSelectedClipEdge(
  draft: ProjectEditorDraft,
  edge: "start" | "end",
  nextTime: number,
) {
  return updateSelectedClip(draft, (clip, track) => trimWithinTrack(clip, track.clips, edge, nextTime));
}

export function patchSelectedClip(
  draft: ProjectEditorDraft,
  patch: Partial<ProjectEditorClip>,
) {
  return updateSelectedClip(draft, (clip) => ({ ...clip, ...patch }));
}

function updateSelectedClip(
  draft: ProjectEditorDraft,
  updater: (clip: ProjectEditorClip, track: ProjectEditorSequence["tracks"][number]) => ProjectEditorClip,
) {
  if (!draft.selectedClipId) return draft;
  const sequence = draft.sequence;
  const track = sequence.tracks.find((item) => item.clips.some((clip) => clip.id === draft.selectedClipId));
  const clip = track?.clips.find((item) => item.id === draft.selectedClipId);
  if (!track || !clip || clip.locked || track.locked) return draft;
  const nextClip = updater(clip, track);
  const nextTracks = sequence.tracks.map((item) =>
    item.id === track.id
      ? { ...item, clips: item.clips.map((current) => current.id === nextClip.id ? nextClip : current) }
      : item,
  );
  const syncedTracks = syncLinkedCaptionClips(nextTracks, clip, nextClip);
  const nextDraft = { ...draft, sequence: nextSequence(sequence, nextTracks) };
  nextDraft.sequence = nextSequence(sequence, syncedTracks);
  return syncDraftEntities(nextDraft);
}

function syncDraftEntities(draft: ProjectEditorDraft) {
  const priorScenes = new Map(draft.scenes.map((scene) => [scene.id, scene]));
  const captionTrack = draft.sequence.tracks.find((track) => track.kind === "caption");
  return {
    ...draft,
    scenes: draftScenesFromTracks(draft.sequence.tracks, priorScenes),
    captions: (captionTrack?.clips ?? []).map((clip) => ({
      ...mapCaptionClip(clip),
    })),
  };
}

function syncLinkedCaptionClips(
  tracks: ProjectEditorSequence["tracks"],
  previousClip: ProjectEditorClip,
  nextClip: ProjectEditorClip,
) {
  const sceneId = previousClip.scene_id;
  if (!sceneId || previousClip.kind === "caption" || nextClip.kind === "caption") {
    return tracks;
  }
  const startDelta = roundTime(nextClip.timeline_start - previousClip.timeline_start);
  const endDelta = roundTime(nextClip.timeline_end - previousClip.timeline_end);
  return tracks.map((track) => {
    if (track.kind !== "caption") {
      return track;
    }
    return {
      ...track,
      clips: track.clips.map((clip) => syncCaptionClipToScene(clip, sceneId, startDelta, endDelta)),
    };
  });
}

function syncCaptionClipToScene(
  clip: ProjectEditorClip,
  sceneId: string,
  startDelta: number,
  endDelta: number,
) {
  if (clip.scene_id !== sceneId) {
    return clip;
  }
  return {
    ...clip,
    timeline_end: roundTime(clip.timeline_end + endDelta),
    timeline_start: roundTime(clip.timeline_start + startDelta),
  };
}

function shiftWithinTrack(clip: ProjectEditorClip, clips: ProjectEditorClip[], deltaSeconds: number) {
  const index = clips.findIndex((item) => item.id === clip.id);
  const previousEnd = clips[index - 1]?.timeline_end ?? 0;
  const nextStart = clips[index + 1]?.timeline_start ?? Number.POSITIVE_INFINITY;
  const duration = clip.timeline_end - clip.timeline_start;
  const start = clamp(roundTime(clip.timeline_start + deltaSeconds), previousEnd, nextStart - duration);
  return { ...clip, timeline_end: roundTime(start + duration), timeline_start: start };
}

function trimWithinTrack(
  clip: ProjectEditorClip,
  clips: ProjectEditorClip[],
  edge: "start" | "end",
  nextTime: number,
) {
  const index = clips.findIndex((item) => item.id === clip.id);
  const previousEnd = clips[index - 1]?.timeline_end ?? 0;
  const nextStart = clips[index + 1]?.timeline_start ?? Number.POSITIVE_INFINITY;
  if (edge === "start") {
    return { ...clip, timeline_start: clamp(roundTime(nextTime), previousEnd, clip.timeline_end - minDuration(clip)) };
  }
  return { ...clip, timeline_end: clamp(roundTime(nextTime), clip.timeline_start + minDuration(clip), nextStart) };
}

function nextSequence(sequence: ProjectEditorSequence, tracks: ProjectEditorSequence["tracks"]) {
  return {
    ...sequence,
    duration_seconds: tracks.reduce((max, track) => Math.max(max, track.clips.at(-1)?.timeline_end ?? 0), 0),
    tracks,
    version: sequence.version + 1,
  };
}

function minDuration(clip: ProjectEditorClip) {
  return clip.kind === "caption" ? 0.2 : 0.5;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundTime(value: number) {
  return Math.round(value * 10) / 10;
}
