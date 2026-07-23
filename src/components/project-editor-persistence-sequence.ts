"use client";

import { deriveEditorSequence, type SequenceAudioInput } from "@/components/project-editor-sequence";
import type { ProjectEditorDraft } from "@/components/project-editor-draft";
import type { ProjectEditorClip, ProjectEditorSequence, ProjectEditorTrack } from "@/lib/types";

export function syncSequenceWithDraft(draft: ProjectEditorDraft): ProjectEditorSequence {
  const fallback = deriveEditorSequence(
    draft.projectId,
    draft.scenes,
    draft.captions,
    extractAudioInputs(draft.sequence),
    draft.sequence?.playhead_seconds ?? 0,
    draft.sequence?.version ?? 1,
  );
  const base = draft.sequence ?? fallback;
  const videoTrackId = base.tracks.find((track) => track.kind === "video")?.id ?? "track-video-1";
  const captionTrackId = base.tracks.find((track) => track.kind === "caption")?.id ?? "track-caption-1";
  const videoTrack = base.tracks.find((track) => track.id === videoTrackId);
  const captionTrack = base.tracks.find((track) => track.id === captionTrackId);
  const videoClips = syncVideoClips(videoTrack?.clips ?? [], fallback.tracks.find((track) => track.kind === "video")?.clips ?? []);
  const captionClips = syncCaptionClips(captionTrack?.clips ?? [], fallback.tracks.find((track) => track.kind === "caption")?.clips ?? []);
  const tracks = mergeSequenceTracks(base.tracks, videoTrackId, captionTrackId, videoClips, captionClips);
  const duration = maxTrackEnd(tracks);
  return {
    ...base,
    duration_seconds: duration,
    playhead_seconds: Math.min(Math.max(base.playhead_seconds, 0), duration),
    tracks,
  };
}

function syncVideoClips(existingClips: ProjectEditorClip[], generatedClips: ProjectEditorClip[]) {
  const existingBySceneId = new Map(existingClips.filter((clip) => clip.scene_id).map((clip) => [clip.scene_id as string, clip]));
  const syncedClips = generatedClips.map((clip) => {
    const existing = clip.scene_id ? existingBySceneId.get(clip.scene_id) : null;
    return existing ? { ...existing, scene_id: clip.scene_id, text: clip.text, timeline_end: clip.timeline_end, timeline_start: clip.timeline_start, title: clip.title, track_id: clip.track_id } : clip;
  });
  return mergePreservedClips(existingClips, syncedClips);
}

function syncCaptionClips(existingClips: ProjectEditorClip[], generatedClips: ProjectEditorClip[]) {
  const existingById = new Map(existingClips.map((clip) => [clip.id, clip]));
  const syncedClips = generatedClips.map((clip) => {
    const existing = existingById.get(clip.id);
    return existing ? { ...existing, scene_id: clip.scene_id, text: clip.text, timeline_end: clip.timeline_end, timeline_start: clip.timeline_start, title: clip.title, track_id: clip.track_id } : clip;
  });
  return mergePreservedClips(existingClips, syncedClips);
}

export function extractAudioInputs(sequence: ProjectEditorSequence | undefined): SequenceAudioInput[] {
  return (sequence?.tracks ?? [])
    .filter((track) => track.kind === "audio")
    .flatMap((track) => track.clips)
    .map((clip) => ({
      assetPath: clip.asset_path ?? null,
      contentType: clip.content_type ?? null,
      end: clip.timeline_end,
      effectPreset: clip.effect_preset ?? null,
      fadeInSeconds: clip.fade_in_seconds ?? 0,
      fadeOutSeconds: clip.fade_out_seconds ?? 0,
      id: clip.id.replace("audio-clip-", ""),
      kind: clip.kind === "media_audio" ? "media_audio" : "voiceover",
      loop: clip.loop ?? false,
      sceneId: clip.scene_id,
      sourceProjectId: clip.source_project_id ?? null,
      start: clip.timeline_start,
      stylePreset: clip.style_preset ?? null,
      text: clip.text,
      title: clip.title,
      volumePercent: clip.volume_percent ?? 100,
    }));
}

function mergeSequenceTracks(
  tracks: ProjectEditorTrack[],
  videoTrackId: string,
  captionTrackId: string,
  videoClips: ProjectEditorClip[],
  captionClips: ProjectEditorClip[],
) {
  return upsertTrack(
    upsertTrack(tracks, { clips: videoClips, id: videoTrackId, kind: "video", locked: false, muted: false, name: "Video" }),
    { clips: captionClips, id: captionTrackId, kind: "caption", locked: false, muted: false, name: "Captions" },
  );
}

function upsertTrack(tracks: ProjectEditorTrack[], nextTrack: ProjectEditorTrack) {
  const existing = tracks.find((track) => track.id === nextTrack.id);
  if (!existing) return [...tracks, nextTrack];
  return tracks.map((track) => track.id === nextTrack.id ? { ...existing, clips: nextTrack.clips, kind: nextTrack.kind, name: nextTrack.name } : track);
}

function mergePreservedClips(existingClips: ProjectEditorClip[], syncedClips: ProjectEditorClip[]) {
  const syncedIds = new Set(syncedClips.map((clip) => clip.id));
  const syncedSceneIds = new Set(syncedClips.map((clip) => clip.scene_id).filter(Boolean));
  return [
    ...syncedClips,
    ...existingClips.filter((clip) => !syncedIds.has(clip.id) && (!clip.scene_id || !syncedSceneIds.has(clip.scene_id))),
  ].sort((left, right) => left.timeline_start - right.timeline_start);
}

function maxTrackEnd(tracks: ProjectEditorTrack[]) {
  return tracks.reduce((max, track) => Math.max(max, track.clips.at(-1)?.timeline_end ?? 0), 0);
}
