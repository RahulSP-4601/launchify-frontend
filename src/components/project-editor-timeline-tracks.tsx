"use client";

import { useRef } from "react";

import { EditorSceneDraft, ProjectEditorDraft, isInsertedScene, sceneDuration } from "@/components/project-editor-draft";
import { AddMenuButton } from "@/components/project-editor-timeline-controls";
import { GlobalTimelinePlayhead } from "@/components/project-editor-timeline-playhead";
import { clampRatio } from "@/components/project-editor-timeline-track-utils";
import { mapSceneClip } from "@/components/project-editor-sequence-utils";
import { ProjectEditorClip, ProjectEditorTrack } from "@/lib/types";

type TrackStackProps = {
  currentTime: number;
  draft: ProjectEditorDraft;
  onSceneSelect: (scene: EditorSceneDraft) => void;
  onSeek: (time: number) => void;
  onSelectClip: (clipId: string) => void;
  onMoveClip: (deltaSeconds: number) => void;
  onSelectTrack: (trackId: string) => void;
  onToggleTrackLocked: (trackId: string) => void;
  onToggleTrackMuted: (trackId: string) => void;
  onTrimClip: (edge: "start" | "end", nextTime: number) => void;
  onTrimBoundary: (sceneId: string, time: number) => void;
  onChooseImportProject: () => void;
  onAddScreen: () => void;
  onChooseUploadFile: () => void;
  selectedClipId: string;
  selectedSceneId: string;
  selectedTrackId: string;
  totalDuration: number;
  zoom: number;
};

type VideoTrackProps = Omit<TrackStackProps, "draft"> & {
  draft: ProjectEditorDraft;
  track: ProjectEditorTrack;
};

type VideoTrackBodyProps = Omit<VideoTrackProps, "draft"> & {
  scenes: EditorSceneDraft[];
};

export function TrackStack(props: TrackStackProps) {
  return (
    <div className="relative space-y-2">
      <GlobalTimelinePlayhead currentTime={props.currentTime} onSeek={props.onSeek} totalDuration={props.totalDuration} />
      {props.draft.sequence.tracks.map((track) => (
        <SequenceTrackLane key={track.id} {...props} track={track} />
      ))}
    </div>
  );
}

function SequenceTrackLane(props: TrackStackProps & {
  track: ProjectEditorTrack;
}) {
  if (props.track.kind === "video") {
    return <VideoSequenceTrack {...props} />;
  }
  return <AuxSequenceTrack onMoveClip={props.onMoveClip} onSeek={props.onSeek} onSelectClip={props.onSelectClip} onSelectTrack={props.onSelectTrack} onToggleTrackLocked={props.onToggleTrackLocked} onToggleTrackMuted={props.onToggleTrackMuted} onTrimClip={props.onTrimClip} selectedClipId={props.selectedClipId} selectedTrackId={props.selectedTrackId} totalDuration={props.totalDuration} track={props.track} zoom={props.zoom} />;
}

function VideoSequenceTrack(props: VideoTrackProps) {
  const scenes = videoScenesForTrack(props.track, props.draft);
  return (
    <div className="mt-1 overflow-x-auto">
      <VideoTrackBody {...props} scenes={scenes} />
    </div>
  );
}

function VideoTrackBody(props: VideoTrackBodyProps) {
  return (
    <div
      className={`relative rounded-[2px] border ${props.track.id === props.selectedTrackId ? "border-[#74a4ff] shadow-[0_0_0_1px_rgba(116,164,255,0.5)]" : "border-[#0c55a9]"} bg-[#0f61ca]`}
      onPointerDown={handleLanePointerDown(props.onSeek, props.totalDuration)}
      style={{ minWidth: `${Math.round(1320 * props.zoom)}px` }}
    >
      <TrackMarkers scenes={props.scenes} totalDuration={props.totalDuration} />
      <TrackHeader accentClass="bg-[#145db4]" onSelectTrack={props.onSelectTrack} onToggleTrackLocked={props.onToggleTrackLocked} onToggleTrackMuted={props.onToggleTrackMuted} track={props.track} />
      <div className="flex h-[74px]">
        {props.scenes.map((scene) => (
          <TrackSegment key={scene.id} isSelected={scene.id === props.selectedSceneId} onSceneSelect={props.onSceneSelect} onSeek={props.onSeek} onTrimBoundary={props.onTrimBoundary} scene={scene} scenes={props.scenes} totalDuration={props.totalDuration} />
        ))}
        <TimelineInsertTarget onChooseBlankClip={props.onAddScreen} onChooseImportProject={props.onChooseImportProject} onChooseUploadFile={props.onChooseUploadFile} />
      </div>
      <ThumbnailStrip scenes={props.scenes} totalDuration={props.totalDuration} />
      <div className="h-[42px] border-t border-black/30 bg-[#020202]" />
    </div>
  );
}

function isSceneDraft(scene: EditorSceneDraft | undefined): scene is EditorSceneDraft {
  return Boolean(scene);
}

function videoScenesForTrack(track: ProjectEditorTrack, draft: ProjectEditorDraft) {
  const priorScenes = new Map(draft.scenes.map((scene) => [scene.id, scene]));
  return track.clips
    .map((clip, index) => draft.scenes.find((scene) => scene.id === clip.scene_id) ?? mapSceneClip(clip, priorScenes, index))
    .filter(isSceneDraft);
}

function AuxSequenceTrack({
  onMoveClip,
  onSeek,
  onSelectClip,
  onSelectTrack,
  onToggleTrackLocked,
  onToggleTrackMuted,
  onTrimClip,
  selectedClipId,
  selectedTrackId,
  totalDuration,
  track,
  zoom,
}: {
  onMoveClip: (deltaSeconds: number) => void;
  onSeek: (time: number) => void;
  onSelectClip: (clipId: string) => void;
  onSelectTrack: (trackId: string) => void;
  onToggleTrackLocked: (trackId: string) => void;
  onToggleTrackMuted: (trackId: string) => void;
  onTrimClip: (edge: "start" | "end", nextTime: number) => void;
  selectedClipId: string;
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
      <div
        className={`relative rounded-[2px] border ${track.id === selectedTrackId ? "border-white/35" : palette.border} ${palette.body}`}
        onPointerDown={handleAuxLanePointerDown(handleSeekAndSelectTrack(onSeek, onSelectTrack, track.id), totalDuration)}
        style={{ minWidth: `${Math.round(1320 * zoom)}px` }}
      >
        <TrackHeader accentClass={palette.chip} compact onSelectTrack={onSelectTrack} onToggleTrackLocked={onToggleTrackLocked} onToggleTrackMuted={onToggleTrackMuted} track={track} />
        <div className="flex h-[32px]">
          {track.clips.map((clip) => (
            <AuxClipSegment key={clip.id} clip={clip} isSelected={selectedClipId === clip.id} onMoveClip={onMoveClip} onSeek={onSeek} onSelectClip={onSelectClip} onSelectTrack={onSelectTrack} onTrimClip={onTrimClip} totalDuration={totalDuration} track={track} />
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

function TrackSegment({
  isSelected,
  onSceneSelect,
  onSeek,
  onTrimBoundary,
  scene,
  scenes,
  totalDuration,
}: {
  isSelected: boolean;
  onSceneSelect: (scene: EditorSceneDraft) => void;
  onSeek: (time: number) => void;
  onTrimBoundary: (sceneId: string, time: number) => void;
  scene: EditorSceneDraft;
  scenes: EditorSceneDraft[];
  totalDuration: number;
}) {
  const width = `${Math.max((sceneDuration(scene) / Math.max(totalDuration, 1)) * 100, 8)}%`;
  const inserted = isInsertedScene(scene);
  const canTrim = scenes.at(-1)?.id !== scene.id;
  return (
    <button
      className={`relative h-full border-r text-left ${inserted ? "border-[#5f58b9] bg-[linear-gradient(180deg,#3f356f,#2c2850)] hover:bg-[#3d3666]" : "border-[#2a7de8]"} ${isSelected ? "bg-white/[0.1]" : "hover:bg-white/[0.04]"}`}
      onPointerDown={handleSegmentPointerDown(onSceneSelect, onSeek, scene)}
      style={{ minWidth: inserted ? 190 : 170, width }}
      type="button"
    >
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

function handleSegmentPointerDown(
  onSceneSelect: (scene: EditorSceneDraft) => void,
  onSeek: (time: number) => void,
  scene: EditorSceneDraft,
) {
  return (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = clampRatio((event.clientX - bounds.left) / Math.max(bounds.width, 1));
    const time = scene.start + (sceneDuration(scene) * ratio);
    onSceneSelect(scene);
    onSeek(time);
  };
}

function scrubLanePointerDown(
  onSeek: (time: number) => void,
  totalDuration: number,
) {
  return (event: React.PointerEvent<HTMLDivElement>) => {
    const lane = event.currentTarget;
    const seekAtPointer = (clientX: number) => {
      const bounds = lane.getBoundingClientRect();
      const ratio = clampRatio((clientX - bounds.left) / Math.max(bounds.width, 1));
      onSeek(ratio * totalDuration);
    };
    seekAtPointer(event.clientX);
    const pointerId = event.pointerId;
    lane.setPointerCapture(pointerId);
    const handleMove = (moveEvent: PointerEvent) => seekAtPointer(moveEvent.clientX);
    const handleEnd = () => {
      lane.removeEventListener("pointermove", handleMove);
      lane.removeEventListener("pointerup", handleEnd);
      lane.removeEventListener("pointercancel", handleEnd);
      if (lane.hasPointerCapture(pointerId)) {
        lane.releasePointerCapture(pointerId);
      }
    };
    lane.addEventListener("pointermove", handleMove);
    lane.addEventListener("pointerup", handleEnd);
    lane.addEventListener("pointercancel", handleEnd);
  };
}

function handleLanePointerDown(onSeek: (time: number) => void, totalDuration: number) {
  return scrubLanePointerDown(onSeek, totalDuration);
}

function handleAuxLanePointerDown(onSeek: (time: number) => void, totalDuration: number) {
  return scrubLanePointerDown(onSeek, totalDuration);
}

function handleSeekAndSelectTrack(
  onSeek: (time: number) => void,
  onSelectTrack: (trackId: string) => void,
  trackId: string,
) {
  return (time: number) => {
    onSeek(time);
    onSelectTrack(trackId);
  };
}

function TimelineInsertTarget({
  onChooseBlankClip,
  onChooseImportProject,
  onChooseUploadFile,
}: {
  onChooseBlankClip: () => void;
  onChooseImportProject: () => void;
  onChooseUploadFile: () => void;
}) {
  return (
    <div className="grid h-full min-w-[176px] place-items-center border-l border-white/8 bg-[#101010]">
      <div className="grid place-items-center gap-3">
        <span className="text-[28px] font-light text-white/30">+</span>
        <AddMenuButton onChooseBlankClip={onChooseBlankClip} onChooseImportProject={onChooseImportProject} onChooseUploadFile={onChooseUploadFile} />
      </div>
    </div>
  );
}

function AuxClipSegment({
  clip,
  isSelected,
  onMoveClip,
  onSeek,
  onSelectClip,
  onSelectTrack,
  onTrimClip,
  totalDuration,
  track,
}: {
  clip: ProjectEditorClip;
  isSelected: boolean;
  onMoveClip: (deltaSeconds: number) => void;
  onSeek: (time: number) => void;
  onSelectClip: (clipId: string) => void;
  onSelectTrack: (trackId: string) => void;
  onTrimClip: (edge: "start" | "end", nextTime: number) => void;
  totalDuration: number;
  track: ProjectEditorTrack;
}) {
  return (
    <button
      className={`relative border-r border-white/10 px-2 py-1 text-left text-[10px] text-white/85 ${isSelected ? "bg-white/10" : "hover:bg-white/5"}`}
      onPointerDown={handleAuxClipPointerDown(clip, onSeek, onSelectClip, onSelectTrack, onMoveClip, totalDuration)}
      style={{ width: `${Math.max(((clip.timeline_end - clip.timeline_start) / Math.max(totalDuration, 1)) * 100, 4)}%`, minWidth: 90 }}
      type="button"
    >
      <span className="line-clamp-1">{clip.title || clip.text || track.kind}</span>
      <AuxTrimHandle clip={clip} edge="start" onTrimClip={onTrimClip} totalDuration={totalDuration} />
      <AuxTrimHandle clip={clip} edge="end" onTrimClip={onTrimClip} totalDuration={totalDuration} />
    </button>
  );
}

function AuxTrimHandle({
  clip,
  edge,
  onTrimClip,
  totalDuration,
}: {
  clip: ProjectEditorClip;
  edge: "start" | "end";
  onTrimClip: (edge: "start" | "end", nextTime: number) => void;
  totalDuration: number;
}) {
  const anchorXRef = useRef(0);
  const anchorTimeRef = useRef(edge === "start" ? clip.timeline_start : clip.timeline_end);
  const onPointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    anchorXRef.current = event.clientX;
    anchorTimeRef.current = edge === "start" ? clip.timeline_start : clip.timeline_end;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!(event.buttons & 1)) return;
    const nextTime = anchorTimeRef.current + ((event.clientX - anchorXRef.current) / 320) * totalDuration;
    onTrimClip(edge, nextTime);
  };
  return <span className={`absolute inset-y-0 z-20 w-2 cursor-col-resize ${edge === "start" ? "left-0" : "right-0"}`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} />;
}

function handleAuxClipPointerDown(
  clip: ProjectEditorClip,
  onSeek: (time: number) => void,
  onSelectClip: (clipId: string) => void,
  onSelectTrack: (trackId: string) => void,
  onMoveClip: (deltaSeconds: number) => void,
  totalDuration: number,
) {
  return (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    let previousX = event.clientX;
    onSelectClip(clip.id);
    onSelectTrack(clip.track_id);
    onSeek(clip.timeline_start);
    event.currentTarget.setPointerCapture(event.pointerId);
    const handleMove = (moveEvent: PointerEvent) => {
      const deltaSeconds = ((moveEvent.clientX - previousX) / 320) * totalDuration;
      previousX = moveEvent.clientX;
      onMoveClip(deltaSeconds);
    };
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
