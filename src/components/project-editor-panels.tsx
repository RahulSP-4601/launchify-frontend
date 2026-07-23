"use client";

import type { ReactNode } from "react";

import type { EditorAspectRatio, EditorSceneDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
import {
  FileDocIcon,
  HeadphoneIcon,
  RedoIcon,
  SpinnerIcon,
  TranslateIcon,
  UndoIcon,
} from "@/components/project-editor-icons";
import { ProjectDetail } from "@/lib/types";

export function EditorTopBar({
  canRedo,
  canUndo,
  onRedo,
  onUndo,
  project,
  saveLabel,
}: {
  canRedo: boolean;
  canUndo: boolean;
  onRedo: () => void;
  onUndo: () => void;
  project: ProjectDetail;
  saveLabel: string;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,620px)_minmax(0,1fr)] items-center gap-4">
      <TopBarIdentity project={project} />
      <TopBarActions canRedo={canRedo} canUndo={canUndo} onRedo={onRedo} onUndo={onUndo} saveLabel={saveLabel} />
    </header>
  );
}

export function EditorInspector({
  draft,
  onAspectRatioChange,
  onToggleCaptions,
}: {
  draft: ProjectEditorDraft;
  onAspectRatioChange: (aspectRatio: EditorAspectRatio) => void;
  onRegenerateScene: (sceneId: string) => void;
  onSceneUpdate: (sceneId: string, patch: Partial<EditorSceneDraft>) => void;
  onToggleCaptions: (value: boolean) => void;
  regeneratePending: boolean;
  selectedScene: EditorSceneDraft | null;
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-[14px] border border-white/7 bg-[#1b1b1b]">
      <InspectorToolbar />
      <InspectorSection title="Project">
        <ToggleRow checked={draft.showCaptions} label="Show Transcript" onChange={onToggleCaptions} />
        <AspectRatioField aspectRatio={draft.aspectRatio} onChange={onAspectRatioChange} />
      </InspectorSection>
    </aside>
  );
}

function TopBarIdentity({ project }: { project: ProjectDetail }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ProjectChip projectName={project.project_name} />
      <ViewSwitcher />
    </div>
  );
}

function TopBarActions({
  canRedo,
  canUndo,
  onRedo,
  onUndo,
  saveLabel,
}: {
  canRedo: boolean;
  canUndo: boolean;
  onRedo: () => void;
  onUndo: () => void;
  saveLabel: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-end gap-3">
      <SaveStatusPill label={saveLabel} />
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
  );
}

function ProjectChip({ projectName }: { projectName: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[14px] border border-white/8 bg-[#1d1d1d] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <span className="grid h-11 w-11 place-items-center rounded-[11px] border border-white/8 bg-[#171717] text-[#72809c]">
        <FileDocIcon />
      </span>
      <p className="truncate text-[17px] font-medium tracking-[-0.01em] text-white">{projectName}</p>
      <button className="text-[#72809c] transition hover:text-white" type="button">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M6 14a4 4 0 0 1 .8-7.9A5.3 5.3 0 0 1 17 9a3.5 3.5 0 0 1-1 7H9" />
          <path d="m12 8 2 2" />
          <path d="m12 8-2 2" />
          <path d="M12 8v7" />
        </svg>
      </button>
    </div>
  );
}

function ViewSwitcher() {
  return (
    <div className="flex items-center rounded-[14px] border border-white/8 bg-[#171717] p-1.5 text-[16px] text-[#7d88a3]">
      <span className="rounded-[10px] bg-[#2a2a2a] px-8 py-2 text-white">Video</span>
      <span className="px-8 py-2">Article</span>
    </div>
  );
}

function SaveStatusPill({ label }: { label: string }) {
  return (
    <div className="flex w-[min(100%,320px)] min-w-[240px] items-center justify-between rounded-[14px] bg-white px-5 py-3 text-black shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
      <div className="flex min-w-0 items-center gap-3">
        <SpinnerIcon />
        <span className="truncate text-[16px] font-medium">{label}</span>
      </div>
      <button className="shrink-0 text-[15px] text-[#4b5565]" type="button">
        Cancel
      </button>
    </div>
  );
}

function InspectorToolbar() {
  return (
    <div className="flex items-center gap-3 border-b border-white/8 px-4 py-4">
      <AvatarButton compact />
      <ToolbarButton compact>
        <HeadphoneIcon />
      </ToolbarButton>
      <WideButton compact>
        <TranslateIcon />
        <span>Translate</span>
      </WideButton>
      <ShareButton compact>Share</ShareButton>
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
    <section className="border-t border-white/7 px-4 py-4 first:border-t-0">
      <p className="text-[14px] font-medium tracking-[-0.01em] text-[#959595]">{title}</p>
      <div className="mt-7 space-y-8">{children}</div>
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
      <span className="text-[16px] text-white">{label}</span>
      <button
        className={`flex h-8 w-11 items-center rounded-full p-1 transition ${checked ? "bg-[#ef81e6]" : "bg-[#323232]"}`}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span className={`h-6 w-6 rounded-full bg-white transition ${checked ? "translate-x-3" : ""}`} />
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
      <span className="text-[16px] text-white">Aspect Ratio</span>
      <select
        className="mt-5 h-12 w-full rounded-[8px] border border-white/8 bg-[#181818] px-4 text-[16px] text-white outline-none"
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

function AvatarButton({ compact }: { compact?: boolean }) {
  const shape = compact ? "h-10 w-10 rounded-[10px] text-[18px]" : "h-12 w-12 rounded-[12px] text-[22px]";
  return (
    <button
      className={`grid place-items-center border border-[#4b6fff]/40 bg-[#456bff] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ${shape}`}
      type="button"
    >
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
  const shape = compact ? "h-10 w-10 rounded-[10px]" : "h-12 w-12 rounded-[12px]";
  return (
    <button
      className={`grid place-items-center border border-white/8 bg-[#1b1b1b] text-[#b6bdcf] transition hover:text-white disabled:opacity-40 ${shape}`}
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
  const shape = compact ? "h-10 rounded-[10px] px-4 text-[15px]" : "h-12 rounded-[12px] px-5 text-[16px]";
  return <button className={`flex items-center gap-2 border border-white/8 bg-[#1b1b1b] text-[#c0c5d4] ${shape}`}>{children}</button>;
}

function ShareButton({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  const shape = compact ? "h-10 rounded-[10px] px-4 text-[15px]" : "h-12 rounded-[12px] px-7 text-[16px]";
  return <button className={`bg-[#93418b] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${shape}`}>{children}</button>;
}
