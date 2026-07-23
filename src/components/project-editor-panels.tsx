"use client";

import type { ReactNode } from "react";

import type { EditorAspectRatio, EditorSceneDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
import {
  CloudArrowIcon,
  HeadphoneIcon,
  RedoIcon,
  SpinnerIcon,
  TranslateIcon,
  UndoIcon,
} from "@/components/project-editor-icons";
import { EditorRevisionHistory } from "@/components/project-editor-revisions";
import { ProjectDetail, ProjectEditorRevisionSummary } from "@/lib/types";

export function EditorTopBar({
  canRedo,
  canUndo,
  onRedo,
  onUndo,
  project,
  revisionLabel,
  saveLabel,
}: {
  canRedo: boolean;
  canUndo: boolean;
  onRedo: () => void;
  onUndo: () => void;
  project: ProjectDetail;
  revisionLabel: string;
  saveLabel: string;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[18px]">
      <ProjectCompactGroup project={project} />
      <div className="flex shrink-0 items-center gap-[10px]">
        <SaveStatusPill label={saveLabel} />
        <span className="rounded-[10px] border border-white/8 bg-[#1a1a1a] px-3 py-4 text-[12px] text-[#c8c8c8]">{revisionLabel}</span>
        <AvatarButton />
        <ToolbarButton>
          <HeadphoneIcon />
        </ToolbarButton>
        <ToolbarButton disabled={!canUndo} onClick={onUndo}>
          <UndoIcon />
        </ToolbarButton>
        <ToolbarButton disabled={!canRedo} onClick={onRedo}>
          <RedoIcon />
        </ToolbarButton>
        <WideButton>
          <TranslateIcon />
          <span>Translate</span>
        </WideButton>
        <ShareButton>Share</ShareButton>
      </div>
    </header>
  );
}

export function EditorInspector({
  activeRevisionId,
  draft,
  onAspectRatioChange,
  onRestoreRevision,
  onToggleCaptions,
  restoreRevisionPending,
  revisions,
  selectedScene,
}: {
  activeRevisionId: number | null;
  draft: ProjectEditorDraft;
  onAspectRatioChange: (aspectRatio: EditorAspectRatio) => void;
  onRestoreRevision: (revisionId: number) => void;
  onToggleCaptions: (value: boolean) => void;
  restoreRevisionPending: boolean;
  revisions: ProjectEditorRevisionSummary[];
  selectedScene: EditorSceneDraft | null;
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-[10px] border border-white/6 bg-[#211f1e] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <InspectorSection title="Project">
        <ToggleRow checked={draft.showCaptions} label="Show Transcript" onChange={onToggleCaptions} />
      </InspectorSection>
      <InspectorSection title="Aspect Ratio">
        <AspectRatioField aspectRatio={draft.aspectRatio} onChange={onAspectRatioChange} />
      </InspectorSection>
      <InspectorSection title="Selected Scene">
        <SceneDetails scene={selectedScene} />
      </InspectorSection>
      <InspectorSection title="Revision History">
        <EditorRevisionHistory activeRevisionId={activeRevisionId} onRestore={onRestoreRevision} restorePending={restoreRevisionPending} revisions={revisions} />
      </InspectorSection>
    </aside>
  );
}

function ProjectCompactGroup({ project }: { project: ProjectDetail }) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <div className="flex h-[50px] min-w-0 items-center gap-3 rounded-[10px] border border-white/7 bg-[#1b1a1a] px-[10px] py-[8px] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <span className="grid h-[31px] w-[31px] place-items-center rounded-[6px] border border-white/8 bg-[#141414] text-[#646464]">
          <CloudArrowIcon />
        </span>
        <p className="max-w-[338px] truncate text-[15px] font-medium tracking-[-0.02em] text-[#efefef]">{project.project_name}</p>
        <button className="grid h-6 w-6 place-items-center text-[#727272] transition hover:text-white" type="button">
          <CloudArrowIcon />
        </button>
      </div>
      <ViewSwitcher />
    </div>
  );
}

function ViewSwitcher() {
  return (
    <div className="flex h-[50px] items-center rounded-[10px] border border-white/7 bg-[#1b1a1a] p-1 text-[13px] text-[#777777]">
      <span className="rounded-[8px] bg-[#3b3939] px-[28px] py-[10px] text-[#efefef]">Video</span>
      <span className="px-[24px] py-[10px]">Article</span>
    </div>
  );
}

function SaveStatusPill({ label }: { label: string }) {
  const isPending = label.toLowerCase().includes("saving");
  return (
    <div className={`flex h-[52px] min-w-[316px] items-center justify-between rounded-[11px] px-[15px] shadow-[0_12px_30px_rgba(0,0,0,0.18)] ${isPending ? "bg-[#f4f1ef] text-[#1d1d1d]" : "bg-[#262626] text-[#f0f0f0]"}`}>
      <div className="flex min-w-0 items-center gap-[11px]">
        {isPending ? <SpinnerIcon /> : <CloudArrowIcon />}
        <span className="truncate text-[14px] font-medium">{label}</span>
      </div>
      {isPending ? <span className="text-[14px] text-[#484848]">In progress</span> : null}
    </div>
  );
}

function InspectorSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="border-b border-white/7 px-[14px] py-6 last:border-b-0">
      <p className="text-[12px] font-medium text-[#f0f0f0]">{title}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ToggleRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[14px] text-[#e7e7e7]">{label}</span>
      <button
        className={`flex h-[22px] w-[42px] items-center rounded-full p-[2px] transition ${checked ? "bg-[#d46ccc]" : "bg-[#3a3a3a]"}`}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

function AspectRatioField({
  aspectRatio,
  onChange,
}: {
  aspectRatio: EditorAspectRatio;
  onChange: (aspectRatio: EditorAspectRatio) => void;
}) {
  return (
    <label className="block">
      <select
        className="h-[42px] w-full rounded-[7px] border border-white/8 bg-[#191919] px-3 text-[14px] text-[#ededed] outline-none"
        onChange={(event) => onChange(event.target.value as EditorAspectRatio)}
        value={aspectRatio}
      >
        <option value="16:9">Landscape 16:9</option>
        <option value="9:16">Vertical 9:16</option>
        <option value="1:1">Square 1:1</option>
      </select>
    </label>
  );
}

function SceneDetails({ scene }: { scene: EditorSceneDraft | null }) {
  if (!scene) {
    return <p className="text-[13px] leading-6 text-[#8c8c8c]">Select a scene to inspect its timing and transcript context.</p>;
  }
  return (
    <div className="space-y-3 text-[13px] leading-6 text-[#b8b8b8]">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#727272]">{`Scene ${scene.sceneNumber}`}</p>
        <p className="mt-2 text-[14px] font-medium text-white">{scene.title}</p>
      </div>
      <p className="line-clamp-5 text-[#a8a8a8]">{scene.spokenLine}</p>
      <p className="text-[#8f8f8f]">{`${scene.start.toFixed(1)}s - ${scene.end.toFixed(1)}s`}</p>
    </div>
  );
}

function AvatarButton({ compact }: { compact?: boolean }) {
  const shape = compact ? "h-[40px] w-[40px] rounded-[8px] text-[18px]" : "h-[54px] w-[54px] rounded-[12px] text-[20px]";
  return (
    <button className={`grid place-items-center bg-[#4a7cff] font-medium text-white ${shape}`} type="button">
      R
    </button>
  );
}

function ToolbarButton({
  children,
  compact,
  disabled,
  onClick,
}: {
  children: ReactNode;
  compact?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const shape = compact ? "h-[40px] w-[40px] rounded-[8px]" : "h-[54px] w-[54px] rounded-[12px]";
  return (
    <button
      className={`grid place-items-center border border-white/8 bg-[#1a1a1a] text-[#bdbdbd] transition hover:text-white disabled:opacity-40 ${shape}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function WideButton({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  const shape = compact ? "h-[40px] rounded-[8px] px-4 text-[14px]" : "h-[54px] rounded-[12px] px-5 text-[14px]";
  return <button className={`flex items-center gap-2 border border-white/8 bg-[#1a1a1a] text-[#d1d1d1] ${shape}`}>{children}</button>;
}

function ShareButton({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  const shape = compact ? "h-[40px] rounded-[8px] px-4 text-[14px]" : "h-[54px] rounded-[12px] px-5 text-[14px]";
  return <button className={`bg-[#93448b] font-medium text-white ${shape}`}>{children}</button>;
}
