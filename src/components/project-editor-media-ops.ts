"use client";

import type { ProjectEditorDraft } from "@/components/project-editor-draft";
import { projectDraftFromSequence } from "@/components/project-editor-sequence-ops";
import { roundTime } from "@/components/project-editor-sequence-utils";
import type { ProjectEditorMediaAsset, ProjectEditorSequence, ProjectEditorTrack } from "@/lib/types";

export function insertMediaAssetIntoDraft(
  draft: ProjectEditorDraft,
  asset: ProjectEditorMediaAsset,
) {
  const targetTrackId = targetTrackIdForAsset(draft.sequence, draft.selectedTrackId, asset.kind);
  const sequence = asset.kind === "video"
    ? insertVideoAssetSequence(draft, asset, targetTrackId)
    : insertAudioAssetSequence(draft, asset, targetTrackId);
  return asset.kind === "video"
    ? withSelectedMediaClip(projectDraftFromSequence(draft, sequence), asset, targetTrackId)
    : {
        ...draft,
        selectedClipId: selectedMediaClipId(asset, sequence),
        selectedTrackId: targetTrackId,
        sequence,
      };
}

function insertVideoAssetSequence(
  draft: ProjectEditorDraft,
  asset: ProjectEditorMediaAsset,
  trackId: string,
) {
  return insertMediaClipSequence(draft, asset, trackId, "media_video");
}

function insertAudioAssetSequence(
  draft: ProjectEditorDraft,
  asset: ProjectEditorMediaAsset,
  trackId: string,
) {
  return insertMediaClipSequence(draft, asset, trackId, "media_audio");
}

function insertMediaClipSequence(
  draft: ProjectEditorDraft,
  asset: ProjectEditorMediaAsset,
  trackId: string,
  clipKind: "media_audio" | "media_video",
) {
  const duration = inferredAssetDuration(draft, asset);
  const insertionStart = insertionStartForTrack(draft.sequence, trackId, draft.selectedClipId);
  const clip = buildMediaClip(asset, clipKind, trackId, insertionStart, duration);
  const tracks = upsertMediaTrack(draft.sequence, trackId, clipKind, clip, insertionStart, duration, draft.editMode);
  const nextTracks = clipKind === "media_video" && draft.editMode === "overwrite"
    ? reconcileCaptionTracksForOverwrite(
        tracks,
        draft.sequence.tracks.find((track) => track.id === trackId)?.clips ?? [],
        insertionStart,
        clip.timeline_end,
      )
    : tracks;
  return {
    ...draft.sequence,
    duration_seconds: Math.max(draft.sequence.duration_seconds, maxTrackEnd(nextTracks)),
    tracks: nextTracks,
    version: draft.sequence.version + 1,
  };
}

function upsertMediaTrack(
  sequence: ProjectEditorSequence,
  trackId: string,
  clipKind: "media_audio" | "media_video",
  clip: ProjectEditorTrack["clips"][number],
  insertionStart: number,
  duration: number,
  editMode: ProjectEditorDraft["editMode"],
) {
  const targetKind = clipKind === "media_audio" ? "audio" : "video";
  const tracks = sequence.tracks.some((track) => track.id === trackId)
    ? sequence.tracks
    : [...sequence.tracks, emptyTrack(trackId, targetKind)];
  return tracks.map((track) => mergeMediaClip(track, trackId, clip, insertionStart, duration, editMode));
}

function mergeMediaClip(
  track: ProjectEditorTrack,
  trackId: string,
  clip: ProjectEditorTrack["clips"][number],
  insertionStart: number,
  duration: number,
  editMode: ProjectEditorDraft["editMode"],
) {
  if (track.id !== trackId) {
    return editMode === "insert" ? shiftTrackAfterPoint(track, insertionStart, duration) : track;
  }
  const shifted = editMode === "insert"
    ? shiftTrackAfterPoint(track, insertionStart, duration)
    : overwriteTrackRange(track, insertionStart, clip.timeline_end);
  return {
    ...shifted,
    clips: [...shifted.clips, clip].sort((left, right) => left.timeline_start - right.timeline_start),
  };
}

function shiftTrackAfterPoint(track: ProjectEditorTrack, point: number, duration: number) {
  return {
    ...track,
    clips: track.clips.map((clip) =>
      clip.timeline_start >= point
        ? {
            ...clip,
            timeline_end: roundTime(clip.timeline_end + duration),
            timeline_start: roundTime(clip.timeline_start + duration),
          }
        : clip,
    ),
  };
}

function overwriteTrackRange(track: ProjectEditorTrack, start: number, end: number) {
  return {
    ...track,
    clips: track.clips.flatMap((clip) => splitClipAroundRange(clip, start, end)),
  };
}

function splitClipAroundRange(clip: ProjectEditorTrack["clips"][number], start: number, end: number) {
  if (clip.timeline_end <= start || clip.timeline_start >= end) {
    return [clip];
  }
  const keepsLeft = clip.timeline_start < start;
  const keepsRight = clip.timeline_end > end;
  const splitToken = Math.round(end * 10);
  const segments: ProjectEditorTrack["clips"][number][] = [];
  if (keepsLeft) {
    segments.push({
      ...clip,
      source_end: clipSourceEdge(clip, start),
      timeline_end: roundTime(start),
    });
  }
  if (keepsRight) {
    segments.push({
      ...clip,
      id: keepsLeft ? `${clip.id}-tail-${splitToken}` : clip.id,
      source_start: clipSourceEdge(clip, end),
      scene_id: keepsLeft && clip.scene_id ? `${clip.scene_id}-tail-${splitToken}` : clip.scene_id,
      timeline_start: roundTime(end),
    });
  }
  return segments.filter((segment) => segment.timeline_end - segment.timeline_start >= minDurationForClip(segment));
}

function reconcileCaptionTracksForOverwrite(
  tracks: ProjectEditorTrack[],
  previousTrackClips: ProjectEditorTrack["clips"],
  start: number,
  end: number,
) {
  const overwrittenScenes = previousTrackClips
    .filter((clip) => clip.kind === "source_video" && clip.scene_id)
    .map((clip) => describeOverwriteSplit(clip, start, end))
    .filter(isOverwriteSplit);
  if (!overwrittenScenes.length) {
    return tracks;
  }
  return tracks.map((track) =>
    track.kind === "caption"
      ? {
          ...track,
          clips: overwrittenScenes.reduce(
            (nextClips, split) => nextClips.flatMap((clip) => splitCaptionClipForOverwrite(clip, split)),
            track.clips,
          ),
        }
      : track,
  );
}

function describeOverwriteSplit(
  clip: ProjectEditorTrack["clips"][number],
  start: number,
  end: number,
) {
  if (!clip.scene_id || clip.timeline_end <= start || clip.timeline_start >= end) {
    return null;
  }
  const keepsLeft = clip.timeline_start < start;
  const keepsRight = clip.timeline_end > end;
  const splitToken = Math.round(end * 10);
  return {
    end,
    keepsLeft,
    keepsRight,
    rightSceneId: keepsRight
      ? keepsLeft
        ? `${clip.scene_id}-tail-${splitToken}`
        : clip.scene_id
      : null,
    sceneId: clip.scene_id,
    splitToken,
    start,
  };
}

function isOverwriteSplit(
  split: ReturnType<typeof describeOverwriteSplit>,
): split is NonNullable<ReturnType<typeof describeOverwriteSplit>> {
  return Boolean(split);
}

function splitCaptionClipForOverwrite(
  clip: ProjectEditorTrack["clips"][number],
  split: NonNullable<ReturnType<typeof describeOverwriteSplit>>,
) {
  if (clip.scene_id !== split.sceneId) {
    return [clip];
  }
  if (clip.timeline_end <= split.start || clip.timeline_start >= split.end) {
    return [clip];
  }
  const keepsLeft = clip.timeline_start < split.start && split.keepsLeft;
  const keepsRight = clip.timeline_end > split.end && split.keepsRight;
  const nextClips: ProjectEditorTrack["clips"] = [];
  if (keepsLeft) {
    nextClips.push({
      ...clip,
      timeline_end: roundTime(split.start),
    });
  }
  if (keepsRight) {
    nextClips.push({
      ...clip,
      id: keepsLeft ? `${clip.id}-tail-${split.splitToken}` : clip.id,
      scene_id: keepsLeft ? split.rightSceneId : clip.scene_id,
      timeline_start: roundTime(split.end),
    });
  }
  return nextClips.filter((nextClip) => nextClip.timeline_end - nextClip.timeline_start >= minDurationForClip(nextClip));
}

function clipSourceEdge(
  clip: ProjectEditorTrack["clips"][number],
  timelineEdge: number,
) {
  if (clip.source_start === null || clip.source_end === null) {
    return null;
  }
  const offset = roundTime(timelineEdge - clip.timeline_start);
  return roundTime(clip.source_start + offset);
}

function buildMediaClip(
  asset: ProjectEditorMediaAsset,
  clipKind: "media_audio" | "media_video",
  trackId: string,
  timelineStart: number,
  duration: number,
) {
  const clipId = `clip-${clipKind}-${asset.id}`;
  return {
    asset_path: asset.storage_path,
    content_type: asset.content_type,
    effect_preset: null,
    fade_in_seconds: 0,
    fade_out_seconds: 0,
    id: clipId,
    kind: clipKind,
    locked: false,
    loop: false,
    muted: false,
    scene_id: clipKind === "media_video" ? `scene-${clipId}` : null,
    source_project_id: asset.source_project_id,
    source_end: null,
    source_start: null,
    style_preset: clipKind === "media_video" ? "imported-video" : "imported-audio",
    text: asset.title,
    timeline_end: roundTime(timelineStart + duration),
    timeline_start: roundTime(timelineStart),
    title: asset.title,
    track_id: trackId,
    volume_percent: clipKind === "media_audio" ? 100 : null,
  };
}

function emptyTrack(trackId: string, kind: ProjectEditorTrack["kind"]): ProjectEditorTrack {
  return {
    clips: [],
    id: trackId,
    kind,
    locked: false,
    muted: false,
    name: kind === "audio" ? "Audio" : "Video",
  };
}

function insertionStartForTrack(sequence: ProjectEditorSequence, trackId: string, selectedClipId: string) {
  const selected = sequence.tracks
    .find((track) => track.id === trackId)
    ?.clips.find((clip) => clip.id === selectedClipId);
  return selected?.timeline_end ?? sequence.duration_seconds;
}

function inferredAssetDuration(draft: ProjectEditorDraft, asset: ProjectEditorMediaAsset) {
  if (asset.duration_seconds && asset.duration_seconds > 0) {
    return asset.duration_seconds;
  }
  const selected = draft.scenes.find((scene) => scene.id === draft.selectedSceneId);
  return Math.max((selected?.end ?? 5) - (selected?.start ?? 0), 1.5);
}

function targetTrackIdForAsset(
  sequence: ProjectEditorSequence,
  selectedTrackId: string,
  kind: ProjectEditorMediaAsset["kind"],
) {
  const trackKind = kind === "audio" ? "audio" : "video";
  const selectedTrack = sequence.tracks.find((track) => track.id === selectedTrackId && track.kind === trackKind);
  return selectedTrack?.id ?? sequence.tracks.find((track) => track.kind === trackKind)?.id ?? `track-${trackKind}-1`;
}

function selectedMediaClipId(asset: ProjectEditorMediaAsset, sequence: ProjectEditorSequence) {
  const match = sequence.tracks
    .flatMap((track) => track.clips)
    .find((clip) => clip.id === `clip-media_${asset.kind}-${asset.id}`);
  return match?.id ?? `clip-media_${asset.kind}-${asset.id}`;
}

function withSelectedMediaClip(
  draft: ProjectEditorDraft,
  asset: ProjectEditorMediaAsset,
  targetTrackId: string,
) {
  const clipId = `clip-media_video-${asset.id}`;
  const sceneId = `scene-${clipId}`;
  const matchingSceneId = draft.scenes.find((scene) => scene.id === sceneId)?.id ?? "";
  return {
    ...draft,
    selectedClipId: clipId,
    selectedSceneId: matchingSceneId,
    selectedTrackId: targetTrackId,
  };
}

function maxTrackEnd(tracks: ProjectEditorTrack[]) {
  return tracks.reduce((max, track) => Math.max(max, track.clips.at(-1)?.timeline_end ?? 0), 0);
}

function minDurationForClip(clip: ProjectEditorTrack["clips"][number]) {
  return clip.kind === "caption" ? 0.2 : 0.5;
}
