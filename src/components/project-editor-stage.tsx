"use client";

import type { ReactNode, RefObject } from "react";

import { EditorAspectRatio, EditorCaptionDraft, EditorSceneDraft, ProjectEditorDraft, sceneDuration } from "@/components/project-editor-draft";
import { PauseIcon, PlayIcon, ScissorIcon, StepForwardIcon, StepIcon } from "@/components/project-editor-icons";
import { ReferencePreviewMock } from "@/components/project-editor-reference-preview";

export type ProjectEditorPreviewState = {
  activeCaption: EditorCaptionDraft | null;
  activeScene: EditorSceneDraft | null;
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
    <section className="relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#0f0f0f]">
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
  onSceneSelect,
  onSeek,
  onTogglePlayback,
  totalDuration,
}: {
  currentTime: number;
  draft: ProjectEditorDraft;
  isPlaying: boolean;
  onSceneSelect: (scene: EditorSceneDraft) => void;
  onSeek: (time: number) => void;
  onTogglePlayback: () => void;
  totalDuration: number;
}) {
  const selectedSceneId = draft.selectedSceneId || draft.scenes[0]?.id || "";
  return (
    <section className="rounded-[10px] bg-[#262221] px-4 pb-3 pt-[10px] text-[#bcbcbc]">
      <TransportBar currentTime={currentTime} isPlaying={isPlaying} onTogglePlayback={onTogglePlayback} totalDuration={totalDuration} />
      <TimelineRuler currentTime={currentTime} onSeek={onSeek} totalDuration={totalDuration} />
      <VideoTrack currentTime={currentTime} onSceneSelect={onSceneSelect} onSeek={onSeek} scenes={draft.scenes} selectedSceneId={selectedSceneId} totalDuration={totalDuration} />
      <ScrollbarTrack />
    </section>
  );
}

function StageSafeFrame({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-full w-full place-items-center px-[26px]">
      <div className="grid w-full max-w-[978px] place-items-center rounded-[1px] border border-dashed border-[#cf58bd] px-[38px] py-[30px]">
        {children}
      </div>
    </div>
  );
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
  const ratioClass = aspectRatio === "9:16" ? "aspect-[9/16] max-w-[430px]" : aspectRatio === "1:1" ? "aspect-square max-w-[700px]" : "aspect-[16/9] max-w-[860px]";
  return (
    <div className={`relative mx-auto w-full overflow-hidden rounded-[14px] bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.03)] ${ratioClass}`}>
      {preview.sourceUrl ? <PreviewVideo onTogglePlayback={preview.togglePlayback} sourceUrl={preview.sourceUrl} videoRef={preview.videoRef} /> : <PreviewFallback detail={preview.error} scene={selectedScene} />}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.18))]" />
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

function PreviewFallback({
  detail,
  scene,
}: {
  detail: string;
  scene: EditorSceneDraft | null;
}) {
  return <ReferencePreviewMock detail={detail} scene={scene} />;
}

function SceneBadge({ title }: { title: string }) {
  return (
    <div className="absolute left-10 top-8 rounded-full bg-black/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.42em] text-white/95 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      {title}
    </div>
  );
}

function CaptionOverlay({ text }: { text: string }) {
  return <div className="absolute inset-x-8 bottom-6 rounded-[8px] bg-black/72 px-4 py-3 text-center text-[14px] font-medium text-white">{text}</div>;
}

function ZoomBadge({ children }: { children: ReactNode }) {
  return <div className="absolute bottom-0 right-4 rounded-[10px] bg-[#252525] px-4 py-2.5 text-[14px] text-[#d7d7d7]">{children}</div>;
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
    <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3">
      <div className="flex items-center gap-[12px]">
        <TransportButton onClick={onTogglePlayback}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</TransportButton>
        <TransportButton><StepIcon /></TransportButton>
        <TransportButton><StepForwardIcon /></TransportButton>
        <span className="min-w-[194px] text-[14px] text-[#bcbcbc]">{formatTimelineTime(currentTime)}f / {formatTimelineTime(totalDuration)}f</span>
        <span className="text-[14px] text-[#d9d9d9]">1x</span>
        <span className="text-[14px] text-[#d9d9d9]">High res</span>
        <TransportButton><ScissorIcon /></TransportButton>
        <TransportButton>+</TransportButton>
      </div>
      <div className="flex items-center gap-1 text-[#18a56a]">
        <TransportGhost>⤴</TransportGhost>
        <TransportGhost>⌖</TransportGhost>
        <TransportGhost>⚙</TransportGhost>
        <TransportGhost>▭</TransportGhost>
      </div>
    </div>
  );
}

function TimelineRuler({
  currentTime,
  onSeek,
  totalDuration,
}: {
  currentTime: number;
  onSeek: (time: number) => void;
  totalDuration: number;
}) {
  const marks = timelineTicks(totalDuration);
  return (
    <div className="relative mt-3 h-10">
      <button className="absolute left-0 top-0 rounded-[4px] bg-white px-2 py-1 text-[12px] text-black" onClick={() => onSeek(0)} type="button">
        0s
      </button>
      <div className="ml-12 mr-2 flex h-full items-start pt-[13px]">
        {marks.map((tick) => (
          <button key={tick} className="flex-1 text-center text-[12px] text-[#6d6d6d]" onClick={() => onSeek(tick)} type="button">
            {tick}s
          </button>
        ))}
      </div>
      <div className="absolute bottom-[3px] left-0 right-0 h-px bg-white/6" />
      <div className="absolute top-0 h-full w-px bg-[#f7f7f7]" style={{ left: `${Math.min((currentTime / Math.max(totalDuration, 1)) * 100, 100)}%` }} />
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
    <div className="mt-1 overflow-x-auto">
      <div className="relative min-w-[1600px] rounded-[2px] border border-[#0c55a9] bg-[#0f61ca]">
        <Playhead currentTime={currentTime} totalDuration={totalDuration} />
        <TrackMarkers scenes={scenes} totalDuration={totalDuration} />
        <div className="flex h-[30px] items-center border-b border-white/10 px-3">
          <span className="rounded-[4px] border border-white/20 bg-[#145db4] px-2 py-[3px] text-[13px] font-medium text-white">Video</span>
        </div>
        <div className="flex h-[74px]">
          {scenes.map((scene) => (
            <TrackSegment key={scene.id} isSelected={scene.id === selectedSceneId} onClick={() => handleSceneClick(onSceneSelect, onSeek, scene)} scene={scene} totalDuration={totalDuration} />
          ))}
        </div>
        <ThumbnailStrip scenes={scenes} totalDuration={totalDuration} />
        <div className="h-[42px] border-t border-black/30 bg-[#020202]" />
      </div>
    </div>
  );
}

function ThumbnailStrip({
  scenes,
  totalDuration,
}: {
  scenes: EditorSceneDraft[];
  totalDuration: number;
}) {
  return (
    <div className="flex h-[34px] border-t border-black/20 bg-[#060606]">
      {scenes.map((scene) => (
        <div key={`${scene.id}-thumbs`} className="flex h-full border-r border-white/10 px-[1px] py-[3px]" style={{ width: `${Math.max((sceneDuration(scene) / Math.max(totalDuration, 1)) * 100, 8)}%`, minWidth: 170 }}>
          {Array.from({ length: thumbnailCount(scene, totalDuration) }).map((_, index) => (
            <span key={index} className="mx-[1px] h-full flex-1 rounded-[2px] bg-[linear-gradient(180deg,#4f6770,#101517_58%,#060606)] opacity-95" />
          ))}
        </div>
      ))}
    </div>
  );
}

function TrackMarkers({
  scenes,
  totalDuration,
}: {
  scenes: EditorSceneDraft[];
  totalDuration: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[-6px] h-2">
      {scenes.map((scene) => (
        <span
          key={`${scene.id}-marker`}
          className="absolute h-[2px] w-2 rounded-full bg-[#ef8a3a]"
          style={{ left: `${(scene.start / Math.max(totalDuration, 1)) * 100}%` }}
        />
      ))}
    </div>
  );
}

function Playhead({
  currentTime,
  totalDuration,
}: {
  currentTime: number;
  totalDuration: number;
}) {
  return <div className="absolute inset-y-0 z-10 w-px bg-white" style={{ left: `${Math.min((currentTime / Math.max(totalDuration, 1)) * 100, 100)}%` }} />;
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
    <button className={`relative h-full border-r border-[#2a7de8] text-left ${isSelected ? "bg-white/[0.1]" : "hover:bg-white/[0.04]"}`} onClick={onClick} style={{ minWidth: 170, width }} type="button">
      <div className="absolute inset-x-4 bottom-6 text-white">
        <p className="truncate text-[10px] uppercase tracking-[0.32em] text-white/65">{`Scene ${scene.sceneNumber}`}</p>
        <p className="mt-2 truncate text-[11px] font-semibold tracking-[0.01em]">{scene.title}</p>
      </div>
    </button>
  );
}

function ScrollbarTrack() {
  return (
    <div className="mt-3 h-[10px] rounded-full bg-[#4f4f4f] px-1 py-[2px]">
      <div className="h-full w-[89%] rounded-full bg-[#6f6f6f]" />
    </div>
  );
}

function TransportButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return <button className="grid h-9 w-9 place-items-center rounded-[6px] border border-white/8 bg-transparent text-[#cfcfcf]" onClick={onClick} type="button">{children}</button>;
}

function TransportGhost({ children }: { children: ReactNode }) {
  return <button className="grid h-9 w-9 place-items-center text-[#18a56a]" type="button">{children}</button>;
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

function thumbnailCount(scene: EditorSceneDraft, totalDuration: number) {
  const ratio = sceneDuration(scene) / Math.max(totalDuration, 1);
  return Math.max(8, Math.min(20, Math.round(ratio * 42)));
}

function formatTimelineTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const frames = Math.round((seconds - wholeSeconds) * 30);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = wholeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
}
