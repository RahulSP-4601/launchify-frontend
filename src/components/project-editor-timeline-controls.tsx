"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { PauseIcon, PlayIcon, ScissorIcon, StepForwardIcon, StepIcon } from "@/components/project-editor-icons";

export function TimelineTransportBar({
  currentTime,
  isPlaying,
  onChooseImportProject,
  onAddScreen,
  onSplitScene,
  onTogglePlayback,
  onChooseUploadFile,
  totalDuration,
  zoom,
  onZoomChange,
}: {
  editMode: "overwrite" | "insert";
  onAddOverlayCallout: () => void;
  currentTime: number;
  isPlaying: boolean;
  onEditModeChange: (mode: "overwrite" | "insert") => void;
  onAddScreen: () => void;
  onAddVideoTrack: () => void;
  onChooseImportProject: () => void;
  onExtractScene: () => void;
  onLiftScene: () => void;
  onRollBoundary: (deltaSeconds: number) => void;
  onRippleDeleteScene: () => void;
  onSplitScene: (time: number) => void;
  onSlideScene: (deltaSeconds: number) => void;
  onTogglePlayback: () => void;
  onChooseUploadFile: () => void;
  totalDuration: number;
  zoom: number;
  onZoomChange: (value: number) => void;
  onSlipScene: (deltaSeconds: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3">
      <TransportLeftActions currentTime={currentTime} isPlaying={isPlaying} onAddScreen={onAddScreen} onChooseImportProject={onChooseImportProject} onChooseUploadFile={onChooseUploadFile} onSplitScene={onSplitScene} onTogglePlayback={onTogglePlayback} totalDuration={totalDuration} />
      <TransportRightActions onZoomChange={onZoomChange} zoom={zoom} />
    </div>
  );
}

function TransportLeftActions({
  currentTime,
  isPlaying,
  onAddScreen,
  onChooseImportProject,
  onChooseUploadFile,
  onSplitScene,
  onTogglePlayback,
  totalDuration,
}: {
  currentTime: number;
  isPlaying: boolean;
  onAddScreen: () => void;
  onChooseImportProject: () => void;
  onChooseUploadFile: () => void;
  onSplitScene: (time: number) => void;
  onTogglePlayback: () => void;
  totalDuration: number;
}) {
  return (
    <div className="flex items-center gap-[12px]">
      <TransportPlayback currentTime={currentTime} isPlaying={isPlaying} onTogglePlayback={onTogglePlayback} totalDuration={totalDuration} />
      <TransportEditActions currentTime={currentTime} onAddScreen={onAddScreen} onChooseImportProject={onChooseImportProject} onChooseUploadFile={onChooseUploadFile} onSplitScene={onSplitScene} />
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
  onAddScreen,
  onChooseImportProject,
  onChooseUploadFile,
  onSplitScene,
}: {
  currentTime: number;
  onAddScreen: () => void;
  onChooseImportProject: () => void;
  onChooseUploadFile: () => void;
  onSplitScene: (time: number) => void;
}) {
  return (
    <>
      <TransportButton onClick={() => onSplitScene(currentTime)}><ScissorIcon /></TransportButton>
      <AddMenuButton onChooseBlankClip={onAddScreen} onChooseImportProject={onChooseImportProject} onChooseUploadFile={onChooseUploadFile} />
    </>
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

export function AddMenuButton({
  onChooseBlankClip,
  onChooseImportProject,
  onChooseUploadFile,
}: {
  onChooseBlankClip: () => void;
  onChooseImportProject: () => void;
  onChooseUploadFile: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <TransportButton onClick={() => setOpen((current) => !current)}>+</TransportButton>
      {open ? <AddMenu onChooseBlankClip={onChooseBlankClip} onChooseImportProject={onChooseImportProject} onChooseUploadFile={onChooseUploadFile} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function AddMenu({
  onChooseBlankClip,
  onChooseImportProject,
  onChooseUploadFile,
  onClose,
}: {
  onChooseBlankClip: () => void;
  onChooseImportProject: () => void;
  onChooseUploadFile: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute left-1/2 top-[calc(100%+12px)] z-30 w-[182px] -translate-x-1/2 rounded-[10px] border border-white/8 bg-[#211f1f] p-2 shadow-[0_24px_48px_rgba(0,0,0,0.45)]">
      <AddMenuItem label="Blank clip" onClick={() => selectAddMenuItem(onChooseBlankClip, onClose)} />
      <AddMenuItem label="Upload file" onClick={() => selectAddMenuItem(onChooseUploadFile, onClose)} />
      <AddMenuItem label="Import project" onClick={() => selectAddMenuItem(onChooseImportProject, onClose)} />
    </div>
  );
}

function AddMenuItem({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="flex w-full items-center rounded-[8px] px-3 py-2.5 text-left text-[14px] text-[#e2e2e2] transition hover:bg-white/6" onClick={onClick} type="button">
      {label}
    </button>
  );
}

function selectAddMenuItem(action: () => void, onClose: () => void) {
  action();
  onClose();
}

function formatTimelineTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const frames = Math.round((seconds - wholeSeconds) * 30);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = wholeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
}
