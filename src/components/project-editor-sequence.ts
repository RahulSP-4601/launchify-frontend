"use client";

import type { ProjectEditorSequence } from "@/lib/types";

type SequenceSceneInput = {
  end: number;
  id: string;
  onScreenText: string;
  source: string;
  start: number;
  title: string;
};

type SequenceCaptionInput = {
  end: number;
  id: string;
  sceneId: string | null;
  start: number;
  text: string;
};

export type SequenceAudioInput = {
  end: number;
  id: string;
  assetPath?: string | null;
  contentType?: string | null;
  effectPreset?: string | null;
  fadeInSeconds?: number | null;
  fadeOutSeconds?: number | null;
  kind?: "voiceover" | "media_audio";
  loop?: boolean | null;
  sceneId: string | null;
  sourceProjectId?: string | null;
  start: number;
  stylePreset?: string | null;
  text: string;
  title: string;
  volumePercent?: number | null;
};

export function deriveEditorSequence(
  projectId: string,
  scenes: SequenceSceneInput[],
  captions: SequenceCaptionInput[],
  audioClips: SequenceAudioInput[] = [],
  playheadSeconds = 0,
  existingVersion = 1,
): ProjectEditorSequence {
  const videoTrackId = "track-video-1";
  const captionTrackId = "track-caption-1";
  const audioTrackId = "track-audio-1";
  const videoClips = buildVideoClips(scenes, videoTrackId);
  const captionClips = buildCaptionClips(captions, captionTrackId);
  const voiceoverClips = buildAudioClips(audioClips, audioTrackId);
  const tracks: ProjectEditorSequence["tracks"] = [
    { clips: videoClips, id: videoTrackId, kind: "video", locked: false, muted: false, name: "Video" },
    { clips: captionClips, id: captionTrackId, kind: "caption", locked: false, muted: false, name: "Captions" },
  ];
  if (voiceoverClips.length) {
    tracks.push({ clips: voiceoverClips, id: audioTrackId, kind: "audio", locked: false, muted: false, name: "Voiceover" });
  }
  return {
    duration_seconds: scenes.at(-1)?.end || 0,
    id: `sequence-${projectId}`,
    playhead_seconds: Math.min(Math.max(playheadSeconds, 0), scenes.at(-1)?.end || 0),
    tracks,
    version: Math.max(existingVersion, 1),
  };
}

function buildVideoClips(
  scenes: SequenceSceneInput[],
  trackId: string,
) {
  let sourceCursor = 0;
  return scenes.map((scene) => {
    const clip = buildVideoClip(scene, trackId, sourceCursor);
    sourceCursor = clip.source_end ?? sourceCursor;
    return clip;
  });
}

function buildVideoClip(
  scene: SequenceSceneInput,
  trackId: string,
  sourceCursor: number,
) {
  const duration = Math.max(scene.end - scene.start, 0.5);
  const inserted = scene.source === "inserted" || scene.id.startsWith("inserted-scene-");
  const sourceStart = inserted ? null : roundToTenth(sourceCursor);
  const sourceEnd = inserted ? null : roundToTenth(sourceCursor + duration);
  return {
    asset_path: null,
    content_type: null,
    effect_preset: null,
    id: `clip-${scene.id}`,
    kind: inserted ? "inserted_card" : "source_video",
    locked: false,
    muted: false,
    scene_id: scene.id,
    source_project_id: null,
    source_end: sourceEnd,
    source_start: sourceStart,
    style_preset: inserted ? "blank-card" : null,
    text: scene.onScreenText,
    timeline_end: scene.end,
    timeline_start: scene.start,
    title: scene.title,
    track_id: trackId,
  } as const;
}

function buildCaptionClips(
  captions: SequenceCaptionInput[],
  trackId: string,
) {
  return captions.map((caption) => ({
    asset_path: null,
    id: `caption-clip-${caption.id}`,
    kind: "caption" as const,
    content_type: null,
    effect_preset: null,
    locked: false,
    muted: false,
    scene_id: caption.sceneId,
    source_project_id: null,
    source_end: null,
    source_start: null,
    style_preset: "body",
    text: caption.text,
    timeline_end: caption.end,
    timeline_start: caption.start,
    title: caption.text.slice(0, 48) || "Caption",
    track_id: trackId,
  }));
}

function buildAudioClips(
  audioClips: SequenceAudioInput[],
  trackId: string,
) {
  return audioClips.map((clip) => ({
    asset_path: clip.assetPath ?? null,
    content_type: clip.contentType ?? null,
    effect_preset: clip.effectPreset ?? null,
    fade_in_seconds: clip.fadeInSeconds ?? 0,
    fade_out_seconds: clip.fadeOutSeconds ?? 0,
    id: `audio-clip-${clip.id}`,
    kind: clip.kind ?? "voiceover",
    locked: false,
    loop: clip.loop ?? false,
    muted: false,
    scene_id: clip.sceneId,
    source_project_id: clip.sourceProjectId ?? null,
    source_end: null,
    source_start: null,
    style_preset: clip.stylePreset ?? null,
    text: clip.text,
    timeline_end: clip.end,
    timeline_start: clip.start,
    title: clip.title,
    track_id: trackId,
    volume_percent: clip.volumePercent ?? 100,
  }));
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}
