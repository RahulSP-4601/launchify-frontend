"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { activeCaptionAtTime, EditorSceneDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
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

  usePlaybackEvents(videoRef, totalDuration, setCurrentTime, setIsPlaying);
  useResetPlaybackState(sourceUrl, setCurrentTime, setIsPlaying);

  const seek = (time: number) => {
    const nextTime = clampTime(time, totalDuration);
    const video = videoRef.current;
    if (video) video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
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
    activeScene: activeSceneAtTime(draft.scenes, playback.currentTime),
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

function usePlaybackEvents(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  totalDuration: number,
  setCurrentTime: (value: number) => void,
  setIsPlaying: (value: boolean) => void,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const syncTime = () => setCurrentTime(video.currentTime || 0);
    const syncPause = () => setIsPlaying(false);
    const syncPlay = () => setIsPlaying(true);
    const syncEnded = () => {
      setIsPlaying(false);
      setCurrentTime(video.duration || totalDuration);
    };
    video.addEventListener("timeupdate", syncTime);
    video.addEventListener("pause", syncPause);
    video.addEventListener("play", syncPlay);
    video.addEventListener("ended", syncEnded);
    return () => {
      video.removeEventListener("timeupdate", syncTime);
      video.removeEventListener("pause", syncPause);
      video.removeEventListener("play", syncPlay);
      video.removeEventListener("ended", syncEnded);
    };
  }, [setCurrentTime, setIsPlaying, totalDuration, videoRef]);
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
  return (
    project.preview_video?.duration_seconds ||
    draft.scenes.at(-1)?.end ||
    draft.captions.at(-1)?.end ||
    1
  );
}

function clampTime(time: number, totalDuration: number) {
  return Math.min(Math.max(time, 0), Math.max(totalDuration, 0));
}
