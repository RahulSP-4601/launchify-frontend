"use client";

import type { ProjectEditorClip, ProjectEditorSequence, ProjectEditorTrack } from "@/lib/types";
import type { ProjectEditorDraft } from "@/components/project-editor-draft";

export type SequenceOperation =
  | { type: "add_overlay_callout"; clipId: string }
  | { type: "extract"; clipId: string; trackId: string }
  | { type: "insert_inserted"; durationSeconds: number; afterClipId: string; trackId: string }
  | { type: "lift"; clipId: string; trackId: string }
  | { type: "overwrite_inserted"; durationSeconds: number; afterClipId: string; trackId: string }
  | { type: "roll_boundary"; clipId: string; deltaSeconds: number; trackId: string }
  | { type: "ripple_delete"; clipId: string; trackId: string }
  | { type: "slide"; clipId: string; deltaSeconds: number; trackId: string }
  | { type: "slip"; clipId: string; deltaSeconds: number; trackId: string };

export function applySequenceOperation(
  draft: ProjectEditorDraft,
  operation: SequenceOperation,
) {
  const nextSequence = reduceSequence(draft.sequence, operation);
  return projectDraftFromSequence(draft, nextSequence);
}

export function reduceSequence(
  sequence: ProjectEditorSequence,
  operation: SequenceOperation,
) {
  if (!operationAllowed(sequence, operation)) {
    return sequence;
  }
  switch (operation.type) {
    case "add_overlay_callout":
      return addOverlayCallout(sequence, operation.clipId);
    case "extract":
    case "ripple_delete":
      return rippleDelete(sequence, operation.trackId, operation.clipId);
    case "insert_inserted":
      return insertGap(sequence, operation.trackId, operation.afterClipId, operation.durationSeconds);
    case "lift":
      return liftClip(sequence, operation.trackId, operation.clipId);
    case "overwrite_inserted":
      return insertOverwrite(sequence, operation.trackId, operation.afterClipId, operation.durationSeconds);
    case "roll_boundary":
      return rollBoundary(sequence, operation.trackId, operation.clipId, operation.deltaSeconds);
    case "slip":
      return slipClip(sequence, operation.trackId, operation.clipId, operation.deltaSeconds);
    case "slide":
      return slideClip(sequence, operation.trackId, operation.clipId, operation.deltaSeconds);
  }
}

function operationAllowed(
  sequence: ProjectEditorSequence,
  operation: SequenceOperation,
) {
  if (operation.type === "add_overlay_callout") {
    const target = findClipById(sequence, operation.clipId);
    if (!target) return false;
    return !isTrackLocked(sequence, target.track_id) && !target.locked;
  }
  const target = targetClipForOperation(sequence, operation);
  if (!target) return false;
  const linkedClipIds = touchedClipIds(sequence, operation, target);
  return !sequence.tracks.some(
    (track) =>
      (track.locked && track.clips.some((clip) => linkedClipIds.has(clip.id))) ||
      track.clips.some((clip) => linkedClipIds.has(clip.id) && clip.locked),
  );
}

function touchedClipIds(
  sequence: ProjectEditorSequence,
  operation: Exclude<SequenceOperation, { type: "add_overlay_callout" }>,
  target: ProjectEditorClip,
) {
  const clipIds = relatedClipIds(sequence, target);
  if (operation.type !== "roll_boundary") {
    return clipIds;
  }
  const nextClip = adjacentClip(sequence, operation.trackId, operation.clipId, "next");
  if (!nextClip) {
    return clipIds;
  }
  relatedClipIds(sequence, nextClip).forEach((clipId) => clipIds.add(clipId));
  return clipIds;
}

function targetClipForOperation(
  sequence: ProjectEditorSequence,
  operation: Exclude<SequenceOperation, { type: "add_overlay_callout" }>,
) {
  if ("afterClipId" in operation) {
    return findClip(sequence, operation.trackId, operation.afterClipId);
  }
  return findClip(sequence, operation.trackId, operation.clipId);
}

export function projectDraftFromSequence(
  draft: ProjectEditorDraft,
  sequence: ProjectEditorSequence,
) {
  const priorScenes = new Map(draft.scenes.map((scene) => [scene.id, scene]));
  const videoTrack = sequence.tracks.find((track) => track.kind === "video");
  const captionTrack = sequence.tracks.find((track) => track.kind === "caption");
  const scenes = (videoTrack?.clips ?? []).map((clip, index) => mapSceneClip(clip, priorScenes, index));
  const captions = (captionTrack?.clips ?? []).map(mapCaptionClip);
  return {
    ...draft,
    captions,
    scenes,
    selectedSceneId: scenes.find((scene) => scene.id === draft.selectedSceneId)?.id ?? scenes[0]?.id ?? "",
    sequence,
  };
}

function addOverlayCallout(
  sequence: ProjectEditorSequence,
  clipId: string,
) {
  const target = findClipById(sequence, clipId);
  if (!target) return sequence;
  const overlayTrack = ensureTrack(sequence.tracks, "overlay", "Overlay");
  const overlayTrackId = overlayTrack.id;
  const overlayClip: ProjectEditorClip = {
    id: `${clipId}-overlay-${Math.round(target.timeline_start * 10)}`,
    kind: "inserted_card",
    locked: false,
    muted: false,
    scene_id: `${target.scene_id ?? clipId}-overlay`,
    source_end: null,
    source_start: null,
    text: target.text || target.title || "Overlay callout",
    timeline_end: target.timeline_end,
    timeline_start: target.timeline_start,
    title: `${target.title || "Scene"} Callout`,
    track_id: overlayTrackId,
  };
  const tracks = sequence.tracks.some((track) => track.id === overlayTrackId)
    ? sequence.tracks.map((track) => track.id === overlayTrackId ? { ...track, clips: [...track.clips, overlayClip] } : track)
    : [...sequence.tracks, { ...overlayTrack, clips: [overlayClip] }];
  return finalizeSequence(sequence, tracks);
}

function rippleDelete(
  sequence: ProjectEditorSequence,
  trackId: string,
  clipId: string,
) {
  const target = findClip(sequence, trackId, clipId);
  if (!target) return sequence;
  const duration = clipDuration(target);
  const linkedClipIds = relatedClipIds(sequence, target);
  const tracks = sequence.tracks.map((track) => ({
    ...track,
    clips: track.clips
      .filter((clip) => !linkedClipIds.has(clip.id))
      .map((clip) => clip.timeline_start >= target.timeline_end ? shiftClip(clip, -duration) : clip),
  }));
  return finalizeSequence(sequence, tracks);
}

function liftClip(
  sequence: ProjectEditorSequence,
  trackId: string,
  clipId: string,
) {
  const target = findClip(sequence, trackId, clipId);
  if (!target) return sequence;
  const linkedClipIds = relatedClipIds(sequence, target);
  const replacement: ProjectEditorClip = {
    ...target,
    id: `${clipId}-gap`,
    kind: "inserted_card",
    scene_id: `${target.scene_id ?? clipId}-gap`,
    source_end: null,
    source_start: null,
    text: "Gap placeholder",
    title: "Lifted Gap",
  };
  const tracks = sequence.tracks.map((track) => {
    if (track.id === trackId) {
      return {
        ...track,
        clips: track.clips.flatMap((clip) => clip.id === clipId ? [replacement] : [clip]),
      };
    }
    return {
      ...track,
      clips: track.clips.filter((clip) => !linkedClipIds.has(clip.id)),
    };
  });
  return finalizeSequence(sequence, tracks);
}

function insertOverwrite(
  sequence: ProjectEditorSequence,
  trackId: string,
  afterClipId: string,
  durationSeconds: number,
) {
  const target = findClip(sequence, trackId, afterClipId);
  if (!target) return sequence;
  const duration = Math.max(durationSeconds, 0.5);
  const insertionStart = target.timeline_end;
  const inserted = buildInsertedClip(trackId, insertionStart, duration);
  const tracks = sequence.tracks.map((track) => ({
    ...track,
    clips: track.clips.flatMap((clip) => {
      if (clip.id === afterClipId) {
        return [clip, inserted];
      }
      return clip.timeline_start >= insertionStart ? [shiftClip(clip, duration)] : [clip];
    }),
  }));
  return finalizeSequence(sequence, tracks);
}

function insertGap(
  sequence: ProjectEditorSequence,
  trackId: string,
  afterClipId: string,
  durationSeconds: number,
) {
  const target = findClip(sequence, trackId, afterClipId);
  if (!target) return sequence;
  const duration = Math.max(durationSeconds, 0.5);
  const insertionStart = target.timeline_end;
  const inserted = buildInsertedClip(trackId, insertionStart, duration);
  const tracks = sequence.tracks.map((track) => {
    if (track.id === trackId) {
      return {
        ...track,
        clips: track.clips.flatMap((clip) => {
          if (clip.id === afterClipId) return [clip, inserted];
          return clip.timeline_start >= insertionStart ? [shiftClip(clip, duration)] : [clip];
        }),
      };
    }
    return {
      ...track,
      clips: track.clips.map((clip) => clip.timeline_start >= insertionStart ? shiftClip(clip, duration) : clip),
    };
  });
  return finalizeSequence(sequence, tracks);
}

function slipClip(
  sequence: ProjectEditorSequence,
  trackId: string,
  clipId: string,
  deltaSeconds: number,
) {
  const tracks = sequence.tracks.map((track) => track.id !== trackId ? track : ({
    ...track,
    clips: track.clips.map((clip) => clip.id !== clipId ? clip : {
      ...clip,
      source_end: clip.source_end === null ? null : roundTime(Math.max((clip.source_end ?? 0) + deltaSeconds, clip.source_start ?? 0)),
      source_start: clip.source_start === null ? null : roundTime(Math.max((clip.source_start ?? 0) + deltaSeconds, 0)),
    }),
  }));
  return finalizeSequence(sequence, tracks);
}

function slideClip(
  sequence: ProjectEditorSequence,
  trackId: string,
  clipId: string,
  deltaSeconds: number,
) {
  const track = sequence.tracks.find((item) => item.id === trackId);
  if (!track) return sequence;
  const index = track.clips.findIndex((clip) => clip.id === clipId);
  if (index <= 0 || index >= track.clips.length - 1) return sequence;
  const previous = track.clips[index - 1];
  const next = track.clips[index + 1];
  const minDelta = -(clipDuration(previous) - 0.5);
  const maxDelta = clipDuration(next) - 0.5;
  const delta = Math.min(Math.max(deltaSeconds, minDelta), maxDelta);
  const nextTrack = {
    ...track,
    clips: track.clips.map((clip, clipIndex) => {
      if (clipIndex === index - 1) return { ...clip, timeline_end: roundTime(clip.timeline_end + delta) };
      if (clipIndex === index) return { ...clip, timeline_end: roundTime(clip.timeline_end + delta), timeline_start: roundTime(clip.timeline_start + delta) };
      if (clipIndex === index + 1) return { ...clip, timeline_start: roundTime(clip.timeline_start + delta) };
      return clip;
    }),
  };
  return finalizeSequence(sequence, sequence.tracks.map((item) => item.id === trackId ? nextTrack : item));
}

function rollBoundary(
  sequence: ProjectEditorSequence,
  trackId: string,
  clipId: string,
  deltaSeconds: number,
) {
  const track = sequence.tracks.find((item) => item.id === trackId);
  if (!track) return sequence;
  const clipIndex = track.clips.findIndex((clip) => clip.id === clipId);
  if (clipIndex < 0 || clipIndex >= track.clips.length - 1) return sequence;
  const currentClip = track.clips[clipIndex];
  const nextClip = track.clips[clipIndex + 1];
  const minDelta = -(clipDuration(currentClip) - minDurationForClip(currentClip));
  const maxDelta = clipDuration(nextClip) - minDurationForClip(nextClip);
  const delta = Math.min(Math.max(deltaSeconds, minDelta), maxDelta);
  const boundary = roundTime(currentClip.timeline_end + delta);
  const tracks = sequence.tracks.map((item) => ({
    ...item,
    clips: item.clips.map((clip) => rollLinkedClip(clip, currentClip, nextClip, boundary)),
  }));
  return finalizeSequence(sequence, tracks);
}

function mapSceneClip(
  clip: ProjectEditorClip,
  priorScenes: Map<string, ProjectEditorDraft["scenes"][number]>,
  index: number,
) {
  const prior = priorScenes.get(clip.scene_id ?? "");
  return {
    end: clip.timeline_end,
    id: clip.scene_id ?? clip.id,
    onScreenText: clip.text || prior?.onScreenText || "",
    sceneNumber: index + 1,
    source: clip.kind === "inserted_card" ? "inserted" : prior?.source ?? "edit_plan",
    spokenLine: clip.text || prior?.spokenLine || "",
    start: clip.timeline_start,
    title: clip.title || prior?.title || `Scene ${index + 1}`,
  };
}

function mapCaptionClip(clip: ProjectEditorClip) {
  return {
    end: clip.timeline_end,
    id: clip.id.replace("caption-clip-", ""),
    sceneId: clip.scene_id,
    start: clip.timeline_start,
    text: clip.text,
  };
}

function finalizeSequence(
  sequence: ProjectEditorSequence,
  tracks: ProjectEditorTrack[],
) {
  const normalizedTracks = tracks.map((track) => ({
    ...track,
    clips: normalizeTrackClips(track),
  }));
  return {
    ...sequence,
    duration_seconds: maxTrackEnd(normalizedTracks),
    tracks: normalizedTracks,
    version: sequence.version + 1,
  };
}

function normalizeTrackClips(track: ProjectEditorTrack) {
  return [...track.clips]
    .sort((left, right) => left.timeline_start - right.timeline_start)
    .map((clip) => ({
      ...clip,
      timeline_end: roundTime(Math.max(clip.timeline_end, clip.timeline_start + minDurationForClip(clip))),
      timeline_start: roundTime(Math.max(clip.timeline_start, 0)),
    }));
}

function findClip(
  sequence: ProjectEditorSequence,
  trackId: string,
  clipId: string,
) {
  return sequence.tracks.find((track) => track.id === trackId)?.clips.find((clip) => clip.id === clipId) ?? null;
}

function findClipById(sequence: ProjectEditorSequence, clipId: string) {
  return sequence.tracks.flatMap((track) => track.clips).find((clip) => clip.id === clipId) ?? null;
}

function ensureTrack(
  tracks: ProjectEditorTrack[],
  kind: ProjectEditorTrack["kind"],
  name: string,
) {
  return tracks.find((track) => track.kind === kind) ?? {
    clips: [],
    id: `track-${kind}-${tracks.filter((track) => track.kind === kind).length + 1}`,
    kind,
    locked: false,
    muted: false,
    name,
  };
}

function adjacentClip(
  sequence: ProjectEditorSequence,
  trackId: string,
  clipId: string,
  direction: "next" | "previous",
) {
  const track = sequence.tracks.find((item) => item.id === trackId);
  if (!track) return null;
  const clipIndex = track.clips.findIndex((clip) => clip.id === clipId);
  if (clipIndex < 0) return null;
  const nextIndex = direction === "next" ? clipIndex + 1 : clipIndex - 1;
  return track.clips[nextIndex] ?? null;
}

function isTrackLocked(sequence: ProjectEditorSequence, trackId: string) {
  return sequence.tracks.some((track) => track.id === trackId && track.locked);
}

function buildInsertedClip(
  trackId: string,
  insertionStart: number,
  duration: number,
) {
  return {
    id: `clip-inserted-${Math.round(insertionStart * 10)}`,
    kind: "inserted_card" as const,
    locked: false,
    muted: false,
    scene_id: `inserted-scene-${Math.round(insertionStart * 10)}`,
    source_end: null,
    source_start: null,
    text: "Inserted screen placeholder.",
    timeline_end: roundTime(insertionStart + duration),
    timeline_start: roundTime(insertionStart),
    title: "Inserted Screen",
    track_id: trackId,
  };
}

function shiftClip(clip: ProjectEditorClip, delta: number) {
  return {
    ...clip,
    timeline_end: roundTime(clip.timeline_end + delta),
    timeline_start: roundTime(clip.timeline_start + delta),
  };
}

function clipDuration(clip: ProjectEditorClip) {
  return Math.max(clip.timeline_end - clip.timeline_start, minDurationForClip(clip));
}

function maxTrackEnd(tracks: ProjectEditorTrack[]) {
  return tracks.reduce((max, track) => Math.max(max, track.clips.at(-1)?.timeline_end ?? 0), 0);
}

function relatedClipIds(
  sequence: ProjectEditorSequence,
  target: ProjectEditorClip,
) {
  if (!target.scene_id) {
    return new Set([target.id]);
  }
  return new Set(
    sequence.tracks.flatMap((track) =>
      track.clips
        .filter((clip) => clip.id === target.id || clip.scene_id === target.scene_id)
        .map((clip) => clip.id),
    ),
  );
}

function rollLinkedClip(
  clip: ProjectEditorClip,
  currentClip: ProjectEditorClip,
  nextClip: ProjectEditorClip,
  boundary: number,
) {
  if (clip.id === currentClip.id) {
    return { ...clip, timeline_end: boundary };
  }
  if (clip.id === nextClip.id) {
    return { ...clip, timeline_start: boundary };
  }
  if (clip.scene_id && clip.scene_id === currentClip.scene_id) {
    return {
      ...clip,
      timeline_end: roundTime(Math.max(Math.min(clip.timeline_end, boundary), clip.timeline_start + minDurationForClip(clip))),
    };
  }
  if (clip.scene_id && clip.scene_id === nextClip.scene_id) {
    return {
      ...clip,
      timeline_start: roundTime(Math.min(Math.max(clip.timeline_start, boundary), clip.timeline_end - minDurationForClip(clip))),
    };
  }
  return clip;
}

function minDurationForClip(clip: ProjectEditorClip) {
  return clip.kind === "caption" ? 0.2 : 0.5;
}

function roundTime(value: number) {
  return Math.round(value * 10) / 10;
}
