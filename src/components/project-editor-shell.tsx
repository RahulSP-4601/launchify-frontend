"use client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { EditorSceneDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
import { buildSceneActions, buildSequenceActions } from "@/components/project-editor-actions";
import { useProjectEditorAssets } from "@/components/project-editor-assets";
import {
  shouldPreferLocalDraft,
  usePersistedProjectEditorDraft,
  useProjectEditorBootstrap,
} from "@/components/project-editor-persistence";
import { editorDraftToApiState } from "@/components/project-editor-persistence";
import { deriveEditorSequence } from "@/components/project-editor-sequence";
import { EditorTopBar } from "@/components/project-editor-panels";
import { EditorToolMode } from "@/components/project-editor-left-panel";
import { useProjectEditorPreview } from "@/components/project-editor-preview";
import { useEditorShortcuts } from "@/components/project-editor-shortcuts";
import { EditorUploadInput } from "@/components/project-editor-upload-input";
import { ProjectEditorWorkspaceGrid } from "@/components/project-editor-workspace-grid";
import { EditorTimeline, ProjectEditorPreviewState } from "@/components/project-editor-stage";
import { regenerateProjectEditorScene } from "@/lib/api";
import { ProjectDetail, ProjectEditorClip, ProjectEditorState, ProjectEditorStateRecord, TranscriptResponse } from "@/lib/types";
const EDITOR_BASE_WIDTH = 1860, EDITOR_BASE_HEIGHT = 1040;
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

type ProjectEditorWorkspaceProps = {
  bootstrapRecord: ProjectEditorStateRecord | null | undefined;
  initialDraft: ProjectEditorDraft;
  localDraftSavedAt: string;
  localOverrideActive: boolean;
  project: ProjectDetail;
  revisions: ReturnType<typeof useProjectEditorBootstrap>["revisions"];
};

function ProjectEditorWorkspace({
  bootstrapRecord,
  initialDraft,
  localDraftSavedAt,
  localOverrideActive,
  project,
  revisions,
}: ProjectEditorWorkspaceProps) {
  const [activeTool, setActiveTool] = useState<EditorToolMode>("pointer");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const editor = useProjectEditorDraft(project, initialDraft, localOverrideActive);
  const editorAssets = useProjectEditorAssets(
    project.id,
    editor.draft,
    editor.insertMediaAsset,
    editor.setMediaIntent,
  );
  const preview = useProjectEditorPreview(project, editor.draft);
  const regenerateScene = useRegenerateScene(editor.draft, project.id, editor.hydrateSavedDraft);
  useBootstrapHydration(bootstrapRecord, editor.hydrateSavedDraft, initialDraft, localDraftSavedAt);
  useEditorShortcuts(editor, preview);
  const openUploadPicker = () => {
    setActiveTool("media");
    editor.setMediaIntent("upload_file");
    uploadInputRef.current?.click();
  };
  const openSavedMediaTab = () => {
    setActiveTool("media");
    editor.setMediaIntent("import_project");
    editor.setMediaTab("saved");
  };
  return (
    <ProjectEditorLayout
      activeTool={activeTool}
      editor={editor}
      editorAssets={editorAssets}
      openSavedMediaTab={openSavedMediaTab}
      openUploadPicker={openUploadPicker}
      uploadInputRef={uploadInputRef}
      onRegenerateScene={regenerateScene.mutate}
      preview={preview}
      project={project}
      regeneratePending={regenerateScene.isPending}
      revisions={revisions}
      selectedScene={selectedSceneForLayout(editor.draft, preview)}
      setActiveTool={setActiveTool}
    />
  );
}

type ProjectEditorLayoutProps = {
  activeTool: EditorToolMode;
  editor: ReturnType<typeof useProjectEditorDraft>;
  editorAssets: ReturnType<typeof useProjectEditorAssets>;
  openSavedMediaTab: () => void;
  openUploadPicker: () => void;
  uploadInputRef: React.RefObject<HTMLInputElement | null>;
  onRegenerateScene: (sceneId: string) => void;
  preview: ProjectEditorPreviewState;
  project: ProjectDetail;
  regeneratePending: boolean;
  revisions: ReturnType<typeof useProjectEditorBootstrap>["revisions"];
  selectedScene: EditorSceneDraft | null;
  setActiveTool: (tool: EditorToolMode) => void;
};

function ProjectEditorLayout({
  activeTool,
  editor,
  editorAssets,
  openSavedMediaTab,
  openUploadPicker,
  uploadInputRef,
  onRegenerateScene,
  preview,
  project,
  regeneratePending,
  revisions,
  selectedScene,
  setActiveTool,
}: ProjectEditorLayoutProps) {
  const workspaceScale = useWorkspaceScale();
  return (
    <div className="h-screen overflow-auto bg-[#0b0b0b] px-4 pb-4 pt-5 text-white">
      <EditorUploadInput onFileChange={editorAssets.handleFileSelection} uploadInputRef={uploadInputRef} />
      <ScaledWorkspaceFrame workspaceScale={workspaceScale}>
          <EditorHeader editor={editor} project={project} />
          <div />
          <ProjectEditorWorkspaceGrid
            activeTool={activeTool}
            activeRevisionId={editor.draft.headRevisionId}
            draft={editor.draft}
            leftPanelProps={leftPanelProps(activeTool, editor, editorAssets, openUploadPicker, onRegenerateScene, preview.currentTime, regeneratePending, selectedScene)}
            onAspectRatioChange={editor.setAspectRatio}
            onRestoreRevision={editor.restoreRevision}
            onToggleCaptions={editor.setShowCaptions}
            onUpdateSelectedClip={editor.updateSelectedClip}
            preview={preview}
            restoreRevisionPending={editor.restoreRevisionPending}
            revisions={revisions}
            selectedClip={selectedClipForDraft(editor.draft)}
            selectedScene={selectedScene}
            setActiveTool={setActiveTool}
          />
          <div />
          <EditorTimelineSection editor={editor} openSavedMediaTab={openSavedMediaTab} openUploadPicker={openUploadPicker} preview={preview} />
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
  openSavedMediaTab,
  openUploadPicker,
  preview,
}: {
  editor: ReturnType<typeof useProjectEditorDraft>;
  openSavedMediaTab: () => void;
  openUploadPicker: () => void;
  preview: ProjectEditorPreviewState;
}) {
  return (
    <EditorTimeline
      currentTime={preview.currentTime}
      draft={editor.draft}
      editMode={editor.draft.editMode}
      isPlaying={preview.isPlaying}
      onAddOverlayCallout={editor.addOverlayCallout}
      onChooseImportProject={openSavedMediaTab}
      onAddScreen={editor.addScreenAfterSelected}
      onAddVideoTrack={editor.addVideoTrack}
      onEditModeChange={editor.setEditMode}
      onExtractScene={editor.extractSelectedScene}
      onLiftScene={editor.liftSelectedScene}
      onRollBoundary={editor.rollSelectedBoundary}
      onRippleDeleteScene={editor.rippleDeleteSelectedScene}
      onMoveClip={editor.moveSelectedClip}
      onSelectClip={editor.setSelectedClipId}
      onSelectTrack={editor.setSelectedTrackId}
      onToggleTrackLocked={editor.toggleTrackLocked}
      onToggleTrackMuted={editor.toggleTrackMuted}
      onSplitScene={editor.splitSelectedScene}
      onSlideScene={editor.slideSelectedScene}
      onSceneSelect={preview.seekToScene}
      onSeek={preview.seek}
      onSlipScene={editor.slipSelectedScene}
      onTrimClip={editor.trimSelectedClipEdge}
      onTrimBoundary={editor.trimSceneBoundary}
      onTogglePlayback={preview.togglePlayback}
      onChooseUploadFile={openUploadPicker}
      totalDuration={preview.totalDuration}
    />
  );
}

function leftPanelProps(
  activeTool: EditorToolMode,
  editor: ReturnType<typeof useProjectEditorDraft>,
  editorAssets: ReturnType<typeof useProjectEditorAssets>,
  openUploadPicker: () => void,
  onRegenerateScene: (sceneId: string) => void,
  currentTime: number,
  regeneratePending: boolean,
  selectedScene: EditorSceneDraft | null,
) {
  return {
    activeTool,
    assets: editorAssets.assets,
    assetsPending: editorAssets.assetsPending,
    currentTime,
    draft: editor.draft,
    onAssetSelect: editorAssets.onAssetSelect,
    onAddComment: editor.addComment,
    onCaptionSelect: editor.setSelectedSceneId,
    onCaptionUpdate: editor.updateCaption,
    onMoveScene: editor.moveScene,
    onRegenerateScene,
    onSceneSelect: editor.setSelectedSceneId,
    onSetCaptionPreset: editor.setCaptionPreset,
    onSetMediaIntent: editor.setMediaIntent,
    onSetMediaTab: editor.setMediaTab,
    onSetSelectedEffect: editor.setSelectedEffect,
    onSetSelectedShape: editor.setSelectedShape,
    onSceneUpdate: editor.updateScene,
    onUploadRequest: openUploadPicker,
    regeneratePending,
    selectedSceneId: selectedScene?.id ?? editor.draft.selectedSceneId,
  };
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
  if (draft.selectedClipId && !draft.selectedSceneId) {
    return null;
  }
  return draft.scenes.find((scene) => scene.id === draft.selectedSceneId) ?? draft.scenes[0] ?? null;
}

function selectedClipForDraft(draft: ProjectEditorDraft): ProjectEditorClip | null {
  return draft.sequence.tracks
    .flatMap((track) => track.clips)
    .find((clip) => clip.id === draft.selectedClipId) ?? null;
}

function selectedSceneForLayout(
  draft: ProjectEditorDraft,
  preview: ProjectEditorPreviewState,
) {
  return preview.isPlaying ? preview.activeScene ?? selectedSceneForDraft(draft) : selectedSceneForDraft(draft);
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
    comments: (merged.comments ?? []).map((comment) => ({
      body: comment.body,
      createdAt: comment.created_at,
      id: comment.id,
      sceneId: comment.scene_id,
      time: comment.time,
    })),
    editMode: merged.edit_mode ?? "overwrite",
    headRevisionId,
    projectId: fallbackDraft.projectId,
    selectedClipId: merged.selected_clip_id ?? fallbackDraft.selectedClipId,
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
    toolState: merged.tool_state ?? fallbackDraft.toolState,
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
