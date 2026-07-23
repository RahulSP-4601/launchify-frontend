"use client";

import { useRef } from "react";

import { EditorSceneDraft, ProjectEditorDraft, isInsertedScene, sceneDuration } from "@/components/project-editor-draft";
import { ProjectEditorTrack } from "@/lib/types";

export function TrackStack({
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
  return (
    <div className="space-y-2">
      {draft.sequence.tracks.map((track) => (
        <SequenceTrackLane
          key={track.id}
          currentTime={currentTime}
          draft={draft}
          onSceneSelect={onSceneSelect}
          onSeek={onSeek}
          onSelectTrack={onSelectTrack}
          onToggleTrackLocked={onToggleTrackLocked}
          onToggleTrackMuted={onToggleTrackMuted}
          onTrimBoundary={onTrimBoundary}
          selectedSceneId={selectedSceneId}
          selectedTrackId={selectedTrackId}
          totalDuration={totalDuration}
          track={track}
          zoom={zoom}
        />
      ))}
    </div>
  );
}

function SequenceTrackLane({
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
  track,
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
  track: ProjectEditorTrack;
  zoom: number;
}) {
  if (track.kind === "video") {
    return <VideoSequenceTrack currentTime={currentTime} draft={draft} onSceneSelect={onSceneSelect} onSeek={onSeek} onSelectTrack={onSelectTrack} onToggleTrackLocked={onToggleTrackLocked} onToggleTrackMuted={onToggleTrackMuted} onTrimBoundary={onTrimBoundary} selectedSceneId={selectedSceneId} selectedTrackId={selectedTrackId} totalDuration={totalDuration} track={track} zoom={zoom} />;
  }
  return <AuxSequenceTrack onSelectTrack={onSelectTrack} onToggleTrackLocked={onToggleTrackLocked} onToggleTrackMuted={onToggleTrackMuted} selectedTrackId={selectedTrackId} totalDuration={totalDuration} track={track} zoom={zoom} />;
}

function VideoSequenceTrack({
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
  track,
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
  track: ProjectEditorTrack;
  zoom: number;
}) {
  const scenes = track.clips
    .map((clip) => draft.scenes.find((scene) => scene.id === clip.scene_id))
    .filter(isSceneDraft);
  return (
    <div className="mt-1 overflow-x-auto">
      <div className={`relative rounded-[2px] border ${track.id === selectedTrackId ? "border-[#74a4ff] shadow-[0_0_0_1px_rgba(116,164,255,0.5)]" : "border-[#0c55a9]"} bg-[#0f61ca]`} style={{ minWidth: `${Math.round(1320 * zoom)}px` }}>
        <Playhead currentTime={currentTime} totalDuration={totalDuration} />
        <TrackMarkers scenes={scenes} totalDuration={totalDuration} />
        <TrackHeader accentClass="bg-[#145db4]" onSelectTrack={onSelectTrack} onToggleTrackLocked={onToggleTrackLocked} onToggleTrackMuted={onToggleTrackMuted} track={track} />
        <div className="flex h-[74px]">
          {scenes.map((scene) => (
            <TrackSegment key={scene.id} isSelected={scene.id === selectedSceneId} onClick={() => handleSceneClick(onSceneSelect, onSeek, scene)} onTrimBoundary={onTrimBoundary} scene={scene} scenes={scenes} totalDuration={totalDuration} />
          ))}
        </div>
        <ThumbnailStrip scenes={scenes} totalDuration={totalDuration} />
        <div className="h-[42px] border-t border-black/30 bg-[#020202]" />
      </div>
    </div>
  );
}

function isSceneDraft(scene: EditorSceneDraft | undefined): scene is EditorSceneDraft {
  return Boolean(scene);
}

function AuxSequenceTrack({
  onSelectTrack,
  onToggleTrackLocked,
  onToggleTrackMuted,
  selectedTrackId,
  totalDuration,
  track,
  zoom,
}: {
  onSelectTrack: (trackId: string) => void;
  onToggleTrackLocked: (trackId: string) => void;
  onToggleTrackMuted: (trackId: string) => void;
  selectedTrackId: string;
  totalDuration: number;
  track: ProjectEditorTrack;
  zoom: number;
}) {
  const palette = track.kind === "caption"
    ? { body: "bg-[#3a3350]", border: "border-[#4b4167]", chip: "bg-[#574b77]" }
    : { body: "bg-[#25303a]", border: "border-[#375066]", chip: "bg-[#2e556d]" };
  return (
    <div className="overflow-x-auto">
      <div className={`relative rounded-[2px] border ${track.id === selectedTrackId ? "border-white/35" : palette.border} ${palette.body}`} style={{ minWidth: `${Math.round(1320 * zoom)}px` }}>
        <TrackHeader accentClass={palette.chip} compact onSelectTrack={onSelectTrack} onToggleTrackLocked={onToggleTrackLocked} onToggleTrackMuted={onToggleTrackMuted} track={track} />
        <div className="flex h-[32px]">
          {track.clips.map((clip) => (
            <div key={clip.id} className="border-r border-white/10 px-2 py-1 text-[10px] text-white/85" style={{ width: `${Math.max(((clip.timeline_end - clip.timeline_start) / Math.max(totalDuration, 1)) * 100, 4)}%`, minWidth: 90 }}>
              <span className="line-clamp-1">{clip.title || clip.text || track.kind}</span>
            </div>
          ))}
        </div>
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

function TrackMarkers({ scenes, totalDuration }: { scenes: EditorSceneDraft[]; totalDuration: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[-6px] h-2">
      {scenes.map((scene) => (
        <span key={`${scene.id}-marker`} className="absolute h-[2px] w-2 rounded-full bg-[#ef8a3a]" style={{ left: `${(scene.start / Math.max(totalDuration, 1)) * 100}%` }} />
      ))}
    </div>
  );
}

function Playhead({ currentTime, totalDuration }: { currentTime: number; totalDuration: number }) {
  return <div className="absolute inset-y-0 z-10 w-px bg-white" style={{ left: `${Math.min((currentTime / Math.max(totalDuration, 1)) * 100, 100)}%` }} />;
}

function TrackSegment({
  isSelected,
  onClick,
  onTrimBoundary,
  scene,
  scenes,
  totalDuration,
}: {
  isSelected: boolean;
  onClick: () => void;
  onTrimBoundary: (sceneId: string, time: number) => void;
  scene: EditorSceneDraft;
  scenes: EditorSceneDraft[];
  totalDuration: number;
}) {
  const width = `${Math.max((sceneDuration(scene) / Math.max(totalDuration, 1)) * 100, 8)}%`;
  const inserted = isInsertedScene(scene);
  const canTrim = scenes.at(-1)?.id !== scene.id;
  return (
    <button className={`relative h-full border-r text-left ${inserted ? "border-[#5f58b9] bg-[linear-gradient(180deg,#3f356f,#2c2850)] hover:bg-[#3d3666]" : "border-[#2a7de8]"} ${isSelected ? "bg-white/[0.1]" : "hover:bg-white/[0.04]"}`} onClick={onClick} style={{ minWidth: inserted ? 190 : 170, width }} type="button">
      <div className="absolute inset-x-4 bottom-6 text-white">
        <p className="truncate text-[10px] uppercase tracking-[0.32em] text-white/65">{inserted ? "Inserted" : `Scene ${scene.sceneNumber}`}</p>
        <p className="mt-2 truncate text-[11px] font-semibold tracking-[0.01em]">{scene.title}</p>
      </div>
      {canTrim ? <TrimHandle onTrimBoundary={onTrimBoundary} scene={scene} totalDuration={totalDuration} /> : null}
      {inserted ? <span className="absolute inset-0 grid place-items-center text-[24px] text-white/25">+</span> : null}
    </button>
  );
}

function TrimHandle({
  onTrimBoundary,
  scene,
  totalDuration,
}: {
  onTrimBoundary: (sceneId: string, time: number) => void;
  scene: EditorSceneDraft;
  totalDuration: number;
}) {
  const startXRef = useRef(0);
  const startTimeRef = useRef(scene.end);
  const onPointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    startXRef.current = event.clientX;
    startTimeRef.current = scene.end;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!(event.buttons & 1)) return;
    onTrimBoundary(scene.id, startTimeRef.current + ((event.clientX - startXRef.current) / 320) * totalDuration);
  };
  return <span className="absolute inset-y-0 right-0 z-20 w-3 cursor-col-resize bg-white/10 transition hover:bg-white/25" onPointerDown={onPointerDown} onPointerMove={onPointerMove} />;
}

function handleSceneClick(onSceneSelect: (scene: EditorSceneDraft) => void, onSeek: (time: number) => void, scene: EditorSceneDraft) {
  onSceneSelect(scene);
  onSeek(scene.start);
}

function TrackControls({
  onToggleTrackLocked,
  onToggleTrackMuted,
  track,
}: {
  onToggleTrackLocked: (trackId: string) => void;
  onToggleTrackMuted: (trackId: string) => void;
  track: ProjectEditorTrack;
}) {
  return (
    <div className="flex items-center gap-1">
      <button className={`rounded-[4px] border px-1.5 py-[1px] text-[10px] ${track.muted ? "border-[#f08cd7] text-[#f6b0e5]" : "border-white/12 text-white/55"}`} onClick={() => onToggleTrackMuted(track.id)} type="button">
        M
      </button>
      <button className={`rounded-[4px] border px-1.5 py-[1px] text-[10px] ${track.locked ? "border-[#7da7ff] text-[#a7c0ff]" : "border-white/12 text-white/55"}`} onClick={() => onToggleTrackLocked(track.id)} type="button">
        L
      </button>
    </div>
  );
}

function TrackHeader({
  accentClass,
  compact,
  onSelectTrack,
  onToggleTrackLocked,
  onToggleTrackMuted,
  track,
}: {
  accentClass: string;
  compact?: boolean;
  onSelectTrack: (trackId: string) => void;
  onToggleTrackLocked: (trackId: string) => void;
  onToggleTrackMuted: (trackId: string) => void;
  track: ProjectEditorTrack;
}) {
  return (
    <div className={`flex items-center justify-between border-b border-white/10 px-3 ${compact ? "h-[24px]" : "h-[30px]"}`}>
      <button className={`rounded-[4px] border border-white/20 px-2 font-medium text-white ${compact ? "py-[2px] text-[12px]" : "bg-[#145db4] py-[3px] text-[13px]"} ${accentClass}`} onClick={() => onSelectTrack(track.id)} type="button">{track.name}</button>
      <TrackControls onToggleTrackLocked={onToggleTrackLocked} onToggleTrackMuted={onToggleTrackMuted} track={track} />
    </div>
  );
}

function thumbnailCount(scene: EditorSceneDraft, totalDuration: number) {
  const ratio = sceneDuration(scene) / Math.max(totalDuration, 1);
  return Math.max(8, Math.min(20, Math.round(ratio * 42)));
}
