"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  activeCaptionAtTime,
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
import {
  EditorInspector,
  EditorTopBar,
} from "@/components/project-editor-panels";
import { EditorLeftPanel, EditorRail } from "@/components/project-editor-left-panel";
import {
  EditorPreviewStage,
  EditorTimeline,
  ProjectEditorPreviewState,
} from "@/components/project-editor-stage";
import { useAssetUrl } from "@/components/render-preview-studio";
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
      localDraftSavedAt={bootstrap.localDraftSavedAt}
      localOverrideActive={bootstrap.localOverrideActive}
      bootstrapRecord={bootstrap.record}
      key={project.id}
      initialDraft={bootstrap.draft}
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
  useBootstrapHydration(bootstrapRecord, editor.draft, editor.hydrateSavedDraft, initialDraft, localDraftSavedAt);

  return (
    <ProjectEditorLayout
      activeTab={activeTab}
      editor={editor}
      preview={preview}
      project={project}
      regeneratePending={regenerateScene.isPending}
      selectedScene={selectedSceneForDraft(editor.draft)}
      setActiveTab={setActiveTab}
      onRegenerateScene={regenerateScene.mutate}
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
    <div className="h-screen overflow-hidden bg-[#121212] px-6 py-4 text-white">
      <div className="mx-auto flex h-full max-w-[1940px] flex-col gap-4">
        <EditorHeader editor={editor} project={project} />
        <ProjectEditorGrid activeTab={activeTab} editor={editor} onRegenerateScene={onRegenerateScene} preview={preview} regeneratePending={regeneratePending} selectedScene={selectedScene} setActiveTab={setActiveTab} />
        <EditorTimelineSection editor={editor} onRegenerateScene={onRegenerateScene} preview={preview} regeneratePending={regeneratePending} />
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
  return <EditorTopBar canRedo={editor.canRedo} canUndo={editor.canUndo} onRedo={editor.redo} onUndo={editor.undo} project={project} saveLabel={editor.saveLabel} />;
}

function EditorTimelineSection({
  editor,
  onRegenerateScene,
  preview,
  regeneratePending,
}: {
  editor: ReturnType<typeof useProjectEditorDraft>;
  onRegenerateScene: (sceneId: string) => void;
  preview: ProjectEditorPreviewState;
  regeneratePending: boolean;
}) {
  return (
    <div className="min-h-0 shrink-0">
      <EditorTimeline
        currentTime={preview.currentTime}
        draft={editor.draft}
        isPlaying={preview.isPlaying}
        onSceneNudge={editor.nudgeScene}
        onSceneRegenerate={onRegenerateScene}
        onSceneSelect={preview.seekToScene}
        onSceneTimingChange={editor.updateSceneTiming}
        onSeek={preview.seek}
        onTogglePlayback={preview.togglePlayback}
        regeneratePending={regeneratePending}
        totalDuration={preview.totalDuration}
      />
    </div>
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
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[56px_530px_minmax(0,1fr)] 2xl:grid-cols-[56px_530px_minmax(0,1fr)_300px]">
      <EditorRail activeTab={activeTab} setActiveTab={setActiveTab} />
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
      <div className="lg:col-span-2 2xl:hidden">
        <ResponsiveInspector editor={editor} onRegenerateScene={onRegenerateScene} regeneratePending={regeneratePending} selectedScene={selectedScene} />
      </div>
      <div className="hidden 2xl:block min-h-0">
        <ResponsiveInspector editor={editor} onRegenerateScene={onRegenerateScene} regeneratePending={regeneratePending} selectedScene={selectedScene} />
      </div>
    </div>
  );
}

function ResponsiveInspector({
  editor,
  onRegenerateScene,
  regeneratePending,
  selectedScene,
}: {
  editor: ReturnType<typeof useProjectEditorDraft>;
  onRegenerateScene: (sceneId: string) => void;
  regeneratePending: boolean;
  selectedScene: EditorSceneDraft | null;
}) {
  return (
    <EditorInspector
      draft={editor.draft}
      onAspectRatioChange={editor.setAspectRatio}
      onRegenerateScene={onRegenerateScene}
      onSceneUpdate={editor.updateScene}
      onToggleCaptions={editor.setShowCaptions}
      regeneratePending={regeneratePending}
      selectedScene={selectedScene}
    />
  );
}

function useProjectEditorDraft(project: ProjectDetail, initialDraft: ProjectEditorDraft, localOverrideActive: boolean) {
  const persisted = usePersistedProjectEditorDraft(initialDraft, project.id, localOverrideActive);
  const totalDuration = totalTimelineDuration(project, persisted.draft);

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
  record: ProjectEditorStateRecord | null | undefined,
  draft: ProjectEditorDraft,
  hydrateSavedDraft: (draft: ProjectEditorDraft, updatedAt: string) => void,
  initialDraft: ProjectEditorDraft,
  localDraftSavedAt: string,
) {
  const hydratedAtRef = useRef("");
  const initialSerializedRef = useRef(JSON.stringify(editorDraftToApiState(initialDraft)));

  useEffect(() => {
    if (
      !record?.editor_state ||
      !record.updated_at ||
      hydratedAtRef.current === record.updated_at ||
      shouldPreferLocalDraft(localDraftSavedAt, record.updated_at) ||
      JSON.stringify(editorDraftToApiState(draft)) !== initialSerializedRef.current
    ) {
      return;
    }
    hydratedAtRef.current = record.updated_at;
    hydrateSavedDraft(projectEditorStateToDraft(record.editor_state), record.updated_at);
  }, [draft, hydrateSavedDraft, localDraftSavedAt, record]);
}

function useRegenerateScene(
  draft: ProjectEditorDraft,
  projectId: string,
  onSuccess: (draft: ProjectEditorDraft, updatedAt: string) => void,
) {
  return useMutation({
    mutationFn: (sceneId: string) =>
      regenerateProjectEditorScene(projectId, {
        editor_state: editorDraftToApiState(draft),
        scene_id: sceneId,
      }),
    onSuccess: (record) => onSuccess(projectEditorStateToDraft(record.editor_state), record.updated_at),
  });
}

function projectEditorStateToDraft(state: ProjectEditorState) {
  return {
    aspectRatio: state.aspect_ratio,
    captions: state.captions.map((caption) => ({
      end: caption.end,
      id: caption.id,
      sceneId: caption.scene_id,
      start: caption.start,
      text: caption.text,
    })),
    scenes: state.scenes.map((scene) => ({
      end: scene.end,
      id: scene.id,
      onScreenText: scene.on_screen_text,
      sceneNumber: scene.scene_number,
      source: scene.source,
      spokenLine: scene.spoken_line,
      start: scene.start,
      title: scene.title,
    })),
    selectedSceneId: state.selected_scene_id,
    showCaptions: state.show_captions,
  } satisfies ProjectEditorDraft;
}

function useProjectEditorPreview(project: ProjectDetail, draft: ProjectEditorDraft) {
  const renderedPreview = useAssetUrl(
    project.id,
    "source",
    Boolean(project.preview_video),
    project.preview_video?.storage_path ?? "",
    project.updated_at,
    "preview",
  );
  const sourceAsset = useAssetUrl(
    project.id,
    "source",
    Boolean(project.asset),
    project.asset?.storage_path ?? "",
    project.updated_at,
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceUrl = renderedPreview.url || sourceAsset.url;
  const isRenderedPreview = Boolean(project.preview_video && renderedPreview.url);
  const totalDuration = useMemo(() => totalTimelineDuration(project, draft), [draft, project]);

  useEffect(() => bindPreviewState(videoRef.current, setCurrentTime, setIsPlaying), [sourceUrl]);

  return {
    activeCaption: draft.showCaptions ? activeCaptionAtTime(draft.captions, currentTime) : null,
    currentTime,
    error: renderedPreview.error || sourceAsset.error || project.error_message,
    isPlaying,
    isRenderedPreview,
    seek: (time: number) => seekVideo(videoRef.current, time),
    seekToScene: (scene: EditorSceneDraft) => seekVideo(videoRef.current, scene.start),
    sourceUrl,
    togglePlayback: () => toggleVideoPlayback(videoRef.current),
    totalDuration,
    videoRef,
  } satisfies ProjectEditorPreviewState;
}

function bindPreviewState(
  video: HTMLVideoElement | null,
  setCurrentTime: (time: number) => void,
  setIsPlaying: (playing: boolean) => void,
) {
  if (!video) {
    return;
  }
  const sync = () => {
    setCurrentTime(video.currentTime);
    setIsPlaying(!video.paused && !video.ended);
  };
  video.addEventListener("timeupdate", sync);
  video.addEventListener("play", sync);
  video.addEventListener("pause", sync);
  video.addEventListener("loadedmetadata", sync);
  return () => {
    video.removeEventListener("timeupdate", sync);
    video.removeEventListener("play", sync);
    video.removeEventListener("pause", sync);
    video.removeEventListener("loadedmetadata", sync);
  };
}

function selectedSceneForDraft(draft: ProjectEditorDraft) {
  return draft.scenes.find((scene) => scene.id === draft.selectedSceneId) ?? draft.scenes[0] ?? null;
}

function totalTimelineDuration(project: ProjectDetail, draft: ProjectEditorDraft) {
  const draftDuration = Math.max(...draft.scenes.map((scene) => scene.end), 0);
  return draftDuration || project.preview_video?.duration_seconds || project.edit_plan?.total_duration_seconds || 12;
}

function seekVideo(video: HTMLVideoElement | null, time: number) {
  if (!video) {
    return;
  }
  video.currentTime = Math.max(time, 0);
}

function toggleVideoPlayback(video: HTMLVideoElement | null) {
  if (!video) {
    return;
  }
  if (video.paused) {
    void video.play().catch(() => undefined);
    return;
  }
  video.pause();
}
