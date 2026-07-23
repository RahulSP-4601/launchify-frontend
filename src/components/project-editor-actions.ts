"use client";

import { deleteSelectedClip, moveSelectedClip, patchSelectedClip, trimSelectedClipEdge } from "@/components/project-editor-clip-ops";
import type { EditorSceneDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
import { reorderScenes, shiftSceneTiming, splitSceneAtTime, trimSceneBoundary, updateSceneTiming } from "@/components/project-editor-draft";
import { insertMediaAssetIntoDraft } from "@/components/project-editor-media-ops";
import type { usePersistedProjectEditorDraft } from "@/components/project-editor-persistence";
import { applySequenceOperation } from "@/components/project-editor-sequence-ops";
import { addCommentDraft } from "@/components/project-editor-tool-state";
import type { ProjectEditorMediaAsset, ProjectEditorTrack } from "@/lib/types";

type DraftSetter = ReturnType<typeof usePersistedProjectEditorDraft>["setDraft"];

export function buildSequenceActions(setDraft: DraftSetter) {
  return {
    addOverlayCallout: () => setDraft((current) => applySequenceOperation(current, { clipId: currentSelectedClipId(current), type: "add_overlay_callout" })),
    addScreenAfterSelected: () => setDraft((current) => applySequenceOperation(current, current.editMode === "insert" ? { afterClipId: currentSelectedClipId(current), durationSeconds: 5, trackId: activeVideoTrackId(current), type: "insert_inserted" } : { afterClipId: currentSelectedClipId(current), durationSeconds: 5, trackId: activeVideoTrackId(current), type: "overwrite_inserted" })),
    insertMediaAsset: (asset: ProjectEditorMediaAsset) => setDraft((current) => insertMediaAssetIntoDraft(current, asset)),
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
    addComment: (body: string, time: number) => setDraft((current) => addCommentDraft(current, { body, scene_id: current.selectedSceneId || null, time })),
    deleteSelectedClip: () => setDraft((current) => deleteSelectedClip(current)),
    moveScene: (sceneId: string, direction: "backward" | "forward") => setDraft((current) => ({ ...current, scenes: reorderScenes(current.scenes, sceneId, direction) })),
    moveSelectedClip: (deltaSeconds: number) => setDraft((current) => moveSelectedClip(current, deltaSeconds)),
    nudgeScene: (sceneId: string, delta: number) => setDraft((current) => shiftSceneTiming(current, sceneId, delta, totalDuration)),
    setAspectRatio: (aspectRatio: ProjectEditorDraft["aspectRatio"]) => setDraft((current) => ({ ...current, aspectRatio })),
    setCaptionPreset: (preset: ProjectEditorDraft["toolState"]["active_caption_preset"]) => setDraft((current) => ({ ...current, toolState: { ...current.toolState, active_caption_preset: preset } })),
    setEditMode: (editMode: ProjectEditorDraft["editMode"]) => setDraft((current) => ({ ...current, editMode })),
    setMediaIntent: (intent: ProjectEditorDraft["toolState"]["pending_media_intent"]) => setDraft((current) => ({ ...current, toolState: { ...current.toolState, pending_media_intent: intent } })),
    setMediaTab: (tab: ProjectEditorDraft["toolState"]["media_tab"]) => setDraft((current) => ({ ...current, toolState: { ...current.toolState, media_tab: tab } })),
    setSelectedEffect: (effect: ProjectEditorDraft["toolState"]["active_effect"]) => setDraft((current) => ({ ...current, toolState: { ...current.toolState, active_effect: current.toolState.active_effect === effect ? null : effect } })),
    setSelectedClipId: (selectedClipId: string) => setDraft((current) => ({ ...current, selectedClipId })),
    updateSelectedClip: (patch: Partial<ProjectEditorTrack["clips"][number]>) => setDraft((current) => patchSelectedClip(current, patch)),
    setSelectedSceneId: (selectedSceneId: string) => setDraft((current) => ({ ...current, selectedSceneId })),
    setSelectedShape: (shape: ProjectEditorDraft["toolState"]["active_shape"]) => setDraft((current) => ({ ...current, toolState: { ...current.toolState, active_shape: current.toolState.active_shape === shape ? null : shape } })),
    setSelectedTrackId: (selectedTrackId: string) => setDraft((current) => ({ ...current, selectedTrackId })),
    setShowCaptions: (showCaptions: boolean) => setDraft((current) => ({ ...current, showCaptions })),
    splitSelectedScene: (currentTime: number) => setDraft((current) => splitSceneAtTime(current, current.selectedSceneId || current.scenes[0]?.id || "scene-1", currentTime)),
    trimSelectedClipEdge: (edge: "start" | "end", nextTime: number) => setDraft((current) => trimSelectedClipEdge(current, edge, nextTime)),
    trimSceneBoundary: (sceneId: string, value: number) => setDraft((current) => trimSceneBoundary(current, sceneId, value, totalDuration)),
    updateCaption: (captionId: string, text: string) => setDraft((current) => ({ ...current, captions: current.captions.map((caption) => caption.id === captionId ? { ...caption, text } : caption) })),
    updateScene: (sceneId: string, patch: Partial<EditorSceneDraft>) => setDraft((current) => ({ ...current, scenes: current.scenes.map((scene) => scene.id === sceneId ? { ...scene, ...patch } : scene) })),
    updateSceneTiming: (sceneId: string, field: "start" | "end", value: number) => setDraft((current) => updateSceneTiming(current, sceneId, field, value, totalDuration)),
  };
}

function currentSelectedClipId(draft: ProjectEditorDraft) {
  if (draft.selectedClipId) {
    return draft.selectedClipId;
  }
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
