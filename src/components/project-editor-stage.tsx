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
    <section className="relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#0f0f0f]">
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
      <StageSafeFrame>
        <StageCanvas activeCaption={preview.activeCaption} aspectRatio={draft.aspectRatio} preview={preview} selectedScene={selectedScene} showCaptions={draft.showCaptions} />
      </StageSafeFrame>
      <ZoomBadge>100%</ZoomBadge>
    </section>
  );
}

export function EditorTimeline({
  currentTime,
  draft,
  isPlaying,
  onSceneNudge,
  onSceneRegenerate,
  onSceneSelect,
  onSceneTimingChange,
  onSeek,
  onTogglePlayback,
  regeneratePending,
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
  const selectedScene = scenesSelectedForTimeline(draft.scenes, selectedSceneId);
  return (
    <section className="rounded-[14px] border border-white/7 bg-[#151515] p-3">
      <TransportBar currentTime={currentTime} isPlaying={isPlaying} onTogglePlayback={onTogglePlayback} totalDuration={totalDuration} />
      <TimelineRuler currentTime={currentTime} totalDuration={totalDuration} />
      <VideoTrack currentTime={currentTime} onSceneSelect={onSceneSelect} onSeek={onSeek} scenes={draft.scenes} selectedSceneId={selectedSceneId} totalDuration={totalDuration} />
      {selectedScene ? <SceneTimingPanel onSceneNudge={onSceneNudge} onSceneRegenerate={onSceneRegenerate} onSceneTimingChange={onSceneTimingChange} regeneratePending={regeneratePending} scene={selectedScene} totalDuration={totalDuration} /> : null}
      <ScrollbarTrack />
    </section>
  );
}

function StageSafeFrame({ children }: { children: ReactNode }) {
  return <div className="w-full rounded-[14px] border border-dashed border-[#d544e0] p-7">{children}</div>;
}

function StageCanvas({
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
    <div className={`relative mx-auto w-full max-w-[920px] overflow-hidden rounded-[16px] bg-black shadow-[0_40px_120px_rgba(0,0,0,0.45)] ${ratioClass}`}>
      {preview.sourceUrl ? <PreviewVideo onTogglePlayback={preview.togglePlayback} sourceUrl={preview.sourceUrl} videoRef={preview.videoRef} /> : <PreviewFallback detail={preview.error} />}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.18))]" />
      {selectedScene ? <SceneBadge title={selectedScene.title} /> : null}
      {showCaptions && activeCaption ? <CaptionOverlay text={activeCaption.text} /> : null}
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
    <div className="grid h-full w-full place-items-center bg-[#080808] p-10 text-center">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.32em] text-fuchsia-200">Editor Preview Pending</p>
        <p className="mt-4 text-[18px] font-semibold leading-9 text-white">Launchify will load the source or rendered preview here once the media is ready.</p>
        <p className="mt-4 text-[15px] leading-8 text-[#72809c]">{detail || "No media asset is available yet for this project."}</p>
      </div>
    </div>
  );
}

function SceneBadge({ title }: { title: string }) {
  return <div className="absolute left-9 top-8 rounded-full bg-black/80 px-6 py-2 text-xs uppercase tracking-[0.34em] text-white">{title}</div>;
}

function CaptionOverlay({ text }: { text: string }) {
  return <div className="absolute inset-x-10 bottom-8 rounded-[14px] bg-black/72 px-5 py-4 text-center text-base font-medium text-white">{text}</div>;
}

function ZoomBadge({ children }: { children: ReactNode }) {
  return <div className="absolute bottom-6 right-6 rounded-[10px] bg-[#212121] px-4 py-2 text-[14px] text-[#d3d7e1]">{children}</div>;
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
    <div className="flex items-center gap-3 px-1 py-1 text-[#8893aa]">
      <TransportButton onClick={onTogglePlayback}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</TransportButton>
      <TransportButton><StepIcon /></TransportButton>
      <TransportButton><StepForwardIcon /></TransportButton>
      <span className="min-w-[180px] text-[15px] text-[#d1d7e5]">{formatTimelineTime(currentTime)}f / {formatTimelineTime(totalDuration)}f</span>
      <span className="text-[15px] text-[#d1d7e5]">1x</span>
      <span className="text-[15px] text-[#d1d7e5]">High res</span>
      <TransportButton><ScissorIcon /></TransportButton>
      <TransportButton>+</TransportButton>
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
    <div className="mt-2 flex items-end gap-1 px-1 text-[11px] text-[#657086]">
      <div className="rounded-[6px] bg-white px-2 py-1 text-black">0s</div>
      {timelineTicks(totalDuration).map((tick) => (
        <div key={tick} className="flex-1 text-center">{tick}s</div>
      ))}
      <div className="rounded-[6px] bg-[#202020] px-2 py-1 text-[#d5dae4]">{Math.floor(currentTime)}s</div>
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
    <div className="mt-3 overflow-x-auto rounded-[12px] bg-[#0b0b0b] p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-[8px] bg-[#1967eb] px-4 py-2 text-[15px] text-white">Video</span>
      </div>
      <div className="relative min-w-[1600px] overflow-hidden rounded-[8px] border border-[#337cff] bg-[#1565eb]">
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

function SceneTimingPanel({
  onSceneNudge,
  onSceneRegenerate,
  onSceneTimingChange,
  regeneratePending,
  scene,
  totalDuration,
}: {
  onSceneNudge: (sceneId: string, delta: number) => void;
  onSceneRegenerate: (sceneId: string) => void;
  onSceneTimingChange: (sceneId: string, field: "start" | "end", value: number) => void;
  regeneratePending: boolean;
  scene: EditorSceneDraft;
  totalDuration: number;
}) {
  return (
    <div className="mt-3 rounded-[12px] border border-white/7 bg-[#101010] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#8c96ab]">{`Scene ${scene.sceneNumber}`}</p>
          <p className="mt-2 text-[18px] font-semibold text-white">{scene.title}</p>
        </div>
        <button className="rounded-[9px] border border-white/10 px-4 py-2 text-[12px] uppercase tracking-[0.18em] text-[#ead6ef] disabled:opacity-40" disabled={regeneratePending} onClick={() => onSceneRegenerate(scene.id)} type="button">
          Restore AI scene
        </button>
      </div>
      <TimingSlider field="start" onSceneTimingChange={onSceneTimingChange} scene={scene} totalDuration={totalDuration} value={scene.start} />
      <TimingSlider field="end" onSceneTimingChange={onSceneTimingChange} scene={scene} totalDuration={totalDuration} value={scene.end} />
      <div className="mt-4 flex gap-2">
        <NudgeButton label="-0.5s" onClick={() => onSceneNudge(scene.id, -0.5)} />
        <NudgeButton label="+0.5s" onClick={() => onSceneNudge(scene.id, 0.5)} />
        <NudgeButton label="+1.0s" onClick={() => onSceneNudge(scene.id, 1)} />
      </div>
    </div>
  );
}

function TimingSlider({
  field,
  onSceneTimingChange,
  scene,
  totalDuration,
  value,
}: {
  field: "start" | "end";
  onSceneTimingChange: (sceneId: string, field: "start" | "end", value: number) => void;
  scene: EditorSceneDraft;
  totalDuration: number;
  value: number;
}) {
  return (
    <label className="mt-4 block">
      <div className="mb-2 flex items-center justify-between text-[13px] uppercase tracking-[0.2em] text-[#8c96ab]">
        <span>{field}</span>
        <span className="text-[#d6dbe6]">{formatSeconds(value)}</span>
      </div>
      <input className="w-full accent-white" max={totalDuration} min={0} onChange={(event) => onSceneTimingChange(scene.id, field, Number(event.target.value))} step={0.1} type="range" value={value} />
    </label>
  );
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
    <button className={`relative h-full border-r border-[#3070d9] text-left ${isSelected ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`} onClick={onClick} style={{ minWidth: 220, width }} type="button">
      <div className="absolute inset-x-3 top-3 flex gap-1">
        {Array.from({ length: 11 }).map((_, index) => (
          <span key={index} className="h-[68px] flex-1 rounded-[4px] bg-black/10" />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.34))] px-5 py-4 text-white">
        <p className="text-xs uppercase tracking-[0.28em] text-white/85">{`Scene ${scene.sceneNumber}`}</p>
        <p className="mt-1 truncate text-[18px] font-semibold">{scene.title}</p>
      </div>
    </button>
  );
}

function ScrollbarTrack() {
  return (
    <div className="mt-4 h-3 rounded-full bg-[#2b2b2b] px-1.5 py-0.5">
      <div className="h-full w-[86%] rounded-full bg-[#5b5b5b]" />
    </div>
  );
}

function NudgeButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return <button className="rounded-[8px] border border-white/8 px-3 py-2 text-[12px] font-medium text-[#d5dae4]" onClick={onClick} type="button">{label}</button>;
}

function TransportButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return <button className="grid h-10 w-10 place-items-center rounded-[10px] border border-white/8 bg-[#151515] text-[#cfd5df]" onClick={onClick} type="button">{children}</button>;
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

function scenesSelectedForTimeline(scenes: EditorSceneDraft[], selectedSceneId: string) {
  return scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0] ?? null;
}

function formatSeconds(seconds: number) {
  return `${seconds.toFixed(1)}s`;
}

function formatTimelineTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const frames = Math.round((seconds - wholeSeconds) * 30);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = wholeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
}
