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
    <section className="relative flex h-full min-h-0 items-center justify-center rounded-[16px] bg-[#0f0f0f] px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <ZoomBadge>100%</ZoomBadge>
      <SafeAreaFrame>
        <CanvasViewport activeCaption={preview.activeCaption} aspectRatio={draft.aspectRatio} preview={preview} selectedScene={selectedScene} showCaptions={draft.showCaptions} />
      </SafeAreaFrame>
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
    <section className="rounded-[14px] border border-white/6 bg-[#121212] px-3 pb-3 pt-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <TransportBar currentTime={currentTime} isPlaying={isPlaying} onTogglePlayback={onTogglePlayback} totalDuration={totalDuration} />
      <TimelineBody currentTime={currentTime} onSceneSelect={onSceneSelect} onSeek={onSeek} scenes={draft.scenes} selectedSceneId={selectedSceneId} totalDuration={totalDuration} />
    </section>
  );
}

function CanvasViewport({
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
    <div className={`relative mx-auto w-full max-w-[980px] overflow-hidden rounded-[18px] bg-black shadow-[0_38px_110px_rgba(0,0,0,0.42)] ${ratioClass}`}>
      {preview.sourceUrl ? <PreviewVideo onTogglePlayback={preview.togglePlayback} sourceUrl={preview.sourceUrl} videoRef={preview.videoRef} /> : <PreviewFallback detail={preview.error} />}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.38))]" />
      {selectedScene ? <SceneBadge title={selectedScene.title} /> : null}
      {showCaptions && activeCaption ? <CaptionOverlay text={activeCaption.text} /> : null}
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
    <div className="flex items-center gap-3 rounded-[12px] bg-[#111111] px-3 py-3 text-slate-400">
      <TransportButton onClick={onTogglePlayback}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</TransportButton>
      <TransportButton><StepIcon /></TransportButton>
      <TransportButton><StepForwardIcon /></TransportButton>
      <span className="min-w-[168px] text-[15px] text-slate-300">{formatTimelineTime(currentTime)}f / {formatTimelineTime(totalDuration)}f</span>
      <span className="text-[15px] text-slate-300">1x</span>
      <span className="text-[15px] text-slate-300">High res</span>
      <TransportButton><ScissorIcon /></TransportButton>
      <TransportButton>+</TransportButton>
    </div>
  );
}

function TimelineBody({
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
    <div className="mt-2">
      <Ruler currentTime={currentTime} totalDuration={totalDuration} />
      <VideoTrack currentTime={currentTime} onSceneSelect={onSceneSelect} onSeek={onSeek} scenes={scenes} selectedSceneId={selectedSceneId} totalDuration={totalDuration} />
      <ScrollbarTrack />
    </div>
  );
}

function Ruler({
  currentTime,
  totalDuration,
}: {
  currentTime: number;
  totalDuration: number;
}) {
  return (
    <div className="mb-2 flex items-end gap-0.5 px-1 text-[11px] text-slate-500">
      <div className="rounded-[6px] bg-white px-2 py-1 text-black">0s</div>
      {timelineTicks(totalDuration).map((tick) => (
        <div key={tick} className="flex-1 text-center">{tick}s</div>
      ))}
      <div className="rounded-[6px] bg-[#2a2a2a] px-2 py-1 text-slate-300">{Math.floor(currentTime)}s</div>
    </div>
  );
}

function VideoTrack({
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
    <div className="overflow-x-auto rounded-[10px] bg-[#0b0b0b] px-3 pb-3 pt-2">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-[7px] border border-white/10 bg-[#1965e6] px-3 py-1 text-sm text-white">Video</span>
      </div>
      <div className="relative min-w-[1380px] overflow-hidden rounded-[8px] border border-[#3479ff] bg-[#1b63e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
        <Playhead currentTime={currentTime} totalDuration={totalDuration} />
        <div className="flex h-[118px]">
          {scenes.map((scene) => (
            <TrackSegment key={scene.id} isSelected={scene.id === selectedSceneId} onClick={() => handleSceneClick(onSceneSelect, onSeek, scene)} scene={scene} totalDuration={totalDuration} />
          ))}
        </div>
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

function PreviewFallback({ detail }: { detail: string }) {
  return (
    <div className="grid h-full w-full place-items-center bg-[#0b0b0b] p-10 text-center">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.28em] text-fuchsia-200">Editor Preview Pending</p>
        <p className="mt-4 text-[18px] font-semibold leading-9 text-white">Launchify will load the source or rendered preview here once the media is ready.</p>
        <p className="mt-4 text-[15px] leading-8 text-slate-500">{detail || "No media asset is available yet for this project."}</p>
      </div>
    </div>
  );
}

function SafeAreaFrame({ children }: { children: ReactNode }) {
  return <div className="w-full rounded-[14px] border border-dashed border-[#d744db] p-7">{children}</div>;
}

function ZoomBadge({ children }: { children: ReactNode }) {
  return <div className="absolute bottom-5 right-5 rounded-[10px] border border-white/8 bg-[#1f1f1f] px-3 py-2 text-sm text-slate-300">{children}</div>;
}

function SceneBadge({ title }: { title: string }) {
  return <div className="absolute left-6 top-6 rounded-full bg-black/72 px-5 py-2 text-xs uppercase tracking-[0.28em] text-white">{title}</div>;
}

function CaptionOverlay({ text }: { text: string }) {
  return <div className="absolute inset-x-10 bottom-8 rounded-[14px] bg-black/72 px-5 py-4 text-center text-base font-medium text-white">{text}</div>;
}

function Playhead({
  currentTime,
  totalDuration,
}: {
  currentTime: number;
  totalDuration: number;
}) {
  return <div className="absolute inset-y-0 z-10 w-0.5 bg-white/90" style={{ left: `${Math.min((currentTime / Math.max(totalDuration, 1)) * 100, 100)}%` }} />;
}

function TrackSegment({
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
    <button className={`relative h-full border-r border-black/20 text-left ${isSelected ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`} onClick={onClick} style={{ minWidth: 180, width }} type="button">
      <div className="absolute inset-x-2 top-2 flex gap-0.5">
        {Array.from({ length: 10 }).map((_, index) => (
          <span key={index} className="h-[62px] flex-1 rounded-[4px] bg-black/14" />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.45))] px-4 py-3 text-white">
        <p className="text-xs uppercase tracking-[0.24em]">{`Scene ${scene.sceneNumber}`}</p>
        <p className="mt-1 truncate text-[16px] font-semibold">{scene.title}</p>
      </div>
    </button>
  );
}

function TransportButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return <button className="grid h-10 w-10 place-items-center rounded-[10px] border border-white/8 bg-[#121212]" onClick={onClick} type="button">{children}</button>;
}

function ScrollbarTrack() {
  return (
    <div className="mt-4 h-3 rounded-full bg-[#2b2b2b] px-1.5 py-0.5">
      <div className="h-full w-[78%] rounded-full bg-[#5a5a5a]" />
    </div>
  );
}

function handleSceneClick(
  onSceneSelect: (scene: EditorSceneDraft) => void,
  onSeek: (time: number) => void,
  scene: EditorSceneDraft,
) {
  onSceneSelect(scene);
  onSeek(scene.start);
}

function timelineTicks(totalDuration: number) {
  const maxTick = Math.max(Math.ceil(totalDuration), 5);
  return Array.from({ length: Math.min(7, maxTick + 1) }, (_, index) => index * 5).filter((tick) => tick <= maxTick);
}

function formatTimelineTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const frames = Math.round((seconds - wholeSeconds) * 30);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = wholeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
}
