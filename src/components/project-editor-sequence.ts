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

type SequenceAudioInput = {
  end: number;
  id: string;
  sceneId: string | null;
  start: number;
  text: string;
  title: string;
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
    id: `clip-${scene.id}`,
    kind: inserted ? "inserted_card" : "source_video",
    locked: false,
    muted: false,
    scene_id: scene.id,
    source_end: sourceEnd,
    source_start: sourceStart,
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
    id: `caption-clip-${caption.id}`,
    kind: "caption" as const,
    locked: false,
    muted: false,
    scene_id: caption.sceneId,
    source_end: null,
    source_start: null,
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
    id: `audio-clip-${clip.id}`,
    kind: "voiceover" as const,
    locked: false,
    muted: false,
    scene_id: clip.sceneId,
    source_end: null,
    source_start: null,
    text: clip.text,
    timeline_end: clip.end,
    timeline_start: clip.start,
    title: clip.title,
    track_id: trackId,
  }));
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}
