"use client";

import { Dispatch, RefObject, SetStateAction, useEffect, useState } from "react";

import { EditPlanScene, ProjectDetail } from "@/lib/types";
import {
  FocusBoxOverlay,
  formatPreviewRange,
  HighlightBadge,
  InfoCard,
  PreviewPlaceholder,
  SceneLabel,
  seekScene,
  voiceoverLabel,
} from "@/components/render-preview-studio";

type TimelineScene = EditPlanScene & {
  previewStart: number;
  previewEnd: number;
};

export function PreviewStudioHeader({ project }: { project: ProjectDetail }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Preview Studio</p>
        <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">Polished launch preview</h3>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
          Review the grounded pacing, focus moments, timeline, and AI voiceover in one place before export work is added.
        </p>
      </div>
      {project.guide ? <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-cyan-200">{project.guide.steps.length} grounded steps</div> : null}
    </div>
  );
}

export function PreviewPlayer({
  activeHighlight,
  activeScene,
  activeZoom,
  audioRef,
  project,
  sourceError,
  sourceUrl,
  videoRef,
  voiceoverUrl,
}: {
  activeHighlight: EditPlanScene["highlights"][number] | null;
  activeScene: EditPlanScene | null;
  activeZoom: EditPlanScene["zooms"][number] | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  project: ProjectDetail;
  sourceError: string;
  sourceUrl: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  voiceoverUrl: string;
}) {
  return (
    <div className="w-full max-w-full overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_20px_80px_rgba(2,6,23,0.35)]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-rose-400" />
        <span className="h-3 w-3 rounded-full bg-amber-300" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />
        <p className="ml-3 text-xs uppercase tracking-[0.2em] text-slate-300">{project.product_name} polished preview</p>
      </div>
      <div className="relative aspect-[16/9] w-full max-w-full overflow-hidden bg-slate-950">
        <PreviewPlayerBody
          activeHighlight={activeHighlight}
          activeScene={activeScene}
          activeZoom={activeZoom}
          audioRef={audioRef}
          project={project}
          sourceError={sourceError}
          sourceUrl={sourceUrl}
          videoRef={videoRef}
          voiceoverUrl={voiceoverUrl}
        />
      </div>
    </div>
  );
}

function PreviewPlayerBody({
  activeHighlight,
  activeScene,
  activeZoom,
  audioRef,
  project,
  sourceError,
  sourceUrl,
  videoRef,
  voiceoverUrl,
}: {
  activeHighlight: EditPlanScene["highlights"][number] | null;
  activeScene: EditPlanScene | null;
  activeZoom: EditPlanScene["zooms"][number] | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  project: ProjectDetail;
  sourceError: string;
  sourceUrl: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  voiceoverUrl: string;
}) {
  const transform = activeZoom
    ? `translate(${(activeZoom.x_offset * 100).toFixed(2)}%, ${(activeZoom.y_offset * 100).toFixed(2)}%) scale(${activeZoom.scale.toFixed(3)})`
    : "scale(1)";
  const controls = usePreviewPlayerState(videoRef, project, voiceoverUrl);

  if (!sourceUrl) {
    return <PreviewPlaceholder detail={sourceError || project.error_message || "Upload a walkthrough and Launchify will assemble the polished preview here."} title="Source video pending" />;
  }
  return (
    <>
      <video ref={videoRef} className="h-full w-full object-cover transition-transform duration-500 ease-out" muted={Boolean(voiceoverUrl)} playsInline preload="metadata" src={sourceUrl} style={{ transform }} />
      {voiceoverUrl ? <audio ref={audioRef} preload="auto" src={voiceoverUrl} /> : null}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_48%),linear-gradient(180deg,rgba(2,6,23,0.02),rgba(2,6,23,0.46))]" />
      {activeHighlight?.focus_box ? <FocusBoxOverlay focusBox={activeHighlight.focus_box} /> : null}
      {activeHighlight ? <HighlightBadge label={activeHighlight.ui_label || activeHighlight.label} /> : null}
      {activeScene ? <SceneLabel scene={activeScene} /> : null}
      <PreviewControls
        isPlaying={controls.isPlaying}
        previewTime={controls.previewTime}
        totalDuration={controls.totalDuration}
        voiceoverEnabled={Boolean(voiceoverUrl)}
        onSeek={(value) => seekPreview(videoRef.current, project, value)}
        onTogglePlayback={() => togglePlayback(videoRef.current, audioRef.current, Boolean(voiceoverUrl))}
      />
    </>
  );
}

function usePreviewPlayerState(
  videoRef: RefObject<HTMLVideoElement | null>,
  project: ProjectDetail,
  voiceoverUrl: string,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  useSourceAudioLock(videoRef, voiceoverUrl);
  usePreviewControls(videoRef, project, setIsPlaying, setPreviewTime);
  return {
    isPlaying,
    previewTime,
    totalDuration: project.edit_plan?.total_duration_seconds ?? 0,
  };
}

function useSourceAudioLock(
  videoRef: RefObject<HTMLVideoElement | null>,
  voiceoverUrl: string,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!voiceoverUrl) return;
    const previousState = {
      defaultMuted: video.defaultMuted,
      muted: video.muted,
      volume: video.volume,
    };
    const enforceMute = () => {
      video.defaultMuted = true;
      video.muted = true;
      video.volume = 0;
    };
    enforceMute();
    video.addEventListener("volumechange", enforceMute);
    return () => {
      video.removeEventListener("volumechange", enforceMute);
      video.defaultMuted = previousState.defaultMuted;
      video.muted = previousState.muted;
      video.volume = previousState.volume;
    };
  }, [videoRef, voiceoverUrl]);
}

function usePreviewControls(
  videoRef: RefObject<HTMLVideoElement | null>,
  project: ProjectDetail,
  setIsPlaying: Dispatch<SetStateAction<boolean>>,
  setPreviewTime: Dispatch<SetStateAction<number>>,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const sync = () => {
      setIsPlaying(!video.paused && !video.ended);
      setPreviewTime(projectPreviewTime(project, video.currentTime));
    };
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    video.addEventListener("ended", sync);
    video.addEventListener("timeupdate", sync);
    video.addEventListener("loadedmetadata", sync);
    sync();
    return () => {
      video.removeEventListener("play", sync);
      video.removeEventListener("pause", sync);
      video.removeEventListener("ended", sync);
      video.removeEventListener("timeupdate", sync);
      video.removeEventListener("loadedmetadata", sync);
    };
  }, [project, setIsPlaying, setPreviewTime, videoRef]);
}

function togglePlayback(
  video: HTMLVideoElement | null,
  audio: HTMLAudioElement | null,
  voiceoverEnabled: boolean,
) {
  if (!video) return;
  if (video.paused) {
    void video.play().catch(() => undefined);
    if (voiceoverEnabled && audio) {
      void audio.play().catch(() => undefined);
    }
    return;
  }
  video.pause();
  if (audio) {
    audio.pause();
  }
}

function seekPreview(
  video: HTMLVideoElement | null,
  project: ProjectDetail,
  previewTime: number,
) {
  if (!video) return;
  video.currentTime = sourceTimeForPreview(project, previewTime);
}

function projectPreviewTime(project: ProjectDetail, sourceTime: number) {
  const scenes = [...(project.edit_plan?.scenes ?? [])].sort((left, right) => left.start - right.start);
  let elapsed = 0;
  for (const scene of scenes) {
    const duration = Math.max(scene.end - scene.start, 0);
    if (sourceTime < scene.start) {
      return elapsed;
    }
    if (sourceTime <= scene.end) {
      return elapsed + Math.max(sourceTime - scene.start, 0);
    }
    elapsed += duration;
  }
  return elapsed;
}

function sourceTimeForPreview(project: ProjectDetail, previewTime: number) {
  const scenes = [...(project.edit_plan?.scenes ?? [])].sort((left, right) => left.start - right.start);
  let elapsed = 0;
  for (const scene of scenes) {
    const duration = Math.max(scene.end - scene.start, 0);
    if (previewTime <= elapsed + duration) {
      return scene.start + Math.max(previewTime - elapsed, 0);
    }
    elapsed += duration;
  }
  return scenes.at(-1)?.end ?? 0;
}

function PreviewControls({
  isPlaying,
  onTogglePlayback,
  onSeek,
  previewTime,
  totalDuration,
  voiceoverEnabled,
}: {
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onSeek: (value: number) => void;
  previewTime: number;
  totalDuration: number;
  voiceoverEnabled: boolean;
}) {
  const progress = totalDuration > 0 ? Math.min(previewTime / totalDuration, 1) : 0;
  return (
    <div className="absolute inset-x-3 bottom-3 rounded-[20px] border border-white/10 bg-slate-950/84 px-3 py-3 backdrop-blur sm:inset-x-4 sm:bottom-4 sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950 transition hover:scale-[1.03]" onClick={onTogglePlayback} type="button">
          {isPlaying ? "Pause" : "Play"}
        </button>
        <div className="min-w-0 flex-1">
          <div className="relative h-5">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-300 transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
            </div>
            <input
              aria-label="Seek preview timeline"
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
              max={totalDuration || 0}
              min={0}
              onChange={(event) => onSeek(Number(event.target.value))}
              step={0.1}
              type="range"
              value={Math.min(previewTime, totalDuration || previewTime)}
            />
          </div>
          <div className="mt-2 flex flex-col gap-1 text-[11px] uppercase tracking-[0.18em] text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
            <span>{formatClock(previewTime)} / {formatClock(totalDuration)}</span>
            <span>{voiceoverEnabled ? "AI voiceover preview" : "Source audio preview"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatClock(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function PreviewInfoGrid({
  activeScene,
  project,
  voiceoverUrl,
}: {
  activeScene: EditPlanScene | null;
  project: ProjectDetail;
  voiceoverUrl: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <InfoCard label="Voiceover" value={voiceoverLabel(project, voiceoverUrl)} />
      <InfoCard label="Preview Quality" value={activeScene ? `${activeScene.camera_mode} camera, ${(activeScene.confidence * 100).toFixed(0)}% confidence` : "Scene plan is still being generated."} />
    </div>
  );
}

export function PreviewSidebar({
  activeSceneNumber,
  project,
  sceneTimeline,
  scenes,
  setSelectedScene,
  videoRef,
  voiceoverError,
}: {
  activeSceneNumber: number | null;
  project: ProjectDetail;
  sceneTimeline: TimelineScene[];
  scenes: EditPlanScene[];
  setSelectedScene: Dispatch<SetStateAction<number | null>>;
  videoRef: RefObject<HTMLVideoElement | null>;
  voiceoverError: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Guide Summary</p>
        <p className="mt-3 text-lg font-semibold text-white">{project.guide?.title || project.launch_script?.hook || project.project_name}</p>
        <p className="mt-2 text-sm leading-7 text-slate-300">{project.guide?.summary || project.launch_script?.summary || "The AI summary will appear here once planning finishes."}</p>
      </div>
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Scene Timeline</p>
        <div className="mt-4 space-y-3">
          {scenes.length ? scenes.map((scene) => <button key={scene.scene_number} className={`w-full rounded-[20px] border px-4 py-4 text-left transition ${activeSceneNumber === scene.scene_number ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/5"}`} onClick={() => seekScene(videoRef.current, scene, setSelectedScene)} type="button"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-white">{scene.title}</p><p className="text-xs uppercase tracking-[0.2em] text-slate-400">{formatPreviewRange(sceneTimeline, scene)}</p></div><p className="mt-2 text-sm text-slate-300">{scene.purpose}</p><p className="mt-2 text-xs text-cyan-200">{scene.on_screen_text}</p></button>) : <p className="text-sm text-slate-400">The scene timeline will appear once the preview plan is ready.</p>}
        </div>
      </div>
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Quality Notes</p>
        {project.quality_report ? <div className="mt-3 space-y-3"><p className="text-lg font-semibold text-white">Score {project.quality_report.score} / 100</p><p className="text-sm leading-7 text-slate-300">{project.quality_report.summary}</p>{project.quality_report.issues.slice(0, 3).map((issue) => <div key={`${issue.code}-${issue.scene_number ?? "global"}`} className="rounded-[18px] border border-white/10 bg-black/10 p-3"><p className="text-sm font-semibold text-white">{issue.message}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{issue.severity}</p></div>)}</div> : <p className="mt-3 text-sm text-slate-400">Quality scoring will appear here once the preview plan finishes.</p>}
        {voiceoverError ? <p className="mt-3 text-sm text-amber-300">{voiceoverError}</p> : null}
      </div>
    </div>
  );
}
