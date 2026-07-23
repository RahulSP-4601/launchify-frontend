"use client";

import type { ProjectEditorDraft } from "@/components/project-editor-draft";
import type { ProjectEditorClip, ProjectEditorTrack } from "@/lib/types";

export function mapSceneClip(
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
    source: sceneSourceForClip(clip, prior?.source),
    spokenLine: clip.text || prior?.spokenLine || "",
    start: clip.timeline_start,
    title: clip.title || prior?.title || `Scene ${index + 1}`,
  };
}

function sceneSourceForClip(
  clip: ProjectEditorClip,
  priorSource: ProjectEditorDraft["scenes"][number]["source"] | undefined,
) {
  if (clip.kind === "inserted_card") return "inserted";
  if (clip.kind === "media_video") return "imported";
  return priorSource ?? "edit_plan";
}

export function mapCaptionClip(clip: ProjectEditorClip) {
  return {
    end: clip.timeline_end,
    id: clip.id.replace("caption-clip-", ""),
    sceneId: clip.scene_id,
    start: clip.timeline_start,
    text: clip.text,
  };
}

export function buildInsertedClip(
  trackId: string,
  insertionStart: number,
  duration: number,
): ProjectEditorClip {
  return {
    asset_path: null,
    content_type: null,
    effect_preset: null,
    id: `clip-inserted-${Math.round(insertionStart * 10)}`,
    kind: "inserted_card",
    locked: false,
    muted: false,
    scene_id: `inserted-scene-${Math.round(insertionStart * 10)}`,
    source_project_id: null,
    source_end: null,
    source_start: null,
    style_preset: "blank-card",
    text: "Inserted screen placeholder.",
    timeline_end: roundTime(insertionStart + duration),
    timeline_start: roundTime(insertionStart),
    title: "Inserted Screen",
    track_id: trackId,
  };
}

export function shiftClip(clip: ProjectEditorClip, delta: number) {
  return {
    ...clip,
    timeline_end: roundTime(clip.timeline_end + delta),
    timeline_start: roundTime(clip.timeline_start + delta),
  };
}

export function clipDuration(clip: ProjectEditorClip) {
  return Math.max(clip.timeline_end - clip.timeline_start, minDurationForClip(clip));
}

export function maxTrackEnd(tracks: ProjectEditorTrack[]) {
  return tracks.reduce((max, track) => Math.max(max, track.clips.at(-1)?.timeline_end ?? 0), 0);
}

export function relatedClipIds(
  sequence: { tracks: ProjectEditorTrack[] },
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

export function rollLinkedClip(
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
      timeline_end: roundTime(
        Math.max(Math.min(clip.timeline_end, boundary), clip.timeline_start + minDurationForClip(clip)),
      ),
    };
  }
  if (clip.scene_id && clip.scene_id === nextClip.scene_id) {
    return {
      ...clip,
      timeline_start: roundTime(
        Math.min(Math.max(clip.timeline_start, boundary), clip.timeline_end - minDurationForClip(clip)),
      ),
    };
  }
  return clip;
}

export function minDurationForClip(clip: ProjectEditorClip) {
  return clip.kind === "caption" ? 0.2 : 0.5;
}

export function roundTime(value: number) {
  return Math.round(value * 10) / 10;
}

export function draftSourceProjectId(clip: ProjectEditorClip) {
  return clip.source_project_id ?? null;
}

export function draftScenesFromTracks(
  tracks: ProjectEditorTrack[],
  priorScenes: Map<string, ProjectEditorDraft["scenes"][number]>,
) {
  return primaryVideoTrack(tracks).clips.map((clip, index) => mapSceneClip(clip, priorScenes, index));
}

function primaryVideoTrack(tracks: ProjectEditorTrack[]) {
  return tracks.find((track) => track.kind === "video" && track.id === "track-video-1")
    ?? tracks.find((track) => track.kind === "video")
    ?? { clips: [] };
}
