"use client";

import { clampRatio } from "@/components/project-editor-timeline-track-utils";

export function GlobalTimelinePlayhead({
  currentTime,
  onSeek,
  totalDuration,
}: {
  currentTime: number;
  onSeek: (time: number) => void;
  totalDuration: number;
}) {
  const ratio = clampRatio(currentTime / Math.max(totalDuration, 1));
  return (
    <div className="pointer-events-none absolute inset-y-0 z-20 w-0" style={{ left: `${ratio * 100}%` }}>
      <DraggablePlayheadHandle currentTime={currentTime} onSeek={onSeek} totalDuration={totalDuration} />
      <div className="absolute inset-y-0 left-0 w-px bg-white/95 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]" />
    </div>
  );
}

function DraggablePlayheadHandle({
  currentTime,
  onSeek,
  totalDuration,
}: {
  currentTime: number;
  onSeek: (time: number) => void;
  totalDuration: number;
}) {
  return (
    <button
      className="pointer-events-auto absolute left-0 top-[-8px] -translate-x-1/2 rounded-[4px] bg-white px-2 py-1 text-[12px] text-black shadow-[0_8px_20px_rgba(0,0,0,0.28)]"
      onPointerDown={handlePlayheadPointerDown(onSeek, totalDuration)}
      type="button"
    >
      {`${Math.round(currentTime)}s`}
    </button>
  );
}

function handlePlayheadPointerDown(
  onSeek: (time: number) => void,
  totalDuration: number,
) {
  return (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const root = event.currentTarget.parentElement?.parentElement;
    if (!root) return;
    scrubFromRoot(root, event.clientX, onSeek, totalDuration);
    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);
    const handleMove = (moveEvent: PointerEvent) => scrubFromRoot(root, moveEvent.clientX, onSeek, totalDuration);
    const handleEnd = () => {
      event.currentTarget.removeEventListener("pointermove", handleMove);
      event.currentTarget.removeEventListener("pointerup", handleEnd);
      event.currentTarget.removeEventListener("pointercancel", handleEnd);
    };
    event.currentTarget.addEventListener("pointermove", handleMove);
    event.currentTarget.addEventListener("pointerup", handleEnd);
    event.currentTarget.addEventListener("pointercancel", handleEnd);
  };
}

function scrubFromRoot(
  root: Element,
  clientX: number,
  onSeek: (time: number) => void,
  totalDuration: number,
) {
  const bounds = root.getBoundingClientRect();
  const ratio = clampRatio((clientX - bounds.left) / Math.max(bounds.width, 1));
  onSeek(ratio * totalDuration);
}
