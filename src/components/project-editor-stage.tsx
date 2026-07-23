"use client";

import type { ReactNode, RefObject } from "react";

import { EditorAspectRatio, EditorCaptionDraft, EditorSceneDraft, ProjectEditorDraft, sceneDuration } from "@/components/project-editor-draft";
import { PauseIcon, PlayIcon, ScissorIcon, StepForwardIcon, StepIcon } from "@/components/project-editor-icons";

export type ProjectEditorPreviewState = {
  activeCaption: EditorCaptionDraft | null;
  currentTime: number;
  error: string;
  isPlaying: boolean;
  isRenderedPreview: boolean;
  seek: (time: number) => void;
  seekToScene: (scene: EditorSceneDraft) => void;
  sourceUrl: string;
  togglePlayback: () => void;
  totalDuration: number;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export function EditorPreviewStage({
  draft,
  preview,
  selectedScene,
}: {
  draft: ProjectEditorDraft;
  preview: ProjectEditorPreviewState;
  selectedScene: EditorSceneDraft | null;
}) {
  return (
    <section className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#0b0b0b] p-6">
      <div className="absolute bottom-5 right-5 rounded-[8px] bg-[#202020] px-3 py-2 text-sm text-slate-300">100%</div>
      <div className="w-full rounded-[14px] border border-dashed border-[#da4fe2] p-8">
        <PreviewCanvas activeCaption={preview.activeCaption} aspectRatio={draft.aspectRatio} preview={preview} selectedScene={selectedScene} showCaptions={draft.showCaptions} />
      </div>
    </section>
  );
}

export function EditorTimeline({
  currentTime,
  draft,
  isPlaying,
  onSceneSelect,
  onSeek,
  onTogglePlayback,
  totalDuration,
}: {
  currentTime: number;
  draft: ProjectEditorDraft;
  isPlaying: boolean;
  onSceneNudge: (sceneId: string, delta: number) => void;
  onSceneRegenerate: (sceneId: string) => void;
  onSceneSelect: (scene: EditorSceneDraft) => void;
  onSceneTimingChange: (sceneId: string, field: "start" | "end", value: number) => void;
  onSeek: (time: number) => void;
  onTogglePlayback: () => void;
  regeneratePending: boolean;
  totalDuration: number;
}) {
  const selectedSceneId = draft.selectedSceneId || draft.scenes[0]?.id || "";
  return (
    <section className="rounded-[14px] border border-white/6 bg-[#0f0f0f] px-4 pb-3 pt-2">
      <TransportBar currentTime={currentTime} isPlaying={isPlaying} onTogglePlayback={onTogglePlayback} totalDuration={totalDuration} />
      <TimelineRuler currentTime={currentTime} totalDuration={totalDuration} />
      <TimelineLane currentTime={currentTime} onSceneSelect={onSceneSelect} onSeek={onSeek} scenes={draft.scenes} selectedSceneId={selectedSceneId} totalDuration={totalDuration} />
    </section>
  );
}

function PreviewCanvas({
  activeCaption,
  aspectRatio,
  preview,
  selectedScene,
  showCaptions,
}: {
  activeCaption: EditorCaptionDraft | null;
  aspectRatio: EditorAspectRatio;
  preview: ProjectEditorPreviewState;
  selectedScene: EditorSceneDraft | null;
  showCaptions: boolean;
}) {
  const ratioClass = aspectRatio === "9:16" ? "aspect-[9/16]" : aspectRatio === "1:1" ? "aspect-square" : "aspect-[16/9]";
  return (
    <div className={`relative mx-auto w-full max-w-[928px] overflow-hidden rounded-[14px] bg-[#101010] ${ratioClass}`}>
      {preview.sourceUrl ? <PreviewVideo onTogglePlayback={preview.togglePlayback} sourceUrl={preview.sourceUrl} videoRef={preview.videoRef} /> : <PreviewEmptyState detail={preview.error} />}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.28))]" />
      {selectedScene ? <ScenePill title={selectedScene.title} /> : null}
      {showCaptions && activeCaption ? <CaptionPill text={activeCaption.text} /> : null}
    </div>
  );
}

function TransportBar({
  currentTime,
  isPlaying,
  onTogglePlayback,
  totalDuration,
}: {
  currentTime: number;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  totalDuration: number;
}) {
  return (
    <div className="flex items-center gap-3 text-slate-400">
      <IconButton onClick={onTogglePlayback}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</IconButton>
      <IconButton><StepIcon /></IconButton>
      <IconButton><StepForwardIcon /></IconButton>
      <span className="min-w-[170px] text-[15px] text-slate-300">{formatTimelineTime(currentTime)}f / {formatTimelineTime(totalDuration)}f</span>
      <span className="text-[15px] text-slate-300">1x</span>
      <span className="text-[15px] text-slate-300">High res</span>
      <IconButton><ScissorIcon /></IconButton>
      <IconButton>+</IconButton>
    </div>
  );
}

function TimelineRuler({
  currentTime,
  totalDuration,
}: {
  currentTime: number;
  totalDuration: number;
}) {
  return (
    <div className="mt-2 flex items-end gap-0.5 px-1 text-[11px] text-slate-500">
      <div className="rounded bg-white px-2 py-1 text-black">{Math.floor(currentTime)}s</div>
      {rulerTicks(totalDuration).map((tick) => (
        <div key={tick} className="flex-1 border-t border-dashed border-white/10 pt-2 text-center">{tick}s</div>
      ))}
    </div>
  );
}

function TimelineLane({
  currentTime,
  onSceneSelect,
  onSeek,
  scenes,
  selectedSceneId,
  totalDuration,
}: {
  currentTime: number;
  onSceneSelect: (scene: EditorSceneDraft) => void;
  onSeek: (time: number) => void;
  scenes: EditorSceneDraft[];
  selectedSceneId: string;
  totalDuration: number;
}) {
  return (
    <div className="mt-3 overflow-x-auto pb-2">
      <div className="relative min-w-[1200px] rounded-[8px] bg-[#0b0b0b] p-2">
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-300">
          <span className="rounded-[6px] bg-[#1b63e8] px-2 py-1 text-white">Video</span>
        </div>
        <div className="relative h-[116px] overflow-hidden rounded-[8px] bg-[#155fda]">
          <CurrentTimeMarker currentTime={currentTime} totalDuration={totalDuration} />
          <div className="flex h-full">
            {scenes.map((scene) => (
              <LaneSegment key={scene.id} isSelected={scene.id === selectedSceneId} onClick={() => { onSceneSelect(scene); onSeek(scene.start); }} scene={scene} totalDuration={totalDuration} />
            ))}
          </div>
        </div>
        <div className="mt-3 h-3 rounded-full bg-[#2a2a2a]" />
      </div>
    </div>
  );
}

function PreviewVideo({
  onTogglePlayback,
  sourceUrl,
  videoRef,
}: {
  onTogglePlayback: () => void;
  sourceUrl: string;
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  return <video ref={videoRef} className="h-full w-full object-contain" onClick={onTogglePlayback} playsInline preload="metadata" src={sourceUrl} />;
}

function PreviewEmptyState({ detail }: { detail: string }) {
  return (
    <div className="grid h-full w-full place-items-center bg-[#101010] p-8 text-center">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-200">Editor Preview Pending</p>
        <p className="mt-5 text-[18px] font-semibold leading-9 text-white">Launchify will load the source or rendered preview here once the media is ready.</p>
        <p className="mt-4 text-[15px] leading-8 text-slate-500">{detail || "No media asset is available yet for this project."}</p>
      </div>
    </div>
  );
}

function ScenePill({ title }: { title: string }) {
  return <div className="absolute left-6 top-6 rounded-full bg-black/70 px-5 py-2 text-xs uppercase tracking-[0.24em] text-white">{title}</div>;
}

function CaptionPill({ text }: { text: string }) {
  return <div className="absolute inset-x-10 bottom-8 rounded-[14px] bg-black/70 px-5 py-4 text-center text-base font-medium text-white">{text}</div>;
}

function CurrentTimeMarker({
  currentTime,
  totalDuration,
}: {
  currentTime: number;
  totalDuration: number;
}) {
  return <div className="absolute inset-y-0 z-10 w-0.5 bg-white/80" style={{ left: `${Math.min((currentTime / Math.max(totalDuration, 1)) * 100, 100)}%` }} />;
}

function LaneSegment({
  isSelected,
  onClick,
  scene,
  totalDuration,
}: {
  isSelected: boolean;
  onClick: () => void;
  scene: EditorSceneDraft;
  totalDuration: number;
}) {
  const width = `${Math.max((sceneDuration(scene) / Math.max(totalDuration, 1)) * 100, 8)}%`;
  return (
    <button className={`relative h-full border-r border-black/20 text-left ${isSelected ? "bg-white/6" : "bg-transparent hover:bg-white/[0.04]"}`} onClick={onClick} style={{ width, minWidth: 150 }} type="button">
      <div className="absolute inset-x-2 top-2 flex gap-0.5">
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index} className="h-16 flex-1 rounded-[4px] bg-black/14" />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.45))] px-4 py-3 text-white">
        <p className="text-xs uppercase tracking-[0.24em]">{`Scene ${scene.sceneNumber}`}</p>
        <p className="mt-1 truncate text-[16px] font-semibold">{scene.title}</p>
      </div>
    </button>
  );
}

function IconButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return <button className="grid h-11 w-11 place-items-center rounded-[10px] border border-white/8 bg-[#121212]" onClick={onClick} type="button">{children}</button>;
}

function rulerTicks(totalDuration: number) {
  const whole = Math.max(Math.ceil(totalDuration), 1);
  return Array.from({ length: Math.min(6, whole + 1) }, (_, index) => index * 5).filter((tick) => tick <= whole);
}

function formatTimelineTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const frames = Math.round((seconds - wholeSeconds) * 30);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = wholeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
}
