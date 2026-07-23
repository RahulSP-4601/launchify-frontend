"use client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  EditorSceneDraft,
  ProjectEditorDraft,
} from "@/components/project-editor-draft";
import { buildSceneActions, buildSequenceActions } from "@/components/project-editor-actions";
import {
  shouldPreferLocalDraft,
  usePersistedProjectEditorDraft,
  useProjectEditorBootstrap,
} from "@/components/project-editor-persistence";
import { editorDraftToApiState } from "@/components/project-editor-persistence";
import { deriveEditorSequence } from "@/components/project-editor-sequence";
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
const EDITOR_BASE_WIDTH = 1860;
const EDITOR_BASE_HEIGHT = 1040;

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
      revisions={bootstrap.revisions}
    />
  );
}

function ProjectEditorWorkspace({
  bootstrapRecord,
  initialDraft,
  localDraftSavedAt,
  localOverrideActive,
  project,
  revisions,
}: {
  bootstrapRecord: ProjectEditorStateRecord | null | undefined;
  initialDraft: ProjectEditorDraft;
  localDraftSavedAt: string;
  localOverrideActive: boolean;
  project: ProjectDetail;
  revisions: ReturnType<typeof useProjectEditorBootstrap>["revisions"];
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
      revisions={revisions}
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
  revisions,
  selectedScene,
  setActiveTab,
}: {
  activeTab: EditorTab;
  editor: ReturnType<typeof useProjectEditorDraft>;
  onRegenerateScene: (sceneId: string) => void;
  preview: ProjectEditorPreviewState;
  project: ProjectDetail;
  regeneratePending: boolean;
  revisions: ReturnType<typeof useProjectEditorBootstrap>["revisions"];
  selectedScene: EditorSceneDraft | null;
  setActiveTab: (tab: EditorTab) => void;
}) {
  const workspaceScale = useWorkspaceScale();
  return (
    <div className="h-screen overflow-auto bg-[#0b0b0b] px-4 pb-4 pt-5 text-white">
      <ScaledWorkspaceFrame workspaceScale={workspaceScale}>
          <EditorHeader editor={editor} project={project} />
          <div />
          <ProjectEditorGrid
            activeTab={activeTab}
            editor={editor}
            onRegenerateScene={onRegenerateScene}
            preview={preview}
            regeneratePending={regeneratePending}
            revisions={revisions}
            selectedScene={selectedScene}
            setActiveTab={setActiveTab}
          />
          <div />
          <EditorTimelineSection editor={editor} preview={preview} />
      </ScaledWorkspaceFrame>
    </div>
  );
}
function ScaledWorkspaceFrame({
  children,
  workspaceScale,
}: {
  children: React.ReactNode;
  workspaceScale: number;
}) {
  return (
    <div
      className="mx-auto"
      style={{ height: `${EDITOR_BASE_HEIGHT * workspaceScale}px`, width: `${EDITOR_BASE_WIDTH * workspaceScale}px` }}
    >
      <div
        className="grid grid-rows-[52px_18px_minmax(0,1fr)_14px_246px]"
        style={{
          height: `${EDITOR_BASE_HEIGHT}px`,
          transform: `scale(${workspaceScale})`,
          transformOrigin: "top left",
          width: `${EDITOR_BASE_WIDTH}px`,
        }}
      >
        {children}
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
      revisionLabel={`Revision v${editor.draft.sequence.version}`}
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
      editMode={editor.draft.editMode}
      isPlaying={preview.isPlaying}
      onAddOverlayCallout={editor.addOverlayCallout}
      onAddScreen={editor.addScreenAfterSelected}
      onAddVideoTrack={editor.addVideoTrack}
      onEditModeChange={editor.setEditMode}
      onExtractScene={editor.extractSelectedScene}
      onLiftScene={editor.liftSelectedScene}
      onRollBoundary={editor.rollSelectedBoundary}
      onRippleDeleteScene={editor.rippleDeleteSelectedScene}
      onSelectTrack={editor.setSelectedTrackId}
      onToggleTrackLocked={editor.toggleTrackLocked}
      onToggleTrackMuted={editor.toggleTrackMuted}
      onSplitScene={editor.splitSelectedScene}
      onSlideScene={editor.slideSelectedScene}
      onSceneSelect={preview.seekToScene}
      onSeek={preview.seek}
      onSlipScene={editor.slipSelectedScene}
      onTrimBoundary={editor.trimSceneBoundary}
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
  revisions,
  selectedScene,
  setActiveTab,
}: {
  activeTab: EditorTab;
  editor: ReturnType<typeof useProjectEditorDraft>;
  onRegenerateScene: (sceneId: string) => void;
  preview: ProjectEditorPreviewState;
  regeneratePending: boolean;
  revisions: ReturnType<typeof useProjectEditorBootstrap>["revisions"];
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
        activeRevisionId={editor.draft.headRevisionId}
        draft={editor.draft}
        onAspectRatioChange={editor.setAspectRatio}
        onRestoreRevision={editor.restoreRevision}
        onToggleCaptions={editor.setShowCaptions}
        restoreRevisionPending={editor.restoreRevisionPending}
        revisions={revisions}
        selectedScene={selectedScene}
      />
    </div>
  );
}

function useWorkspaceScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const widthScale = (window.innerWidth - 32) / EDITOR_BASE_WIDTH;
      const heightScale = (window.innerHeight - 28) / EDITOR_BASE_HEIGHT;
      setScale(Math.min(1, widthScale, heightScale));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return scale;
}

function useProjectEditorDraft(project: ProjectDetail, initialDraft: ProjectEditorDraft, localOverrideActive: boolean) {
  const persisted = usePersistedProjectEditorDraft(initialDraft, project.id, localOverrideActive);
  const totalDuration = editorTimelineDuration(project, persisted.draft);

  return {
    canRedo: persisted.canRedo,
    canUndo: persisted.canUndo,
    draft: persisted.draft,
    ...buildSequenceActions(persisted.setDraft),
    hydrateSavedDraft: persisted.hydrateSavedDraft,
    redo: persisted.redo,
    restoreRevision: persisted.restoreRevision,
    restoreRevisionPending: persisted.restoreRevisionPending,
    saveLabel: persisted.saveLabel,
    undo: persisted.undo,
    ...buildSceneActions(persisted.setDraft, totalDuration),
  };
}

function useBootstrapHydration(
  bootstrapRecord: ProjectEditorStateRecord | null | undefined,
  hydrateSavedDraft: (draft: ProjectEditorDraft, updatedAt: string, headRevisionId: number | null) => void,
  initialDraft: ProjectEditorDraft,
  localDraftSavedAt: string,
) {
  useEffect(() => {
    if (!bootstrapRecord) {
      if (!shouldPreferLocalDraft(localDraftSavedAt, "")) {
        hydrateSavedDraft(initialDraft, new Date().toISOString(), initialDraft.headRevisionId);
      }
      return;
    }
    const savedDraft = mapSavedStateToDraft(bootstrapRecord.editor_state, initialDraft, bootstrapRecord.head_revision_id);
    if (!savedDraft) {
      return;
    }
    if (shouldPreferLocalDraft(localDraftSavedAt, bootstrapRecord.updated_at)) {
      return;
    }
    hydrateSavedDraft(savedDraft, bootstrapRecord.updated_at, bootstrapRecord.head_revision_id);
  }, [bootstrapRecord, hydrateSavedDraft, initialDraft, localDraftSavedAt]);
}

function useRegenerateScene(
  draft: ProjectEditorDraft,
  projectId: string,
  hydrateSavedDraft: (draft: ProjectEditorDraft, updatedAt: string, headRevisionId: number | null) => void,
) {
  const latestDraftRef = useRef(draft);

  useEffect(() => {
    latestDraftRef.current = draft;
  }, [draft]);

  return useMutation({
    mutationFn: async (sceneId: string) => regenerateProjectEditorScene(projectId, {
      base_revision_id: draft.headRevisionId,
      editor_state: editorDraftToApiState(draft),
      scene_id: sceneId,
    }),
    onSuccess: (result, sceneId) => {
      const latestDraft = latestDraftRef.current;
      const regeneratedDraft = mapSavedStateToDraft(result.editor_state, latestDraft, result.head_revision_id);
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
        headRevisionId: result.head_revision_id,
        scenes: latestDraft.scenes.map((scene) => scene.id === regeneratedScene.id ? regeneratedScene : scene),
      };
      hydrateSavedDraft(mergedDraft, result.updated_at, result.head_revision_id);
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
  return Math.max(
    project.preview_video?.duration_seconds || 0,
    draft.scenes.at(-1)?.end || 0,
    draft.captions.at(-1)?.end || 0,
    1,
  );
}

function mapSavedStateToDraft(
  state: ProjectEditorState | null,
  fallbackDraft: ProjectEditorDraft,
  headRevisionId: number | null,
) {
  if (!state) return null;
  const nextDraft = editorDraftToApiState(fallbackDraft);
  const merged = {
    ...nextDraft,
    ...state,
  };
  const scenes = mapScenesFromSavedState(merged);
  const captions = mapCaptionsFromSavedState(merged);
  return {
    aspectRatio: merged.aspect_ratio,
    captions,
    editMode: merged.edit_mode ?? "overwrite",
    headRevisionId,
    projectId: fallbackDraft.projectId,
    scenes,
    selectedSceneId: merged.selected_scene_id,
    selectedTrackId: merged.selected_track_id || fallbackDraft.selectedTrackId,
    sequence: merged.sequence ?? deriveEditorSequence(
      fallbackDraft.projectId,
      scenes,
      captions,
      fallbackDraft.sequence.tracks
        .filter((track) => track.kind === "audio")
        .flatMap((track) => track.clips)
        .map((clip) => ({
          end: clip.timeline_end,
          id: clip.id.replace("audio-clip-", ""),
          sceneId: clip.scene_id,
          start: clip.timeline_start,
          text: clip.text,
          title: clip.title,
        })),
    ),
    showCaptions: merged.show_captions,
  } satisfies ProjectEditorDraft;
}

function mapScenesFromSavedState(state: ProjectEditorState) {
  return state.scenes.map((scene) => ({
    end: scene.end,
    id: scene.id,
    onScreenText: scene.on_screen_text,
    sceneNumber: scene.scene_number,
    source: scene.source,
    spokenLine: scene.spoken_line,
    start: scene.start,
    title: scene.title,
  }));
}

function mapCaptionsFromSavedState(state: ProjectEditorState) {
  return state.captions.map((caption) => ({
    end: caption.end,
    id: caption.id,
    sceneId: caption.scene_id,
    start: caption.start,
    text: caption.text,
  }));
}

function mergeRegeneratedCaptions(
  currentCaptions: ProjectEditorDraft["captions"],
  regeneratedCaptions: ProjectEditorDraft["captions"],
  sceneId: string,
) {
  const untouchedCaptions = currentCaptions.filter((caption) => caption.sceneId !== sceneId);
  return [...untouchedCaptions, ...regeneratedCaptions].sort((left, right) => left.start - right.start);
}
