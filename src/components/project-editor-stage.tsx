"use client";

import { useState } from "react";
import type { ReactNode, RefObject } from "react";

import { EditorAspectRatio, EditorCaptionDraft, EditorSceneDraft, ProjectEditorDraft, isInsertedScene } from "@/components/project-editor-draft";
import { ReferencePreviewMock } from "@/components/project-editor-reference-preview";
import { TrackStack as TimelineTrackStack } from "@/components/project-editor-timeline-tracks";
import { TimelineTransportBar } from "@/components/project-editor-timeline-controls";

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

type EditorTimelineProps = {
  currentTime: number;
  draft: ProjectEditorDraft;
  editMode: "overwrite" | "insert";
  isPlaying: boolean;
  onAddOverlayCallout: () => void;
  onAddScreen: () => void;
  onAddVideoTrack: () => void;
  onEditModeChange: (mode: "overwrite" | "insert") => void;
  onExtractScene: () => void;
  onLiftScene: () => void;
  onRollBoundary: (deltaSeconds: number) => void;
  onRippleDeleteScene: () => void;
  onSelectTrack: (trackId: string) => void;
  onToggleTrackLocked: (trackId: string) => void;
  onToggleTrackMuted: (trackId: string) => void;
  onSplitScene: (time: number) => void;
  onSlideScene: (deltaSeconds: number) => void;
  onSceneSelect: (scene: EditorSceneDraft) => void;
  onSeek: (time: number) => void;
  onSlipScene: (deltaSeconds: number) => void;
  onTrimBoundary: (sceneId: string, time: number) => void;
  onTogglePlayback: () => void;
  totalDuration: number;
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

export function EditorTimeline(props: EditorTimelineProps) {
  const {
    currentTime,
    draft,
    editMode,
    isPlaying,
    onAddOverlayCallout,
    onAddScreen,
    onAddVideoTrack,
    onEditModeChange,
    onExtractScene,
    onLiftScene,
    onRollBoundary,
    onRippleDeleteScene,
    onSelectTrack,
    onSceneSelect,
    onSeek,
    onSlipScene,
    onSplitScene,
    onSlideScene,
    onTogglePlayback,
    onToggleTrackLocked,
    onToggleTrackMuted,
    onTrimBoundary,
    totalDuration,
  } = props;
  const selectedSceneId = draft.selectedSceneId || draft.scenes[0]?.id || "";
  const [zoom, setZoom] = useState(1.15);
  return (
    <section className="rounded-[10px] bg-[#262221] px-4 pb-3 pt-[10px] text-[#bcbcbc]">
      <TimelineTransportBar currentTime={currentTime} editMode={editMode} isPlaying={isPlaying} onAddOverlayCallout={onAddOverlayCallout} onAddScreen={onAddScreen} onAddVideoTrack={onAddVideoTrack} onEditModeChange={onEditModeChange} onExtractScene={onExtractScene} onLiftScene={onLiftScene} onRollBoundary={onRollBoundary} onRippleDeleteScene={onRippleDeleteScene} onSplitScene={onSplitScene} onSlideScene={onSlideScene} onTogglePlayback={onTogglePlayback} totalDuration={totalDuration} zoom={zoom} onZoomChange={setZoom} onSlipScene={onSlipScene} />
      <TimelineRuler currentTime={currentTime} onSeek={onSeek} totalDuration={totalDuration} />
      <TrackStack currentTime={currentTime} draft={draft} onSceneSelect={onSceneSelect} onSeek={onSeek} onSelectTrack={onSelectTrack} onToggleTrackLocked={onToggleTrackLocked} onToggleTrackMuted={onToggleTrackMuted} onTrimBoundary={onTrimBoundary} selectedSceneId={selectedSceneId} selectedTrackId={draft.selectedTrackId} totalDuration={totalDuration} zoom={zoom} />
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
  const insertedScene = preview.activeScene && isInsertedScene(preview.activeScene) ? preview.activeScene : null;
  return (
    <div className={`relative mx-auto w-full overflow-hidden rounded-[14px] bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.03)] ${ratioClass}`}>
      {insertedScene
        ? <InsertedScenePreview scene={insertedScene} />
        : preview.sourceUrl
          ? <PreviewVideo onTogglePlayback={preview.togglePlayback} sourceUrl={preview.sourceUrl} videoRef={preview.videoRef} />
          : <PreviewFallback detail={preview.error} scene={selectedScene} />}
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

function InsertedScenePreview({ scene }: { scene: EditorSceneDraft }) {
  return (
    <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_top,rgba(132,89,214,0.16),transparent_42%),linear-gradient(180deg,#0b1116,#090b10)] p-10">
      <div className="w-full max-w-[560px] rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(29,29,34,0.94),rgba(16,16,20,0.96))] p-8 text-left shadow-[0_24px_48px_rgba(0,0,0,0.34)]">
        <p className="text-[11px] uppercase tracking-[0.34em] text-[#9e95ff]">Inserted Screen</p>
        <h3 className="mt-4 text-[32px] font-semibold leading-[1.04] tracking-[-0.04em] text-white">{scene.title}</h3>
        <p className="mt-5 text-[14px] leading-7 text-[#bdbdd3]">{scene.onScreenText}</p>
        <div className="mt-8 flex items-center gap-3">
          <span className="rounded-full bg-[#6f58ff] px-4 py-2 text-[12px] font-medium text-white">5 second screen</span>
          <span className="rounded-full border border-white/8 px-4 py-2 text-[12px] text-[#d6d6e4]">{`${scene.start.toFixed(1)}s - ${scene.end.toFixed(1)}s`}</span>
        </div>
      </div>
    </div>
  );
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

function TrackStack({
  currentTime,
  draft,
  onSceneSelect,
  onSeek,
  onSelectTrack,
  onToggleTrackLocked,
  onToggleTrackMuted,
  onTrimBoundary,
  selectedSceneId,
  selectedTrackId,
  totalDuration,
  zoom,
}: {
  currentTime: number;
  draft: ProjectEditorDraft;
  onSceneSelect: (scene: EditorSceneDraft) => void;
  onSeek: (time: number) => void;
  onSelectTrack: (trackId: string) => void;
  onToggleTrackLocked: (trackId: string) => void;
  onToggleTrackMuted: (trackId: string) => void;
  onTrimBoundary: (sceneId: string, time: number) => void;
  selectedSceneId: string;
  selectedTrackId: string;
  totalDuration: number;
  zoom: number;
}) {
  return <TimelineTrackStack currentTime={currentTime} draft={draft} onSceneSelect={onSceneSelect} onSeek={onSeek} onSelectTrack={onSelectTrack} onToggleTrackLocked={onToggleTrackLocked} onToggleTrackMuted={onToggleTrackMuted} onTrimBoundary={onTrimBoundary} selectedSceneId={selectedSceneId} selectedTrackId={selectedTrackId} totalDuration={totalDuration} zoom={zoom} />;
}

function ScrollbarTrack() {
  return (
    <div className="mt-3 h-[10px] rounded-full bg-[#4f4f4f] px-1 py-[2px]">
      <div className="h-full w-[89%] rounded-full bg-[#6f6f6f]" />
    </div>
  );
}

function timelineTicks(totalDuration: number) {
  const maxTick = Math.max(Math.ceil(totalDuration), 5);
  return Array.from({ length: Math.min(7, maxTick + 1) }, (_, index) => index * 5).filter((tick) => tick <= maxTick);
}
