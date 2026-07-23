"use client";

import type { EditorSceneDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
import { reorderScenes, shiftSceneTiming, splitSceneAtTime, trimSceneBoundary, updateSceneTiming } from "@/components/project-editor-draft";
import type { usePersistedProjectEditorDraft } from "@/components/project-editor-persistence";
import { applySequenceOperation } from "@/components/project-editor-sequence-ops";
import type { ProjectEditorTrack } from "@/lib/types";

type DraftSetter = ReturnType<typeof usePersistedProjectEditorDraft>["setDraft"];

export function buildSequenceActions(setDraft: DraftSetter) {
  return {
    addOverlayCallout: () => setDraft((current) => applySequenceOperation(current, { clipId: currentSelectedClipId(current), type: "add_overlay_callout" })),
    addScreenAfterSelected: () => setDraft((current) => applySequenceOperation(current, current.editMode === "insert" ? { afterClipId: currentSelectedClipId(current), durationSeconds: 5, trackId: activeVideoTrackId(current), type: "insert_inserted" } : { afterClipId: currentSelectedClipId(current), durationSeconds: 5, trackId: activeVideoTrackId(current), type: "overwrite_inserted" })),
    addVideoTrack: () => setDraft((current) => appendVideoTrack(current)),
    extractSelectedScene: () => setDraft((current) => applySequenceOperation(current, { clipId: currentSelectedClipId(current), trackId: activeVideoTrackId(current), type: "extract" })),
    liftSelectedScene: () => setDraft((current) => applySequenceOperation(current, { clipId: currentSelectedClipId(current), trackId: activeVideoTrackId(current), type: "lift" })),
    rollSelectedBoundary: (deltaSeconds: number) => setDraft((current) => applySequenceOperation(current, { clipId: currentSelectedClipId(current), deltaSeconds, trackId: activeVideoTrackId(current), type: "roll_boundary" })),
    rippleDeleteSelectedScene: () => setDraft((current) => applySequenceOperation(current, { clipId: currentSelectedClipId(current), trackId: activeVideoTrackId(current), type: "ripple_delete" })),
    slideSelectedScene: (deltaSeconds: number) => setDraft((current) => applySequenceOperation(current, { clipId: currentSelectedClipId(current), deltaSeconds, trackId: activeVideoTrackId(current), type: "slide" })),
    slipSelectedScene: (deltaSeconds: number) => setDraft((current) => applySequenceOperation(current, { clipId: currentSelectedClipId(current), deltaSeconds, trackId: activeVideoTrackId(current), type: "slip" })),
    toggleTrackLocked: (trackId: string) => setDraft((current) => ({
      ...current,
      sequence: current.sequence ? { ...current.sequence, tracks: current.sequence.tracks.map((track) => track.id === trackId ? { ...track, locked: !track.locked } : track) } : current.sequence,
    })),
    toggleTrackMuted: (trackId: string) => setDraft((current) => ({
      ...current,
      sequence: current.sequence ? { ...current.sequence, tracks: current.sequence.tracks.map((track) => track.id === trackId ? { ...track, muted: !track.muted } : track) } : current.sequence,
    })),
  };
}

export function buildSceneActions(setDraft: DraftSetter, totalDuration: number) {
  return {
    moveScene: (sceneId: string, direction: "backward" | "forward") => setDraft((current) => ({ ...current, scenes: reorderScenes(current.scenes, sceneId, direction) })),
    nudgeScene: (sceneId: string, delta: number) => setDraft((current) => shiftSceneTiming(current, sceneId, delta, totalDuration)),
    setAspectRatio: (aspectRatio: ProjectEditorDraft["aspectRatio"]) => setDraft((current) => ({ ...current, aspectRatio })),
    setEditMode: (editMode: ProjectEditorDraft["editMode"]) => setDraft((current) => ({ ...current, editMode })),
    setSelectedSceneId: (selectedSceneId: string) => setDraft((current) => ({ ...current, selectedSceneId })),
    setSelectedTrackId: (selectedTrackId: string) => setDraft((current) => ({ ...current, selectedTrackId })),
    setShowCaptions: (showCaptions: boolean) => setDraft((current) => ({ ...current, showCaptions })),
    splitSelectedScene: (currentTime: number) => setDraft((current) => splitSceneAtTime(current, current.selectedSceneId || current.scenes[0]?.id || "scene-1", currentTime)),
    trimSceneBoundary: (sceneId: string, value: number) => setDraft((current) => trimSceneBoundary(current, sceneId, value, totalDuration)),
    updateCaption: (captionId: string, text: string) => setDraft((current) => ({ ...current, captions: current.captions.map((caption) => caption.id === captionId ? { ...caption, text } : caption) })),
    updateScene: (sceneId: string, patch: Partial<EditorSceneDraft>) => setDraft((current) => ({ ...current, scenes: current.scenes.map((scene) => scene.id === sceneId ? { ...scene, ...patch } : scene) })),
    updateSceneTiming: (sceneId: string, field: "start" | "end", value: number) => setDraft((current) => updateSceneTiming(current, sceneId, field, value, totalDuration)),
  };
}

function currentSelectedClipId(draft: ProjectEditorDraft) {
  return `clip-${draft.selectedSceneId || draft.scenes[0]?.id || "scene-1"}`;
}

function activeVideoTrackId(draft: ProjectEditorDraft) {
  const selectedTrack = draft.sequence.tracks.find((track) => track.id === draft.selectedTrackId && track.kind === "video");
  return selectedTrack?.id || draft.sequence.tracks.find((track) => track.kind === "video")?.id || "track-video-1";
}

function appendVideoTrack(draft: ProjectEditorDraft) {
  const videoTrackCount = draft.sequence.tracks.filter((track) => track.kind === "video").length;
  const nextTrackId = `track-video-${videoTrackCount + 1}`;
  const nextTrack: ProjectEditorTrack = { clips: [], id: nextTrackId, kind: "video", locked: false, muted: false, name: `Video ${videoTrackCount + 1}` };
  return {
    ...draft,
    selectedTrackId: nextTrackId,
    sequence: {
      ...draft.sequence,
      tracks: [...draft.sequence.tracks, nextTrack],
    },
  };
}
