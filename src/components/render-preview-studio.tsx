"use client";

import { useQuery } from "@tanstack/react-query";
import { Dispatch, RefObject, SetStateAction, useEffect, useMemo, useRef, useState } from "react";

import { fetchProjectAsset, fetchRenderOutput } from "@/lib/api";
import { EditPlanScene, ProjectDetail } from "@/lib/types";
import {
  activeSceneForPreviewTime,
  activeSceneForSourceTime,
  buildSceneTimeline,
  clampSourceTimeToScenes,
  normalizeScenePlaybackTime,
  SceneTimelineEntry,
  sourceTimeForRenderedPreview,
} from "@/components/render-preview-studio-timeline";
import {
  PreviewPlayer,
  PreviewSidebar,
  PreviewStudioHeader,
  PreviewInfoGrid,
} from "@/components/render-preview-studio-panels";

type PreviewStudioProps = {
  project: ProjectDetail;
  sourceError: string;
  sourceUrl: string;
  usesRenderedPreview: boolean;
  voiceoverError: string;
  voiceoverUrl: string;
};

export function PreviewStudioCard(props: PreviewStudioProps) {
  const preview = usePreviewPlayback(props.project, props.voiceoverUrl, props.usesRenderedPreview);

  return (
    <section className="rounded-[30px] border border-black/6 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-6 lg:p-7 text-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
      <PreviewStudioHeader project={props.project} />
      <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <div className="space-y-4">
          <PreviewPlayer
            activeHighlight={preview.activeHighlight}
            activeScene={preview.activeScene}
            activeZoom={preview.activeZoom}
            audioRef={preview.audioRef}
            project={props.project}
            sceneTimeline={preview.sceneTimeline}
            sourceError={props.sourceError}
            sourceUrl={props.sourceUrl}
            totalDuration={preview.totalDuration}
            usesRenderedPreview={props.usesRenderedPreview}
            videoRef={preview.videoRef}
            voiceoverUrl={props.voiceoverUrl}
          />
          <PreviewInfoGrid project={props.project} voiceoverUrl={props.voiceoverUrl} activeScene={preview.activeScene} />
        </div>
        <PreviewSidebar
          activeSceneNumber={preview.activeScene?.scene_number ?? null}
          project={props.project}
          sceneTimeline={preview.sceneTimeline}
          scenes={preview.scenes}
          usesRenderedPreview={props.usesRenderedPreview}
          setSelectedScene={preview.setSelectedScene}
          videoRef={preview.videoRef}
          voiceoverError={props.voiceoverError}
        />
      </div>
    </section>
  );
}

export function useAssetObjectUrl(
  projectId: string,
  key: "source" | "voiceover",
  enabled: boolean,
  renderVariant?: "preview" | "final",
) {
  const query = useQuery({
    queryKey: ["project-asset", projectId, key, renderVariant ?? ""],
    queryFn: () => {
      if (renderVariant) {
        return fetchRenderOutput(projectId, renderVariant);
      }
      return fetchProjectAsset(projectId, key);
    },
    enabled,
    staleTime: 60_000,
    retry: false,
  });
  const objectUrl = useMemo(() => (query.data ? URL.createObjectURL(query.data) : ""), [query.data]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return {
    error: query.error instanceof Error ? query.error.message : "",
    objectUrl,
    pending: enabled && query.isPending,
  };
}

function usePreviewPlayback(project: ProjectDetail, voiceoverUrl: string, usesRenderedPreview: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedScene, setSelectedScene] = useState<number | null>(project.edit_plan?.scenes[0]?.scene_number ?? null);
  const scenes = useMemo(() => project.edit_plan?.scenes ?? [], [project.edit_plan?.scenes]);
  const sceneTimeline = useMemo(
    () => buildSceneTimeline(scenes, project.recording_session),
    [project.recording_session, scenes],
  );
  const activeScene = (
    usesRenderedPreview
      ? activeSceneForPreviewTime(sceneTimeline, currentTime)
      : activeSceneForSourceTime(scenes, currentTime)
  ) ?? scenes.find((scene) => scene.scene_number === selectedScene) ?? null;
  const motionTime = usesRenderedPreview ? sourceTimeForRenderedPreview(sceneTimeline, currentTime) : currentTime;
  const activeHighlight = activeHighlightForTime(activeScene, motionTime);
  const activeZoom = activeZoomForTime(activeScene, motionTime);

  useSelectedScene(activeScene, setSelectedScene);
  useVoiceoverSync(project, voiceoverUrl, videoRef, audioRef, usesRenderedPreview);
  usePlaybackTracking(sceneTimeline, videoRef, setCurrentTime, usesRenderedPreview);

  return {
    activeHighlight,
    activeScene,
    activeZoom,
    audioRef,
    sceneTimeline,
    scenes,
    selectedScene,
    setSelectedScene,
    totalDuration: usesRenderedPreview
      ? sceneTimeline.at(-1)?.renderedEnd ?? project.edit_plan?.total_duration_seconds ?? 0
      : sceneTimeline.at(-1)?.previewEnd ?? project.edit_plan?.total_duration_seconds ?? 0,
    videoRef,
  };
}

function useSelectedScene(
  activeScene: EditPlanScene | null,
  setSelectedScene: Dispatch<SetStateAction<number | null>>,
) {
  useEffect(() => {
    if (!activeScene) {
      return;
    }
    setSelectedScene((current) => current ?? activeScene.scene_number);
  }, [activeScene, setSelectedScene]);
}

function useVoiceoverSync(
  project: ProjectDetail,
  voiceoverUrl: string,
  videoRef: RefObject<HTMLVideoElement | null>,
  audioRef: RefObject<HTMLAudioElement | null>,
  usesRenderedPreview: boolean,
) {
  const waitingForCueRef = useRef(false);
  const lockPauseRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || !voiceoverUrl || usesRenderedPreview) {
      return;
    }
    const handlers = createVoiceoverSyncHandlers(project, video, audio, waitingForCueRef, lockPauseRef);
    addPlayerListeners(video, handlers.playAudio, handlers.pauseAudio, handlers.syncAudio, handlers.syncRate, handlers.handleSeek, handlers.handleVideoTimeUpdate);
    audio.addEventListener("timeupdate", handlers.handleAudioTimeUpdate);
    audio.addEventListener("ended", handlers.handleAudioEnded);
    return () => cleanupVoiceoverSync(video, audio, handlers);
  }, [audioRef, project, usesRenderedPreview, videoRef, voiceoverUrl]);
}

function createVoiceoverSyncHandlers(
  project: ProjectDetail,
  video: HTMLVideoElement,
  audio: HTMLAudioElement,
  waitingForCueRef: RefObject<boolean>,
  lockPauseRef: RefObject<boolean>,
) {
  const syncAudio = () => syncVoiceoverTrack(project, video, audio);
  const syncRate = () => {
    audio.playbackRate = video.playbackRate;
  };
  return {
    syncAudio,
    syncRate,
    playAudio: () => playVoiceoverAudio(audio, syncAudio),
    pauseAudio: () => pauseVoiceoverAudio(audio, waitingForCueRef, lockPauseRef),
    handleVideoTimeUpdate: () => syncAudioLock(project, video, audio, waitingForCueRef, lockPauseRef),
    handleAudioTimeUpdate: () => releaseAudioLock(project, video, audio, waitingForCueRef),
    handleSeek: () => {
      waitingForCueRef.current = false;
      lockPauseRef.current = false;
    },
    handleAudioEnded: () => releaseWaitingVideo(video, waitingForCueRef),
  };
}

function cleanupVoiceoverSync(
  video: HTMLVideoElement,
  audio: HTMLAudioElement,
  handlers: ReturnType<typeof createVoiceoverSyncHandlers>,
) {
  removePlayerListeners(video, handlers.playAudio, handlers.pauseAudio, handlers.syncAudio, handlers.syncRate, handlers.handleSeek, handlers.handleVideoTimeUpdate);
  audio.removeEventListener("timeupdate", handlers.handleAudioTimeUpdate);
  audio.removeEventListener("ended", handlers.handleAudioEnded);
}

function syncVoiceoverTrack(project: ProjectDetail, video: HTMLVideoElement, audio: HTMLAudioElement) {
  const cueTime = cueTimeForVideoTime(project, video.currentTime);
  if (cueTime !== null && Math.abs(audio.currentTime - cueTime) > 0.2) audio.currentTime = cueTime;
}

function playVoiceoverAudio(audio: HTMLAudioElement, syncAudio: () => void) {
  syncAudio();
  void audio.play().catch(() => undefined);
}

function pauseVoiceoverAudio(
  audio: HTMLAudioElement,
  waitingForCueRef: RefObject<boolean>,
  lockPauseRef: RefObject<boolean>,
) {
  if (consumeLockPause(lockPauseRef)) return;
  waitingForCueRef.current = false;
  audio.pause();
}

function consumeLockPause(lockPauseRef: RefObject<boolean>) {
  if (!lockPauseRef.current) return false;
  lockPauseRef.current = false;
  return true;
}

function usePlaybackTracking(
  sceneTimeline: SceneTimelineEntry[],
  videoRef: RefObject<HTMLVideoElement | null>,
  setCurrentTime: Dispatch<SetStateAction<number>>,
  usesRenderedPreview: boolean,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sceneTimeline.length) {
      return;
    }
    if (usesRenderedPreview) {
      const syncRenderedPlayback = () => setCurrentTime(video.currentTime);
      video.addEventListener("loadedmetadata", syncRenderedPlayback);
      video.addEventListener("seeking", syncRenderedPlayback);
      video.addEventListener("timeupdate", syncRenderedPlayback);
      syncRenderedPlayback();
      return () => {
        video.removeEventListener("loadedmetadata", syncRenderedPlayback);
        video.removeEventListener("seeking", syncRenderedPlayback);
        video.removeEventListener("timeupdate", syncRenderedPlayback);
      };
    }
    const seekToSceneStart = () => initializeTrimmedPlayback(video, sceneTimeline, setCurrentTime);
    const syncTrimmedPlayback = () => syncPlaybackFrame(video, sceneTimeline, setCurrentTime);
    video.addEventListener("loadedmetadata", seekToSceneStart);
    video.addEventListener("seeking", syncTrimmedPlayback);
    video.addEventListener("timeupdate", syncTrimmedPlayback);
    seekToSceneStart();
    return () => {
      video.removeEventListener("loadedmetadata", seekToSceneStart);
      video.removeEventListener("seeking", syncTrimmedPlayback);
      video.removeEventListener("timeupdate", syncTrimmedPlayback);
    };
  }, [sceneTimeline, setCurrentTime, usesRenderedPreview, videoRef]);
}

function addPlayerListeners(
  video: HTMLVideoElement,
  playAudio: () => void,
  pauseAudio: () => void,
  syncAudio: () => void,
  syncRate: () => void,
  handleSeek: () => void,
  handleVideoTimeUpdate: () => void,
) {
  video.addEventListener("play", playAudio);
  video.addEventListener("pause", pauseAudio);
  video.addEventListener("seeking", syncAudio);
  video.addEventListener("seeking", handleSeek);
  video.addEventListener("timeupdate", syncAudio);
  video.addEventListener("timeupdate", handleVideoTimeUpdate);
  video.addEventListener("ratechange", syncRate);
}

function removePlayerListeners(
  video: HTMLVideoElement,
  playAudio: () => void,
  pauseAudio: () => void,
  syncAudio: () => void,
  syncRate: () => void,
  handleSeek: () => void,
  handleVideoTimeUpdate: () => void,
) {
  video.removeEventListener("play", playAudio);
  video.removeEventListener("pause", pauseAudio);
  video.removeEventListener("seeking", syncAudio);
  video.removeEventListener("seeking", handleSeek);
  video.removeEventListener("timeupdate", syncAudio);
  video.removeEventListener("timeupdate", handleVideoTimeUpdate);
  video.removeEventListener("ratechange", syncRate);
}

function syncAudioLock(
  project: ProjectDetail,
  video: HTMLVideoElement,
  audio: HTMLAudioElement,
  waitingForCueRef: RefObject<boolean>,
  lockPauseRef: RefObject<boolean>,
) {
  const cue = cueForVideoTime(project, video.currentTime);
  if (!cue) {
    waitingForCueRef.current = false;
    lockPauseRef.current = false;
    return;
  }
  const videoRemaining = cue.scene.end - video.currentTime;
  const audioRemaining = cue.cue.end - audio.currentTime;
  if (videoRemaining <= 0.2 && audioRemaining > 0.12 && !audio.paused) {
    waitingForCueRef.current = true;
    lockPauseRef.current = true;
    video.pause();
  }
}

function releaseAudioLock(
  project: ProjectDetail,
  video: HTMLVideoElement,
  audio: HTMLAudioElement,
  waitingForCueRef: RefObject<boolean>,
) {
  const cue = cueForVideoTime(project, video.currentTime);
  if (!cue || audio.currentTime >= cue.cue.end - 0.05) releaseWaitingVideo(video, waitingForCueRef);
}

function releaseWaitingVideo(video: HTMLVideoElement, waitingForCueRef: RefObject<boolean>) {
  if (!waitingForCueRef.current || !video.paused) {
    waitingForCueRef.current = false;
    return;
  }
  waitingForCueRef.current = false;
  void video.play().catch(() => undefined);
}

function initializeTrimmedPlayback(
  video: HTMLVideoElement,
  sceneTimeline: SceneTimelineEntry[],
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>,
) {
  const firstScene = sceneTimeline[0];
  const lastScene = sceneTimeline.at(-1);
  if (lastScene && (video.currentTime < firstScene.start || video.currentTime > lastScene.end)) {
    video.currentTime = firstScene.start;
  }
  setCurrentTime(clampSourceTimeToScenes(sceneTimeline, video.currentTime));
}

function syncPlaybackFrame(
  video: HTMLVideoElement,
  sceneTimeline: SceneTimelineEntry[],
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>,
) {
  const playbackState = normalizeScenePlaybackTime(sceneTimeline, video.currentTime, !video.paused);
  if (playbackState.shouldEndPlayback) {
    video.pause();
  }
  if (playbackState.time !== video.currentTime) {
    video.currentTime = playbackState.time;
    return;
  }
  setCurrentTime(playbackState.time);
}

function activeHighlightForTime(scene: EditPlanScene | null, currentTime: number) {
  return scene?.highlights.find((highlight) => currentTime >= highlight.start && currentTime <= highlight.end) ?? null;
}

function activeZoomForTime(scene: EditPlanScene | null, currentTime: number) {
  return scene?.zooms.find((zoom) => currentTime >= zoom.start && currentTime <= zoom.end) ?? null;
}

function cueTimeForVideoTime(project: ProjectDetail, videoTime: number): number | null {
  const cueMatch = cueForVideoTime(project, videoTime);
  if (!cueMatch) return null;
  const { cue, scene } = cueMatch;
  const sceneDuration = Math.max(scene.end - scene.start, 0.001);
  const cueDuration = Math.max(cue.end - cue.start, 0.001);
  const progress = Math.min(Math.max((videoTime - scene.start) / sceneDuration, 0), 1);
  return cue.start + cueDuration * progress;
}

function cueForVideoTime(project: ProjectDetail, videoTime: number) {
  const cues = project.voiceover?.cues ?? [];
  const scenes = project.edit_plan?.scenes ?? [];
  const currentScene = scenes.find((scene) => videoTime >= scene.start && videoTime <= scene.end);
  const cue = cues.find((item) => item.scene_number === currentScene?.scene_number);
  return currentScene && cue ? { cue, scene: currentScene } : null;
}


export function FocusBoxOverlay({ focusBox }: { focusBox: NonNullable<EditPlanScene["highlights"][number]["focus_box"]> }) {
  return <div className="pointer-events-none absolute rounded-[22px] border-2 border-cyan-300 shadow-[0_0_0_9999px_rgba(2,6,23,0.45),0_0_50px_rgba(34,211,238,0.35)]" style={{ left: `${focusBox.x * 100}%`, top: `${focusBox.y * 100}%`, width: `${focusBox.width * 100}%`, height: `${focusBox.height * 100}%` }} />;
}

export function HighlightBadge({ label }: { label: string }) {
  return <div className="pointer-events-none absolute left-6 top-6 rounded-full border border-cyan-300/40 bg-slate-950/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 backdrop-blur">{label}</div>;
}

export function CaptionOverlay({ text }: { text: string }) {
  return <div className="pointer-events-none absolute inset-x-8 bottom-8 rounded-[24px] border border-white/10 bg-slate-950/78 px-5 py-4 text-center text-lg font-semibold leading-8 text-white shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur">{text.split("\n").map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>;
}

export function SceneLabel({ scene }: { scene: EditPlanScene }) {
  return <div className="pointer-events-none absolute left-6 bottom-28 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-100 backdrop-blur">Scene {scene.scene_number} • {scene.camera_mode}</div>;
}

export function PreviewPlaceholder({ title, detail }: { title: string; detail: string }) {
  return <div className="grid h-full place-items-center px-10 text-center"><div><p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">{title}</p><p className="mt-3 text-sm leading-7 text-slate-300">{detail}</p></div></div>;
}

export function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[22px] border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-2 text-sm leading-7 text-white">{value}</p></div>;
}

export function voiceoverLabel(project: ProjectDetail, voiceoverUrl: string) {
  if (voiceoverUrl) {
    return `${project.voiceover?.provider} / ${project.voiceover?.model} / ${project.voiceover?.mode}`;
  }
  return project.voiceover?.script ? "Script prepared, audio asset unavailable." : "Original audio only.";
}
