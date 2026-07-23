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
    <section className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#080808] px-6 py-6">
      <div className="absolute bottom-6 right-6 z-10 rounded-[10px] bg-[#1f1f1f] px-3 py-2 text-sm text-slate-300">100%</div>
      <div className="w-full max-w-[980px] rounded-[18px] border border-dashed border-[#db44d8] p-6">
        <PreviewCanvas
          activeCaption={preview.activeCaption}
          aspectRatio={draft.aspectRatio}
          preview={preview}
          selectedScene={selectedScene}
          showCaptions={draft.showCaptions}
        />
      </div>
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
  const selectedScene = draft.scenes.find((scene) => scene.id === draft.selectedSceneId) ?? draft.scenes[0] ?? null;
  return (
    <section className="rounded-[18px] bg-[#0c0c0c] px-5 pb-4 pt-3">
      <TimelineControlBar currentTime={currentTime} isPlaying={isPlaying} onSeek={onSeek} onTogglePlayback={onTogglePlayback} totalDuration={totalDuration} />
      <div className="mt-4 rounded-[14px] border border-white/6 bg-[#0f0f0f]">
        <SceneTrackHeader scenes={draft.scenes} />
        <SceneFilmstrip onSceneSelect={onSceneSelect} scenes={draft.scenes} selectedSceneId={selectedScene?.id ?? ""} totalDuration={totalDuration} />
      </div>
      {selectedScene ? (
        <TimelineSceneEditor
          onSceneNudge={onSceneNudge}
          onSceneRegenerate={onSceneRegenerate}
          onSceneTimingChange={onSceneTimingChange}
          regeneratePending={regeneratePending}
          scene={selectedScene}
          totalDuration={totalDuration}
        />
      ) : null}
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
    <div className={`relative mx-auto w-full max-w-[890px] overflow-hidden rounded-[18px] bg-[#101010] ${ratioClass}`}>
      {preview.sourceUrl ? (
        <EditorVideo onTogglePlayback={preview.togglePlayback} sourceUrl={preview.sourceUrl} videoRef={preview.videoRef} />
      ) : (
        <EditorVideoEmptyState detail={preview.error} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.34))]" />
      {selectedScene ? <SceneOverlay selectedScene={selectedScene} /> : null}
      {showCaptions && activeCaption ? <CaptionOverlay text={activeCaption.text} /> : null}
    </div>
  );
}

function TimelineControlBar({
  currentTime,
  isPlaying,
  onSeek,
  onTogglePlayback,
  totalDuration,
}: {
  currentTime: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onTogglePlayback: () => void;
  totalDuration: number;
}) {
  return (
    <div className="flex items-center gap-4 text-slate-400">
      <button className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/8" onClick={onTogglePlayback} type="button">
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/8" type="button">
        <StepIcon />
      </button>
      <button className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/8" type="button">
        <StepForwardIcon />
      </button>
      <span className="min-w-[128px] text-sm text-slate-300">{formatTimelineTime(currentTime)}f / {formatTimelineTime(totalDuration)}f</span>
      <span className="text-sm text-slate-300">1x</span>
      <span className="text-sm text-slate-300">High res</span>
      <div className="flex items-center gap-3">
        <ToolbarGhostIcon><ScissorIcon /></ToolbarGhostIcon>
        <ToolbarGhostIcon>+</ToolbarGhostIcon>
      </div>
      <input className="ml-auto h-2 w-[min(44vw,860px)] cursor-pointer appearance-none rounded-full bg-white/10" max={Math.max(totalDuration, 0.1)} min={0} onChange={(event) => onSeek(Number(event.target.value))} step={0.1} type="range" value={Math.min(currentTime, totalDuration)} />
    </div>
  );
}

function SceneTrackHeader({ scenes }: { scenes: EditorSceneDraft[] }) {
  return (
    <div className="border-b border-white/6 bg-[#121212] px-4 py-3 text-sm text-slate-500">
      <div className="flex items-center gap-3">
        <span className="rounded-[8px] bg-[#115bd4] px-3 py-1 text-white">Video</span>
        <span>{scenes.length} scenes</span>
      </div>
    </div>
  );
}

function SceneFilmstrip({
  onSceneSelect,
  scenes,
  selectedSceneId,
  totalDuration,
}: {
  onSceneSelect: (scene: EditorSceneDraft) => void;
  scenes: EditorSceneDraft[];
  selectedSceneId: string;
  totalDuration: number;
}) {
  return (
    <div className="overflow-x-auto px-3 py-3">
      <div className="flex min-w-max gap-1">
        {scenes.map((scene) => (
          <SceneStripSegment
            key={scene.id}
            isSelected={scene.id === selectedSceneId}
            onClick={() => onSceneSelect(scene)}
            scene={scene}
            totalDuration={totalDuration}
          />
        ))}
      </div>
      <div className="mt-3 h-3 rounded-full bg-[#2a2a2a]" />
    </div>
  );
}

function EditorVideo({
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

function EditorVideoEmptyState({ detail }: { detail: string }) {
  return (
    <div className="grid h-full w-full place-items-center bg-[#101010] p-8 text-center">
      <div className="max-w-lg">
        <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-200">Editor preview pending</p>
        <p className="mt-4 text-lg font-semibold text-white">Launchify will load the source or rendered preview here once the media is ready.</p>
        <p className="mt-3 text-sm leading-7 text-slate-400">{detail || "No video asset is available yet for this project."}</p>
      </div>
    </div>
  );
}

function SceneOverlay({ selectedScene }: { selectedScene: EditorSceneDraft }) {
  return (
    <div className="absolute left-6 top-6 rounded-full bg-black/65 px-5 py-3 text-xs uppercase tracking-[0.24em] text-white">
      Scene {selectedScene.sceneNumber}: {selectedScene.title}
    </div>
  );
}

function CaptionOverlay({ text }: { text: string }) {
  return (
    <div className="absolute inset-x-10 bottom-8 rounded-[16px] bg-black/70 px-5 py-4 text-center text-base font-medium text-white">
      {text}
    </div>
  );
}

function SceneStripSegment({
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
  const width = `${Math.max((sceneDuration(scene) / Math.max(totalDuration, 1)) * 100, 10)}%`;
  return (
    <button className={`relative h-20 overflow-hidden rounded-[10px] border ${isSelected ? "border-white/30 bg-[#0b4fa4]" : "border-white/6 bg-[#1f1f1f]"}`} onClick={onClick} style={{ width, minWidth: 120 }} type="button">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.16))]" />
      <div className="absolute inset-x-0 top-0 flex gap-[2px] px-[2px] pt-[2px]">
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index} className="h-12 flex-1 rounded-[4px] bg-white/10" />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 px-3 py-2 text-left text-white">
        <p className="text-[11px] uppercase tracking-[0.24em]">{`Scene ${scene.sceneNumber}`}</p>
        <p className="mt-1 truncate text-sm font-semibold">{scene.title}</p>
      </div>
    </button>
  );
}

function TimelineSceneEditor({
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
    <div className="mt-4 rounded-[16px] border border-white/6 bg-[#111111] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Timeline Editing</p>
          <p className="mt-2 text-xl font-semibold text-white">{scene.title}</p>
        </div>
        <button className="rounded-[12px] border border-fuchsia-400/30 px-4 py-3 text-sm font-medium text-fuchsia-200 disabled:opacity-40" disabled={regeneratePending} onClick={() => onSceneRegenerate(scene.id)} type="button">
          Restore AI scene
        </button>
      </div>
      <SceneRangeField field="start" onChange={onSceneTimingChange} scene={scene} totalDuration={totalDuration} />
      <SceneRangeField field="end" onChange={onSceneTimingChange} scene={scene} totalDuration={totalDuration} />
      <div className="mt-5 flex flex-wrap gap-3">
        <NudgeButton label="-0.5s" onClick={() => onSceneNudge(scene.id, -0.5)} />
        <NudgeButton label="+0.5s" onClick={() => onSceneNudge(scene.id, 0.5)} />
        <NudgeButton label="+1.0s" onClick={() => onSceneNudge(scene.id, 1)} />
      </div>
    </div>
  );
}

function SceneRangeField({
  field,
  onChange,
  scene,
  totalDuration,
}: {
  field: "start" | "end";
  onChange: (sceneId: string, field: "start" | "end", value: number) => void;
  scene: EditorSceneDraft;
  totalDuration: number;
}) {
  const value = field === "start" ? scene.start : scene.end;
  return (
    <label className="mt-5 block">
      <span className="text-xs uppercase tracking-[0.24em] text-slate-500">{field}</span>
      <input className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10" max={Math.max(totalDuration, 0.5)} min={0} onChange={(event) => onChange(scene.id, field, Number(event.target.value))} step={0.1} type="range" value={value} />
      <p className="mt-3 text-sm text-slate-300">{formatTimelineTime(value)}</p>
    </label>
  );
}

function NudgeButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button className="rounded-[10px] border border-white/8 px-3 py-2 text-sm text-slate-300" onClick={onClick} type="button">{label}</button>;
}

function ToolbarGhostIcon({ children }: { children: ReactNode }) {
  return <button className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/8" type="button">{children}</button>;
}

function formatTimelineTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const frames = Math.round((seconds - wholeSeconds) * 30);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = wholeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
}
