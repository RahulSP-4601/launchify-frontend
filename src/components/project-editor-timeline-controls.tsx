"use client";

import type { ReactNode } from "react";

import { PauseIcon, PlayIcon, ScissorIcon, StepForwardIcon, StepIcon } from "@/components/project-editor-icons";

export function TimelineTransportBar({
  editMode,
  onAddOverlayCallout,
  currentTime,
  isPlaying,
  onAddScreen,
  onAddVideoTrack,
  onEditModeChange,
  onExtractScene,
  onLiftScene,
  onRollBoundary,
  onRippleDeleteScene,
  onSplitScene,
  onSlideScene,
  onTogglePlayback,
  totalDuration,
  zoom,
  onZoomChange,
  onSlipScene,
}: {
  editMode: "overwrite" | "insert";
  onAddOverlayCallout: () => void;
  currentTime: number;
  isPlaying: boolean;
  onEditModeChange: (mode: "overwrite" | "insert") => void;
  onAddScreen: () => void;
  onAddVideoTrack: () => void;
  onExtractScene: () => void;
  onLiftScene: () => void;
  onRollBoundary: (deltaSeconds: number) => void;
  onRippleDeleteScene: () => void;
  onSplitScene: (time: number) => void;
  onSlideScene: (deltaSeconds: number) => void;
  onTogglePlayback: () => void;
  totalDuration: number;
  zoom: number;
  onZoomChange: (value: number) => void;
  onSlipScene: (deltaSeconds: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3">
      <TransportLeftActions currentTime={currentTime} editMode={editMode} isPlaying={isPlaying} onAddOverlayCallout={onAddOverlayCallout} onAddScreen={onAddScreen} onAddVideoTrack={onAddVideoTrack} onEditModeChange={onEditModeChange} onExtractScene={onExtractScene} onLiftScene={onLiftScene} onRollBoundary={onRollBoundary} onRippleDeleteScene={onRippleDeleteScene} onSplitScene={onSplitScene} onSlideScene={onSlideScene} onSlipScene={onSlipScene} onTogglePlayback={onTogglePlayback} totalDuration={totalDuration} />
      <TransportRightActions onZoomChange={onZoomChange} zoom={zoom} />
    </div>
  );
}

function TransportLeftActions({
  onAddOverlayCallout,
  currentTime,
  editMode,
  isPlaying,
  onAddScreen,
  onAddVideoTrack,
  onEditModeChange,
  onExtractScene,
  onLiftScene,
  onRollBoundary,
  onRippleDeleteScene,
  onSplitScene,
  onSlideScene,
  onSlipScene,
  onTogglePlayback,
  totalDuration,
}: {
  onAddOverlayCallout: () => void;
  currentTime: number;
  editMode: "overwrite" | "insert";
  isPlaying: boolean;
  onAddScreen: () => void;
  onAddVideoTrack: () => void;
  onEditModeChange: (mode: "overwrite" | "insert") => void;
  onExtractScene: () => void;
  onLiftScene: () => void;
  onRollBoundary: (deltaSeconds: number) => void;
  onRippleDeleteScene: () => void;
  onSplitScene: (time: number) => void;
  onSlideScene: (deltaSeconds: number) => void;
  onSlipScene: (deltaSeconds: number) => void;
  onTogglePlayback: () => void;
  totalDuration: number;
}) {
  return (
    <div className="flex items-center gap-[12px]">
      <TransportPlayback currentTime={currentTime} isPlaying={isPlaying} onTogglePlayback={onTogglePlayback} totalDuration={totalDuration} />
      <ModeToggle editMode={editMode} onChange={onEditModeChange} />
      <TransportEditActions currentTime={currentTime} onAddOverlayCallout={onAddOverlayCallout} onAddScreen={onAddScreen} onAddVideoTrack={onAddVideoTrack} onExtractScene={onExtractScene} onLiftScene={onLiftScene} onRollBoundary={onRollBoundary} onRippleDeleteScene={onRippleDeleteScene} onSlideScene={onSlideScene} onSlipScene={onSlipScene} onSplitScene={onSplitScene} />
    </div>
  );
}

function TransportPlayback({
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
    <>
      <TransportButton onClick={onTogglePlayback}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</TransportButton>
      <TransportButton><StepIcon /></TransportButton>
      <TransportButton><StepForwardIcon /></TransportButton>
      <span className="min-w-[194px] text-[14px] text-[#bcbcbc]">{formatTimelineTime(currentTime)}f / {formatTimelineTime(totalDuration)}f</span>
      <span className="text-[14px] text-[#d9d9d9]">1x</span>
      <span className="text-[14px] text-[#d9d9d9]">High res</span>
    </>
  );
}

function TransportEditActions({
  currentTime,
  onAddOverlayCallout,
  onAddScreen,
  onAddVideoTrack,
  onExtractScene,
  onLiftScene,
  onRollBoundary,
  onRippleDeleteScene,
  onSlideScene,
  onSlipScene,
  onSplitScene,
}: {
  currentTime: number;
  onAddOverlayCallout: () => void;
  onAddScreen: () => void;
  onAddVideoTrack: () => void;
  onExtractScene: () => void;
  onLiftScene: () => void;
  onRollBoundary: (deltaSeconds: number) => void;
  onRippleDeleteScene: () => void;
  onSlideScene: (deltaSeconds: number) => void;
  onSlipScene: (deltaSeconds: number) => void;
  onSplitScene: (time: number) => void;
}) {
  return (
    <>
      <TransportButton onClick={() => onSplitScene(currentTime)}><ScissorIcon /></TransportButton>
      <TransportButton onClick={onAddScreen}>+</TransportButton>
      <MiniAction onClick={onAddVideoTrack}>Track+</MiniAction>
      <MiniAction onClick={onAddOverlayCallout}>Callout</MiniAction>
      <MiniAction onClick={onRippleDeleteScene}>Ripple</MiniAction>
      <MiniAction onClick={onLiftScene}>Lift</MiniAction>
      <MiniAction onClick={onExtractScene}>Extract</MiniAction>
      <MiniAction onClick={() => onRollBoundary(-0.5)}>Roll-</MiniAction>
      <MiniAction onClick={() => onRollBoundary(0.5)}>Roll+</MiniAction>
      <MiniAction onClick={() => onSlipScene(-0.5)}>Slip-</MiniAction>
      <MiniAction onClick={() => onSlipScene(0.5)}>Slip+</MiniAction>
      <MiniAction onClick={() => onSlideScene(-0.5)}>Slide-</MiniAction>
      <MiniAction onClick={() => onSlideScene(0.5)}>Slide+</MiniAction>
    </>
  );
}

function ModeToggle({
  editMode,
  onChange,
}: {
  editMode: "overwrite" | "insert";
  onChange: (mode: "overwrite" | "insert") => void;
}) {
  return (
    <div className="flex items-center rounded-[8px] border border-white/8 bg-[#1f1f1f] p-1">
      <button className={`rounded-[6px] px-2 py-1 text-[11px] ${editMode === "overwrite" ? "bg-white/12 text-white" : "text-[#a8a8a8]"}`} onClick={() => onChange("overwrite")} type="button">Overwrite</button>
      <button className={`rounded-[6px] px-2 py-1 text-[11px] ${editMode === "insert" ? "bg-white/12 text-white" : "text-[#a8a8a8]"}`} onClick={() => onChange("insert")} type="button">Insert</button>
    </div>
  );
}

function TransportRightActions({
  onZoomChange,
  zoom,
}: {
  onZoomChange: (value: number) => void;
  zoom: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <ZoomControl onZoomChange={onZoomChange} value={zoom} />
      <div className="flex items-center gap-1 text-[#18a56a]">
        <TransportGhost>⤴</TransportGhost>
        <TransportGhost>⌖</TransportGhost>
        <TransportGhost>⚙</TransportGhost>
        <TransportGhost>▭</TransportGhost>
      </div>
    </div>
  );
}

function MiniAction({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return <button className="rounded-[8px] border border-white/8 px-2 py-1.5 text-[11px] text-[#d1d1d1]" onClick={onClick} type="button">{children}</button>;
}

function ZoomControl({
  onZoomChange,
  value,
}: {
  onZoomChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="flex items-center gap-2 rounded-[8px] border border-white/8 px-3 py-2 text-[12px] text-[#d7d7d7]">
      <span>Zoom</span>
      <input className="accent-white" max={2.2} min={0.8} onChange={(event) => onZoomChange(Number(event.target.value))} step={0.05} type="range" value={value} />
    </label>
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

function formatTimelineTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const frames = Math.round((seconds - wholeSeconds) * 30);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = wholeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
}
