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
  usePersistedProjectEditorDraft,
  useProjectEditorBootstrap,
} from "@/components/project-editor-persistence";
import { editorDraftToApiState } from "@/components/project-editor-persistence";
import {
  EditorInspector,
  EditorLeftPanel,
  EditorRail,
  EditorTopBar,
} from "@/components/project-editor-panels";
import {
  EditorPreviewStage,
  EditorTimeline,
  ProjectEditorPreviewState,
} from "@/components/project-editor-stage";
import { useAssetObjectUrl } from "@/components/render-preview-studio";
import { regenerateProjectEditorScene } from "@/lib/api";
import { ProjectDetail, ProjectEditorState, TranscriptResponse } from "@/lib/types";

type EditorTab = "script" | "captions" | "scenes";

export function ProjectEditorShell({
  project,
  transcript,
}: {
  project: ProjectDetail;
  transcript: TranscriptResponse["transcript"];
}) {
  const bootstrap = useProjectEditorBootstrap(project, transcript);
  if (bootstrap.pending) {
    return <EditorDraftLoadingState />;
  }
  return <ProjectEditorWorkspace key={project.id} initialDraft={bootstrap.draft} project={project} />;
}

function ProjectEditorWorkspace({
  initialDraft,
  project,
}: {
  initialDraft: ProjectEditorDraft;
  project: ProjectDetail;
}) {
  const [activeTab, setActiveTab] = useState<EditorTab>("script");
  const editor = useProjectEditorDraft(project, initialDraft);
  const preview = useProjectEditorPreview(project, editor.draft);
  const regenerateScene = useRegenerateScene(editor.draft, project.id, editor.hydrateSavedDraft);

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
    <div className="min-h-screen bg-[#121212] px-4 py-4 text-white lg:px-5">
      <div className="mx-auto flex max-w-[1900px] flex-col gap-4">
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
    <div className="grid gap-4 2xl:grid-cols-[64px_380px_minmax(0,1fr)_320px]">
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
      />
      <EditorPreviewStage draft={editor.draft} preview={preview} selectedScene={selectedScene} />
      <EditorInspector
        draft={editor.draft}
        onAspectRatioChange={editor.setAspectRatio}
        onRegenerateScene={onRegenerateScene}
        onSceneUpdate={editor.updateScene}
        onToggleCaptions={editor.setShowCaptions}
        regeneratePending={regeneratePending}
        selectedScene={selectedScene}
      />
    </div>
  );
}

function useProjectEditorDraft(project: ProjectDetail, initialDraft: ProjectEditorDraft) {
  const persisted = usePersistedProjectEditorDraft(initialDraft, project.id);
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
  const renderedPreview = useAssetObjectUrl(project.id, "source", Boolean(project.preview_video), "preview");
  const sourceAsset = useAssetObjectUrl(project.id, "source", Boolean(project.asset));
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceUrl = renderedPreview.objectUrl || sourceAsset.objectUrl;
  const isRenderedPreview = Boolean(project.preview_video && renderedPreview.objectUrl);
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

function EditorDraftLoadingState() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#121212] p-8 text-white">
      <div className="rounded-[28px] border border-white/10 bg-[#1b1b1b] px-8 py-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-200">Loading editor</p>
        <p className="mt-4 text-lg text-slate-300">Pulling the AI draft, transcript, and the latest manual edits into the workspace.</p>
      </div>
    </div>
  );
}
