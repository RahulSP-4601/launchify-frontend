"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { activeCaptionAtTime, EditorSceneDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
import { insertedSceneAtTime, sourceTimeForEditorTime } from "@/components/project-editor-playback-map";
import { ProjectEditorPreviewState } from "@/components/project-editor-stage";
import { useAssetUrl } from "@/components/render-preview-studio";
import { ProjectDetail } from "@/lib/types";

export function useProjectEditorPreview(project: ProjectDetail, draft: ProjectEditorDraft): ProjectEditorPreviewState {
  const previewAsset = usePreviewAsset(project);
  const playback = useEditorPlayback(project, draft, previewAsset.url);
  return buildPreviewState(project, draft, playback, previewAsset);
}

function usePreviewAsset(project: ProjectDetail) {
  return useAssetUrl(
    project.id,
    "source",
    Boolean(project.preview_video?.storage_path),
    project.preview_video?.storage_path ?? "",
    undefined,
    project.preview_video?.variant ?? "preview",
  );
}

function useEditorPlayback(
  project: ProjectDetail,
  draft: ProjectEditorDraft,
  sourceUrl: string,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const totalDuration = useMemo(() => totalTimelineDuration(project, draft), [draft, project]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentTimeRef = useRef(0);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useManualPlaybackClock(currentTimeRef, isPlaying, totalDuration, setCurrentTime, setIsPlaying);
  useResetPlaybackState(sourceUrl, setCurrentTime, setIsPlaying);
  useSyncVideoFrame(videoRef, currentTime, draft.scenes, sourceUrl);

  const seek = (time: number) => {
    const nextTime = clampTime(time, totalDuration);
    setCurrentTime(nextTime);
  };

  const togglePlayback = () => {
    setIsPlaying((value) => !value);
  };

  return {
    currentTime,
    isPlaying,
    seek,
    sourceUrl,
    togglePlayback,
    totalDuration,
    videoRef,
  };
}

function buildPreviewState(
  project: ProjectDetail,
  draft: ProjectEditorDraft,
  playback: ReturnType<typeof useEditorPlayback>,
  previewAsset: ReturnType<typeof usePreviewAsset>,
): ProjectEditorPreviewState {
  return {
    activeCaption: activeCaptionAtTime(draft.captions, playback.currentTime),
    activeScene: insertedSceneAtTime(playback.currentTime, draft.scenes) ?? activeSceneAtTime(draft.scenes, playback.currentTime),
    currentTime: playback.currentTime,
    error: previewAsset.error || (project.preview_video ? "" : "No preview render is available yet for this project."),
    isPlaying: playback.isPlaying,
    isRenderedPreview: project.preview_video?.variant === "final",
    seek: playback.seek,
    seekToScene: (scene: EditorSceneDraft) => playback.seek(scene.start),
    sourceUrl: playback.sourceUrl,
    togglePlayback: playback.togglePlayback,
    totalDuration: playback.totalDuration,
    videoRef: playback.videoRef,
  };
}

function useManualPlaybackClock(
  currentTimeRef: React.RefObject<number>,
  isPlaying: boolean,
  totalDuration: number,
  setCurrentTime: (value: number) => void,
  setIsPlaying: (value: boolean) => void,
) {
  useEffect(() => {
    if (!isPlaying) return undefined;
    let frameId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;
      const nextValue = clampTime(currentTimeRef.current + deltaSeconds, totalDuration);
      if (nextValue >= totalDuration) {
        setIsPlaying(false);
      }
      setCurrentTime(nextValue);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [currentTimeRef, isPlaying, setCurrentTime, setIsPlaying, totalDuration]);
}

function useSyncVideoFrame(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  currentTime: number,
  scenes: ProjectEditorDraft["scenes"],
  sourceUrl: string,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;
    const nextSourceTime = sourceTimeForEditorTime(currentTime, scenes);
    if (Math.abs((video.currentTime || 0) - nextSourceTime) > 0.05) {
      video.currentTime = nextSourceTime;
    }
  }, [currentTime, scenes, sourceUrl, videoRef]);
}

function useResetPlaybackState(
  sourceUrl: string,
  setCurrentTime: (value: number) => void,
  setIsPlaying: (value: boolean) => void,
) {
  useEffect(() => {
    if (!sourceUrl) {
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [setCurrentTime, setIsPlaying, sourceUrl]);
}

function activeSceneAtTime(scenes: EditorSceneDraft[], currentTime: number) {
  if (!scenes.length) {
    return null;
  }
  const activeScene = scenes.find((scene) => currentTime >= scene.start && currentTime <= scene.end);
  if (activeScene) {
    return activeScene;
  }
  if (currentTime < scenes[0].start) {
    return scenes[0];
  }
  return scenes.findLast((scene) => currentTime >= scene.start) ?? scenes.at(-1) ?? null;
}

function totalTimelineDuration(project: ProjectDetail, draft: ProjectEditorDraft) {
  return Math.max(
    project.preview_video?.duration_seconds || 0,
    draft.scenes.at(-1)?.end || 0,
    draft.captions.at(-1)?.end || 0,
    1,
  );
}

function clampTime(time: number, totalDuration: number) {
  return Math.min(Math.max(time, 0), Math.max(totalDuration, 0));
}
