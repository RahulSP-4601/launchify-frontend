"use client";

import type { RefObject } from "react";

import {
  EditorAspectRatio,
  EditorCaptionDraft,
  EditorSceneDraft,
  ProjectEditorDraft,
  sceneDuration,
} from "@/components/project-editor-draft";

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
    <section className="rounded-[22px] border border-white/8 bg-[#141414] p-4">
      <div className="rounded-[18px] border border-dashed border-fuchsia-400/60 bg-black p-4">
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
    <section className="rounded-[22px] border border-white/8 bg-[#171717] p-4">
      <TimelineTransport currentTime={currentTime} isPlaying={isPlaying} onSeek={onSeek} onTogglePlayback={onTogglePlayback} totalDuration={totalDuration} />
      <TimelineSceneRow onSceneSelect={onSceneSelect} scenes={draft.scenes} selectedSceneId={selectedScene?.id ?? ""} totalDuration={totalDuration} />
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

function TimelineSceneRow({
  onSceneSelect,
  scenes,
  selectedSceneId,
  totalDuration,
}: {
  onSceneSelect: (scene: EditorSceneDraft) => void;
  scenes: ProjectEditorDraft["scenes"];
  selectedSceneId: string;
  totalDuration: number;
}) {
  return (
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
      {scenes.map((scene) => (
        <TimelineSceneChip
          key={scene.id}
          isSelected={scene.id === selectedSceneId}
          onClick={() => onSceneSelect(scene)}
          scene={scene}
          totalDuration={totalDuration}
        />
      ))}
    </div>
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
    <div className={`relative mx-auto w-full max-w-[980px] overflow-hidden rounded-[20px] bg-[#0a0a0a] ${ratioClass}`}>
      {preview.sourceUrl ? (
        <EditorVideo onTogglePlayback={preview.togglePlayback} sourceUrl={preview.sourceUrl} videoRef={preview.videoRef} />
      ) : (
        <EditorVideoEmptyState detail={preview.error} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.4))]" />
      {selectedScene ? <SceneOverlay selectedScene={selectedScene} /> : null}
      {showCaptions && activeCaption ? <CaptionOverlay text={activeCaption.text} /> : null}
      <CanvasFooter preview={preview} />
    </div>
  );
}

function TimelineTransport({
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
    <div className="flex flex-wrap items-center gap-4">
      <button className="rounded-[14px] border border-white/10 px-4 py-3 text-sm font-semibold text-white" onClick={onTogglePlayback} type="button">
        {isPlaying ? "Pause" : "Play"}
      </button>
      <span className="text-sm text-slate-300">{formatClock(currentTime)} / {formatClock(totalDuration)}</span>
      <input className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/10" max={Math.max(totalDuration, 0.1)} min={0} onChange={(event) => onSeek(Number(event.target.value))} step={0.1} type="range" value={Math.min(currentTime, totalDuration)} />
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
    <div className="absolute left-5 top-5 rounded-full bg-black/60 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-100">
      Scene {selectedScene.sceneNumber}: {selectedScene.title}
    </div>
  );
}

function CaptionOverlay({ text }: { text: string }) {
  return (
    <div className="absolute inset-x-6 bottom-20 rounded-[18px] bg-black/72 px-5 py-4 text-center text-base font-medium leading-7 text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
      {text}
    </div>
  );
}

function CanvasFooter({ preview }: { preview: ProjectEditorPreviewState }) {
  return (
    <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-[16px] border border-white/8 bg-black/68 px-4 py-3 text-xs uppercase tracking-[0.22em] text-slate-300">
      <span>{preview.isRenderedPreview ? "AI edited preview" : "Source draft preview"}</span>
      <span>{formatClock(preview.currentTime)} / {formatClock(preview.totalDuration)}</span>
    </div>
  );
}

function TimelineSceneChip({
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
  const width = `${Math.max((sceneDuration(scene) / Math.max(totalDuration, 1)) * 100, 12)}%`;
  return (
    <button className={`min-w-[140px] rounded-[16px] px-4 py-4 text-left text-white ${isSelected ? "bg-fuchsia-500" : "bg-[#2563eb]"}`} onClick={onClick} style={{ width }} type="button">
      <p className="text-xs uppercase tracking-[0.22em] text-blue-100">Scene {scene.sceneNumber}</p>
      <p className="mt-2 truncate text-sm font-semibold">{scene.title}</p>
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
    <div className="mt-5 rounded-[18px] border border-white/8 bg-[#111] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Timeline editing</p>
          <p className="mt-2 text-lg font-semibold text-white">{scene.title}</p>
        </div>
        <button className="rounded-[12px] border border-fuchsia-400/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-200 disabled:opacity-40" disabled={regeneratePending} onClick={() => onSceneRegenerate(scene.id)} type="button">
          Restore AI scene
        </button>
      </div>
      <SceneRangeField field="start" onChange={onSceneTimingChange} scene={scene} totalDuration={totalDuration} />
      <SceneRangeField field="end" onChange={onSceneTimingChange} scene={scene} totalDuration={totalDuration} />
      <div className="mt-4 flex flex-wrap gap-2">
        <TimelineShiftButton label="-0.5s" onClick={() => onSceneNudge(scene.id, -0.5)} />
        <TimelineShiftButton label="+0.5s" onClick={() => onSceneNudge(scene.id, 0.5)} />
        <TimelineShiftButton label="+1.0s" onClick={() => onSceneNudge(scene.id, 1)} />
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
    <label className="mt-4 block">
      <span className="text-xs uppercase tracking-[0.22em] text-slate-400">{field}</span>
      <input className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10" max={Math.max(totalDuration, 0.5)} min={0} onChange={(event) => onChange(scene.id, field, Number(event.target.value))} step={0.1} type="range" value={value} />
      <p className="mt-2 text-sm text-slate-300">{formatClock(value)}</p>
    </label>
  );
}

function TimelineShiftButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="rounded-[12px] border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200" onClick={onClick} type="button">
      {label}
    </button>
  );
}

function formatClock(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}
