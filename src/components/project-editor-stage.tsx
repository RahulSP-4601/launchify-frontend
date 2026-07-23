"use client";

import type { ReactNode, RefObject } from "react";

import { EditorAspectRatio, EditorCaptionDraft, EditorSceneDraft, ProjectEditorDraft, sceneDuration } from "@/components/project-editor-draft";
import { PauseIcon, PlayIcon, ScissorIcon, StepForwardIcon, StepIcon } from "@/components/project-editor-icons";

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
    <section className="relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#0d0d0d]">
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
    <section className="rounded-[10px] bg-[#262221] px-4 pb-4 pt-3 text-[#bcbcbc]">
      <TransportBar currentTime={currentTime} isPlaying={isPlaying} onTogglePlayback={onTogglePlayback} totalDuration={totalDuration} />
      <TimelineRuler currentTime={currentTime} onSeek={onSeek} totalDuration={totalDuration} />
      <VideoTrack currentTime={currentTime} onSceneSelect={onSceneSelect} onSeek={onSeek} scenes={draft.scenes} selectedSceneId={selectedSceneId} totalDuration={totalDuration} />
      <ScrollbarTrack />
    </section>
  );
}

function StageSafeFrame({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-full w-full place-items-center px-[28px]">
      <div className="grid w-full max-w-[968px] place-items-center rounded-[1px] border border-dashed border-[#cf58bd] p-8">
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
    <div className={`relative mx-auto w-full overflow-hidden rounded-[10px] bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.03)] ${ratioClass}`}>
      {preview.sourceUrl ? <PreviewVideo onTogglePlayback={preview.togglePlayback} sourceUrl={preview.sourceUrl} videoRef={preview.videoRef} /> : <PreviewFallback aspectRatio={aspectRatio} detail={preview.error} scene={selectedScene} />}
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
  aspectRatio,
  detail,
  scene,
}: {
  aspectRatio: EditorAspectRatio;
  detail: string;
  scene: EditorSceneDraft | null;
}) {
  const layoutClass = fallbackLayoutClass(aspectRatio);
  const footerLayoutClass = fallbackFooterLayoutClass(aspectRatio);
  return (
    <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_top,rgba(114,84,33,0.16),transparent_40%),linear-gradient(180deg,#071011,#06090b)] p-8 text-left">
      <div className="w-full rounded-[18px] border border-white/6 bg-[linear-gradient(180deg,rgba(30,31,30,0.88),rgba(15,18,18,0.95))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
        <MockPreviewHeader />
        <div className={`mt-6 grid ${layoutClass}`}>
          <MockPreviewHero detail={detail} scene={scene} />
          <MockPreviewSidebar />
        </div>
        <MockPreviewFooter layoutClass={footerLayoutClass} />
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
  return <div className="absolute bottom-0 right-3 rounded-[8px] bg-[#252525] px-4 py-2 text-[14px] text-[#d7d7d7]">{children}</div>;
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
      <div className="flex items-center gap-[14px]">
        <TransportButton onClick={onTogglePlayback}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</TransportButton>
        <TransportButton><StepIcon /></TransportButton>
        <TransportButton><StepForwardIcon /></TransportButton>
        <span className="min-w-[186px] text-[14px] text-[#bcbcbc]">{formatTimelineTime(currentTime)}f / {formatTimelineTime(totalDuration)}f</span>
        <span className="text-[14px] text-[#d9d9d9]">1x</span>
        <span className="text-[14px] text-[#d9d9d9]">High res</span>
        <TransportButton><ScissorIcon /></TransportButton>
        <TransportButton>+</TransportButton>
      </div>
      <div className="flex items-center gap-1.5 text-[#18a56a]">
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
    <div className="relative mt-4 h-8">
      <button className="absolute left-0 top-0 rounded-[4px] bg-white px-2 py-1 text-[12px] text-black" onClick={() => onSeek(0)} type="button">
        0s
      </button>
      <div className="ml-12 mr-2 flex h-full items-end">
        {marks.map((tick) => (
          <button key={tick} className="flex-1 text-center text-[12px] text-[#6d6d6d]" onClick={() => onSeek(tick)} type="button">
            {tick}s
          </button>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/6" />
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
    <div className="mt-2.5 overflow-x-auto">
      <div className="relative min-w-[1600px] rounded-[2px] border border-[#0e4d98] bg-[#0f61ca]">
        <Playhead currentTime={currentTime} totalDuration={totalDuration} />
        <TrackMarkers scenes={scenes} totalDuration={totalDuration} />
        <div className="flex h-[31px] items-center border-b border-white/10 px-3">
          <span className="rounded-[4px] border border-white/20 bg-[#145db4] px-2 py-1 text-[13px] font-medium text-white">Video</span>
        </div>
        <div className="flex h-[62px]">
          {scenes.map((scene) => (
            <TrackSegment key={scene.id} isSelected={scene.id === selectedSceneId} onClick={() => handleSceneClick(onSceneSelect, onSeek, scene)} scene={scene} totalDuration={totalDuration} />
          ))}
        </div>
        <ThumbnailStrip scenes={scenes} totalDuration={totalDuration} />
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
    <div className="flex h-[39px] border-t border-black/20 bg-[#060606]">
      {scenes.map((scene) => (
        <div key={`${scene.id}-thumbs`} className="flex h-full border-r border-white/10 px-[1px] py-1" style={{ width: `${Math.max((sceneDuration(scene) / Math.max(totalDuration, 1)) * 100, 8)}%`, minWidth: 170 }}>
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
    <div className="pointer-events-none absolute inset-x-0 top-[-8px] h-2">
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
    <button className={`relative h-full border-r border-[#2a7de8] text-left ${isSelected ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`} onClick={onClick} style={{ minWidth: 170, width }} type="button">
      <div className="absolute inset-x-4 bottom-2 text-white">
        <p className="truncate text-[10px] uppercase tracking-[0.24em] text-white/65">{`Scene ${scene.sceneNumber}`}</p>
        <p className="mt-2 truncate text-[11px] font-semibold tracking-[0.01em]">{scene.title}</p>
      </div>
    </button>
  );
}

function ScrollbarTrack() {
  return (
    <div className="mt-3 h-3 rounded-full bg-[#4f4f4f] px-1 py-[3px]">
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

function MockPreviewHeader() {
  return (
    <div className="flex items-center justify-between rounded-full border border-white/6 bg-[linear-gradient(90deg,rgba(37,42,43,0.85),rgba(42,35,24,0.88),rgba(25,30,31,0.85))] px-4 py-3">
      <span className="text-[10px] uppercase tracking-[0.42em] text-[#c7ab54]">Pronouncly</span>
      <div className="flex items-center gap-4 text-[9px] text-[#8f938f]">
        <span>Courses</span>
        <span className="rounded-full border border-white/8 px-3 py-1 text-[#a1a6a1]">Google Login</span>
      </div>
    </div>
  );
}

function MockPreviewHero({
  detail,
  scene,
}: {
  detail: string;
  scene: EditorSceneDraft | null;
}) {
  return (
    <div className="pt-4">
      <span className="inline-flex rounded-full bg-[#2d2818] px-4 py-2 text-[10px] text-[#d0a954]">Preview pending</span>
      <h2 className="mt-5 max-w-[460px] text-[36px] font-semibold leading-[1.02] tracking-[-0.04em] text-white">Rendered preview will appear here when this scene is ready.</h2>
      <p className="mt-5 max-w-[470px] text-[13px] leading-7 text-[#9a9f9a]">
        {detail || `Launchify is still preparing media for ${scene?.title || "the selected scene"}. This styled canvas is a placeholder, not the final rendered output.`}
      </p>
      <div className="mt-6 flex items-center gap-3">
        <span className="rounded-full bg-[linear-gradient(90deg,#f2b35f,#ff8b63)] px-5 py-3 text-[12px] font-medium text-white">Rendering</span>
        <span className="rounded-full border border-white/8 bg-[#202525] px-5 py-3 text-[12px] font-medium text-[#d9dbd9]">Awaiting media</span>
      </div>
    </div>
  );
}

function MockPreviewSidebar() {
  return (
    <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(40,42,40,0.96),rgba(22,26,24,0.96))] p-4 shadow-[0_18px_34px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.28em] text-[#96804f]">
        <span>Preview Status</span>
        <span className="rounded-full bg-[#21352c] px-3 py-1 text-[8px] tracking-normal text-[#6ec59a]">Placeholder</span>
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-[#f4f5f4]">Media generation in progress</h3>
      <p className="mt-2 text-[11px] leading-6 text-[#9ba09a]">The final frame, captions, and rendered scene layout will replace this placeholder automatically when assets are available.</p>
      <PreviewInfoCard label="Video asset" value="Not ready yet" />
      <PreviewInfoCard label="Rendered state" value="Showing placeholder preview only" />
      <div className="mt-4 grid grid-cols-3 gap-3">
        <PreviewStatCard label="Scene data" value="Loaded" />
        <PreviewStatCard label="Media file" value="Pending" />
        <PreviewStatCard label="Preview" value="Mock" />
      </div>
    </div>
  );
}

function MockPreviewFooter({ layoutClass }: { layoutClass: string }) {
  return (
    <div className={`mt-4 grid ${layoutClass}`}>
      <PreviewFeatureCard title="Scene" body="Selected scene metadata is available for layout preview." />
      <PreviewFeatureCard title="Captions" body="Caption overlays will appear once the final timing is rendered." />
      <PreviewFeatureCard title="Media" body="Video and image assets are still being processed." />
      <div className="rounded-[16px] border border-[#29373b] bg-[linear-gradient(90deg,rgba(34,28,49,0.78),rgba(22,35,47,0.82))] p-4">
        <p className="text-[9px] uppercase tracking-[0.28em] text-[#8887cf]">Placeholder Notice</p>
        <p className="mt-2 max-w-[220px] text-[11px] leading-5 text-[#aeb3c8]">This panel mirrors the target composition style only. It is not the actual exported or generated preview.</p>
      </div>
    </div>
  );
}

function PreviewInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 rounded-[14px] border border-white/6 bg-[#111918] p-4">
      <p className="text-[9px] uppercase tracking-[0.28em] text-[#66716d]">{label}</p>
      <p className="mt-2 text-[12px] text-[#dfe3df]">{value}</p>
    </div>
  );
}

function PreviewStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-white/6 bg-[#1d2121] p-3">
      <p className="text-[8px] uppercase tracking-[0.22em] text-[#6f7470]">{label}</p>
      <p className="mt-2 text-[15px] font-semibold text-white">{value}</p>
    </div>
  );
}

function PreviewFeatureCard({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-[#171c1c] p-4">
      <p className="text-[12px] font-semibold text-white">{title}</p>
      <p className="mt-3 text-[10px] leading-5 text-[#909693]">{body}</p>
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

function thumbnailCount(scene: EditorSceneDraft, totalDuration: number) {
  const ratio = sceneDuration(scene) / Math.max(totalDuration, 1);
  return Math.max(10, Math.min(24, Math.round(ratio * 58)));
}

function fallbackLayoutClass(aspectRatio: EditorAspectRatio) {
  if (aspectRatio === "9:16") {
    return "grid-cols-1 gap-5";
  }
  if (aspectRatio === "1:1") {
    return "grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6";
  }
  return "grid-cols-[minmax(0,1.06fr)_320px] gap-8";
}

function fallbackFooterLayoutClass(aspectRatio: EditorAspectRatio) {
  if (aspectRatio === "9:16") {
    return "grid-cols-1 gap-3";
  }
  if (aspectRatio === "1:1") {
    return "grid-cols-1 gap-3 md:grid-cols-2";
  }
  return "grid-cols-[repeat(3,minmax(0,1fr))_1.28fr] gap-3";
}

function formatTimelineTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const frames = Math.round((seconds - wholeSeconds) * 30);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = wholeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
}
