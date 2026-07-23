"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
  EditorAspectRatio,
  EditorSceneDraft,
  ProjectEditorDraft,
  reorderScenes,
  shiftSceneTiming,
  updateSceneTiming,
} from "@/components/project-editor-draft";
import {
  shouldPreferLocalDraft,
  usePersistedProjectEditorDraft,
  useProjectEditorBootstrap,
} from "@/components/project-editor-persistence";
import { editorDraftToApiState } from "@/components/project-editor-persistence";
import { EditorInspector, EditorTopBar } from "@/components/project-editor-panels";
import { EditorLeftPanel, EditorRail } from "@/components/project-editor-left-panel";
import { useProjectEditorPreview } from "@/components/project-editor-preview";
import {
  EditorPreviewStage,
  EditorTimeline,
  ProjectEditorPreviewState,
} from "@/components/project-editor-stage";
import { regenerateProjectEditorScene } from "@/lib/api";
import { ProjectDetail, ProjectEditorState, ProjectEditorStateRecord, TranscriptResponse } from "@/lib/types";

type EditorTab = "script" | "captions" | "scenes";

export function ProjectEditorShell({
  project,
  transcript,
}: {
  project: ProjectDetail;
  transcript: TranscriptResponse["transcript"];
}) {
  const bootstrap = useProjectEditorBootstrap(project, transcript);
  return (
    <ProjectEditorWorkspace
      bootstrapRecord={bootstrap.record}
      initialDraft={bootstrap.draft}
      key={project.id}
      localDraftSavedAt={bootstrap.localDraftSavedAt}
      localOverrideActive={bootstrap.localOverrideActive}
      project={project}
    />
  );
}

function ProjectEditorWorkspace({
  bootstrapRecord,
  initialDraft,
  localDraftSavedAt,
  localOverrideActive,
  project,
}: {
  bootstrapRecord: ProjectEditorStateRecord | null | undefined;
  initialDraft: ProjectEditorDraft;
  localDraftSavedAt: string;
  localOverrideActive: boolean;
  project: ProjectDetail;
}) {
  const [activeTab, setActiveTab] = useState<EditorTab>("script");
  const editor = useProjectEditorDraft(project, initialDraft, localOverrideActive);
  const preview = useProjectEditorPreview(project, editor.draft);
  const regenerateScene = useRegenerateScene(editor.draft, project.id, editor.hydrateSavedDraft);
  useBootstrapHydration(bootstrapRecord, editor.hydrateSavedDraft, initialDraft, localDraftSavedAt);

  return (
    <ProjectEditorLayout
      activeTab={activeTab}
      editor={editor}
      onRegenerateScene={regenerateScene.mutate}
      preview={preview}
      project={project}
      regeneratePending={regenerateScene.isPending}
      selectedScene={selectedSceneForLayout(editor.draft, preview)}
      setActiveTab={setActiveTab}
    />
  );
}

function ProjectEditorLayout({
  activeTab,
  editor,
  onRegenerateScene,
  preview,
  project,
  regeneratePending,
  selectedScene,
  setActiveTab,
}: {
  activeTab: EditorTab;
  editor: ReturnType<typeof useProjectEditorDraft>;
  onRegenerateScene: (sceneId: string) => void;
  preview: ProjectEditorPreviewState;
  project: ProjectDetail;
  regeneratePending: boolean;
  selectedScene: EditorSceneDraft | null;
  setActiveTab: (tab: EditorTab) => void;
}) {
  return (
    <div className="h-screen overflow-hidden bg-[#0b0b0b] px-[20px] pb-[14px] pt-7 text-white">
      <div className="mx-auto grid h-full max-w-[2048px] grid-rows-[52px_18px_minmax(0,1fr)_14px_246px]">
        <EditorHeader editor={editor} project={project} />
        <div />
        <ProjectEditorGrid
          activeTab={activeTab}
          editor={editor}
          onRegenerateScene={onRegenerateScene}
          preview={preview}
          regeneratePending={regeneratePending}
          selectedScene={selectedScene}
          setActiveTab={setActiveTab}
        />
        <div />
        <EditorTimelineSection editor={editor} preview={preview} />
      </div>
    </div>
  );
}

function EditorHeader({
  editor,
  project,
}: {
  editor: ReturnType<typeof useProjectEditorDraft>;
  project: ProjectDetail;
}) {
  return (
    <EditorTopBar
      canRedo={editor.canRedo}
      canUndo={editor.canUndo}
      onRedo={editor.redo}
      onUndo={editor.undo}
      project={project}
      saveLabel={editor.saveLabel}
    />
  );
}

function EditorTimelineSection({
  editor,
  preview,
}: {
  editor: ReturnType<typeof useProjectEditorDraft>;
  preview: ProjectEditorPreviewState;
}) {
  return (
    <EditorTimeline
      currentTime={preview.currentTime}
      draft={editor.draft}
      isPlaying={preview.isPlaying}
      onSceneSelect={preview.seekToScene}
      onSeek={preview.seek}
      onTogglePlayback={preview.togglePlayback}
      totalDuration={preview.totalDuration}
    />
  );
}

function ProjectEditorGrid({
  activeTab,
  editor,
  onRegenerateScene,
  preview,
  regeneratePending,
  selectedScene,
  setActiveTab,
}: {
  activeTab: EditorTab;
  editor: ReturnType<typeof useProjectEditorDraft>;
  onRegenerateScene: (sceneId: string) => void;
  preview: ProjectEditorPreviewState;
  regeneratePending: boolean;
  selectedScene: EditorSceneDraft | null;
  setActiveTab: (tab: EditorTab) => void;
}) {
  return (
    <div className="grid min-h-0 grid-cols-[54px_16px_534px_minmax(0,1fr)_332px] gap-y-0 2xl:grid-cols-[54px_16px_544px_minmax(0,1fr)_332px]">
      <EditorRail activeTab={activeTab} setActiveTab={setActiveTab} />
      <div />
      <EditorLeftPanel
        activeTab={activeTab}
        draft={editor.draft}
        onCaptionSelect={editor.setSelectedSceneId}
        onCaptionUpdate={editor.updateCaption}
        onMoveScene={editor.moveScene}
        onRegenerateScene={onRegenerateScene}
        onSceneSelect={editor.setSelectedSceneId}
        onSceneUpdate={editor.updateScene}
        regeneratePending={regeneratePending}
        selectedSceneId={selectedScene?.id ?? editor.draft.selectedSceneId}
      />
      <EditorPreviewStage draft={editor.draft} preview={preview} selectedScene={selectedScene} />
      <EditorInspector
        draft={editor.draft}
        onAspectRatioChange={editor.setAspectRatio}
        onToggleCaptions={editor.setShowCaptions}
        selectedScene={selectedScene}
      />
    </div>
  );
}

function useProjectEditorDraft(project: ProjectDetail, initialDraft: ProjectEditorDraft, localOverrideActive: boolean) {
  const persisted = usePersistedProjectEditorDraft(initialDraft, project.id, localOverrideActive);
  const totalDuration = editorTimelineDuration(project, persisted.draft);

  return {
    canRedo: persisted.canRedo,
    canUndo: persisted.canUndo,
    draft: persisted.draft,
    hydrateSavedDraft: persisted.hydrateSavedDraft,
    moveScene: (sceneId: string, direction: "backward" | "forward") =>
      persisted.setDraft((current) => ({ ...current, scenes: reorderScenes(current.scenes, sceneId, direction) })),
    nudgeScene: (sceneId: string, delta: number) =>
      persisted.setDraft((current) => shiftSceneTiming(current, sceneId, delta, totalDuration)),
    redo: persisted.redo,
    saveLabel: persisted.saveLabel,
    setAspectRatio: (aspectRatio: EditorAspectRatio) =>
      persisted.setDraft((current) => ({ ...current, aspectRatio })),
    setSelectedSceneId: (selectedSceneId: string) =>
      persisted.setDraft((current) => ({ ...current, selectedSceneId })),
    setShowCaptions: (showCaptions: boolean) =>
      persisted.setDraft((current) => ({ ...current, showCaptions })),
    undo: persisted.undo,
    updateCaption: (captionId: string, text: string) =>
      persisted.setDraft((current) => ({
        ...current,
        captions: current.captions.map((caption) => caption.id === captionId ? { ...caption, text } : caption),
      })),
    updateScene: (sceneId: string, patch: Partial<EditorSceneDraft>) =>
      persisted.setDraft((current) => ({
        ...current,
        scenes: current.scenes.map((scene) => scene.id === sceneId ? { ...scene, ...patch } : scene),
      })),
    updateSceneTiming: (sceneId: string, field: "start" | "end", value: number) =>
      persisted.setDraft((current) => updateSceneTiming(current, sceneId, field, value, totalDuration)),
  };
}

function useBootstrapHydration(
  bootstrapRecord: ProjectEditorStateRecord | null | undefined,
  hydrateSavedDraft: (draft: ProjectEditorDraft, updatedAt: string) => void,
  initialDraft: ProjectEditorDraft,
  localDraftSavedAt: string,
) {
  useEffect(() => {
    if (!bootstrapRecord) {
      if (!shouldPreferLocalDraft(localDraftSavedAt, "")) {
        hydrateSavedDraft(initialDraft, new Date().toISOString());
      }
      return;
    }
    const savedDraft = mapSavedStateToDraft(bootstrapRecord.editor_state, initialDraft);
    if (!savedDraft) {
      return;
    }
    if (shouldPreferLocalDraft(localDraftSavedAt, bootstrapRecord.updated_at)) {
      return;
    }
    hydrateSavedDraft(savedDraft, bootstrapRecord.updated_at);
  }, [bootstrapRecord, hydrateSavedDraft, initialDraft, localDraftSavedAt]);
}

function useRegenerateScene(
  draft: ProjectEditorDraft,
  projectId: string,
  hydrateSavedDraft: (draft: ProjectEditorDraft, updatedAt: string) => void,
) {
  const latestDraftRef = useRef(draft);

  useEffect(() => {
    latestDraftRef.current = draft;
  }, [draft]);

  return useMutation({
    mutationFn: async (sceneId: string) => regenerateProjectEditorScene(projectId, {
      editor_state: editorDraftToApiState(draft),
      scene_id: sceneId,
    }),
    onSuccess: (result, sceneId) => {
      const latestDraft = latestDraftRef.current;
      const regeneratedDraft = mapSavedStateToDraft(result.editor_state, latestDraft);
      if (!regeneratedDraft) {
        return;
      }
      const regeneratedScene = regeneratedDraft.scenes.find((scene) => scene.id === sceneId);
      if (!regeneratedScene) {
        return;
      }
      const regeneratedSceneCaptions = regeneratedDraft.captions.filter((caption) => caption.sceneId === sceneId);
      const mergedDraft = {
        ...latestDraft,
        captions: mergeRegeneratedCaptions(latestDraft.captions, regeneratedSceneCaptions, sceneId),
        scenes: latestDraft.scenes.map((scene) => scene.id === regeneratedScene.id ? regeneratedScene : scene),
      };
      hydrateSavedDraft(mergedDraft, result.updated_at);
    },
  });
}

function selectedSceneForDraft(draft: ProjectEditorDraft) {
  return draft.scenes.find((scene) => scene.id === draft.selectedSceneId) ?? draft.scenes[0] ?? null;
}

function selectedSceneForLayout(
  draft: ProjectEditorDraft,
  preview: ProjectEditorPreviewState,
) {
  if (!preview.isPlaying) {
    return selectedSceneForDraft(draft);
  }
  return preview.activeScene ?? selectedSceneForDraft(draft);
}

function editorTimelineDuration(project: ProjectDetail, draft: ProjectEditorDraft) {
  return (
    project.preview_video?.duration_seconds ||
    draft.scenes.at(-1)?.end ||
    draft.captions.at(-1)?.end ||
    1
  );
}

function mapSavedStateToDraft(
  state: ProjectEditorState | null,
  fallbackDraft: ProjectEditorDraft,
) {
  if (!state) return null;
  const nextDraft = editorDraftToApiState(fallbackDraft);
  const merged = {
    ...nextDraft,
    ...state,
  };
  return {
    aspectRatio: merged.aspect_ratio,
    captions: merged.captions.map((caption) => ({
      end: caption.end,
      id: caption.id,
      sceneId: caption.scene_id,
      start: caption.start,
      text: caption.text,
    })),
    scenes: merged.scenes.map((scene) => ({
      end: scene.end,
      id: scene.id,
      onScreenText: scene.on_screen_text,
      sceneNumber: scene.scene_number,
      source: scene.source,
      spokenLine: scene.spoken_line,
      start: scene.start,
      title: scene.title,
    })),
    selectedSceneId: merged.selected_scene_id,
    showCaptions: merged.show_captions,
  } satisfies ProjectEditorDraft;
}

function mergeRegeneratedCaptions(
  currentCaptions: ProjectEditorDraft["captions"],
  regeneratedCaptions: ProjectEditorDraft["captions"],
  sceneId: string,
) {
  const untouchedCaptions = currentCaptions.filter((caption) => caption.sceneId !== sceneId);
  return [...untouchedCaptions, ...regeneratedCaptions].sort((left, right) => left.start - right.start);
}
