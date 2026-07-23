"use client";

import type { ComponentProps } from "react";

import type { EditorSceneDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
import { EditorInspector } from "@/components/project-editor-panels";
import { EditorLeftPanel, EditorRail, type EditorToolMode } from "@/components/project-editor-left-panel";
import type { ProjectEditorPreviewState } from "@/components/project-editor-stage";
import { EditorPreviewStage } from "@/components/project-editor-stage";
import type { ProjectEditorClip, ProjectEditorRevisionSummary } from "@/lib/types";

type ProjectEditorWorkspaceGridProps = {
  activeTool: EditorToolMode;
  activeRevisionId: number | null;
  draft: ProjectEditorDraft;
  leftPanelProps: ComponentProps<typeof EditorLeftPanel>;
  onAspectRatioChange: (aspectRatio: ProjectEditorDraft["aspectRatio"]) => void;
  onRestoreRevision: (revisionId: number) => void;
  onToggleCaptions: (showCaptions: boolean) => void;
  onUpdateSelectedClip: (patch: Partial<ProjectEditorClip>) => void;
  preview: ProjectEditorPreviewState;
  restoreRevisionPending: boolean;
  revisions: ProjectEditorRevisionSummary[];
  selectedClip: ProjectEditorClip | null;
  selectedScene: EditorSceneDraft | null;
  setActiveTool: (tool: EditorToolMode) => void;
};

export function ProjectEditorWorkspaceGrid({
  activeTool,
  activeRevisionId,
  draft,
  leftPanelProps,
  onAspectRatioChange,
  onRestoreRevision,
  onToggleCaptions,
  onUpdateSelectedClip,
  preview,
  restoreRevisionPending,
  revisions,
  selectedClip,
  selectedScene,
  setActiveTool,
}: ProjectEditorWorkspaceGridProps) {
  return (
    <div className="grid min-h-0 grid-cols-[54px_16px_534px_minmax(0,1fr)_332px] gap-y-0 2xl:grid-cols-[54px_16px_544px_minmax(0,1fr)_332px]">
      <EditorRail activeTool={activeTool} setActiveTool={setActiveTool} />
      <div />
      <EditorLeftPanel {...leftPanelProps} />
      <EditorPreviewStage draft={draft} preview={preview} selectedScene={selectedScene} />
      <EditorInspector
        activeRevisionId={activeRevisionId}
        draft={draft}
        onAspectRatioChange={onAspectRatioChange}
        onRestoreRevision={onRestoreRevision}
        onToggleCaptions={onToggleCaptions}
        onUpdateSelectedClip={onUpdateSelectedClip}
        restoreRevisionPending={restoreRevisionPending}
        revisions={revisions}
        selectedClip={selectedClip}
        selectedScene={selectedScene}
      />
    </div>
  );
}
