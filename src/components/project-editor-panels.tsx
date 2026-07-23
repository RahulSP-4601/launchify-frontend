"use client";

import type { ReactNode } from "react";

import type {
  EditorAspectRatio,
  EditorSceneDraft,
  ProjectEditorDraft,
} from "@/components/project-editor-draft";
import {
  CloudArrowIcon,
  FileDocIcon,
  HeadphoneIcon,
  RedoIcon,
  SpinnerIcon,
  TranslateIcon,
  UndoIcon,
} from "@/components/project-editor-icons";
export {
  EditorLeftPanel,
  EditorRail,
} from "@/components/project-editor-left-panel";
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
    <header className="flex items-center justify-between gap-4">
      <HeaderGroup project={project} />
      <ActionGroup
        canRedo={canRedo}
        canUndo={canUndo}
        onRedo={onRedo}
        onUndo={onUndo}
        saveLabel={saveLabel}
      />
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
    <aside className="flex h-full min-h-0 flex-col rounded-[14px] border border-white/6 bg-[#1c1c1c]">
      <InspectorToolbar />
      <SectionTitle>Project</SectionTitle>
      <InspectorBody>
        <ToggleRow
          checked={draft.showCaptions}
          label="Show Transcript"
          onChange={onToggleCaptions}
        />
        <AspectRatioField
          aspectRatio={draft.aspectRatio}
          onChange={onAspectRatioChange}
        />
      </InspectorBody>
    </aside>
  );
}

function HeaderGroup({ project }: { project: ProjectDetail }) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <TitleChip projectName={project.project_name} />
      <SegmentedView />
    </div>
  );
}

function TitleChip({ projectName }: { projectName: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[12px] border border-white/8 bg-[#1a1a1a] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <ProjectMark>
        <FileDocIcon />
      </ProjectMark>
      <p className="max-w-[340px] truncate text-[18px] font-medium tracking-[-0.01em] text-white">
        {projectName}
      </p>
      <button
        className="grid h-8 w-8 place-items-center text-slate-500 transition hover:text-slate-300"
        type="button"
      >
        <CloudArrowIcon />
      </button>
    </div>
  );
}

function SegmentedView() {
  return (
    <div className="flex items-center rounded-[12px] border border-white/8 bg-[#151515] p-1 text-[15px] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <span className="rounded-[10px] bg-[#2a2a2a] px-8 py-2.5 text-white">
        Video
      </span>
      <span className="px-8 py-2.5">Article</span>
    </div>
  );
}

function ActionGroup({
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
    <div className="flex min-w-0 items-center gap-2.5 xl:gap-3">
      <SavePill saveLabel={saveLabel} />
      <AvatarButton />
      <RoundButton>
        <HeadphoneIcon />
      </RoundButton>
      <RoundButton disabled={!canUndo} onClick={onUndo}>
        <UndoIcon />
      </RoundButton>
      <RoundButton disabled={!canRedo} onClick={onRedo}>
        <RedoIcon />
      </RoundButton>
      <GhostButton>
        <TranslateIcon />
        <span>Translate</span>
      </GhostButton>
      <PrimaryButton>Share</PrimaryButton>
    </div>
  );
}

function SavePill({ saveLabel }: { saveLabel: string }) {
  return (
    <div className="flex w-[min(42vw,440px)] min-w-[250px] shrink items-center justify-between rounded-[14px] bg-white px-4 py-3 text-black shadow-[0_10px_30px_rgba(0,0,0,0.28)] xl:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <SpinnerIcon />
        <span className="truncate text-[16px] font-medium tracking-[-0.01em]">
          {saveLabel}
        </span>
      </div>
      <button
        className="shrink-0 pl-4 text-[15px] text-slate-700"
        type="button"
      >
        Cancel
      </button>
    </div>
  );
}

function InspectorBody({ children }: { children: ReactNode }) {
  return <div className="space-y-8 px-4 py-5">{children}</div>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-white/8 px-4 py-4">
      <p className="text-[15px] font-medium tracking-[-0.01em] text-slate-400">
        {children}
      </p>
    </div>
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
      <span className="text-[15px] text-white">{label}</span>
      <button
        className={`flex h-8 w-11 items-center rounded-full p-1 transition ${checked ? "bg-[#ea71e6]" : "bg-[#313131]"}`}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span
          className={`h-6 w-6 rounded-full bg-white transition ${checked ? "translate-x-3" : ""}`}
        />
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
      <span className="text-[15px] text-white">Aspect Ratio</span>
      <select
        className="mt-4 h-12 w-full rounded-[8px] border border-white/8 bg-[#181818] px-4 text-[15px] text-white outline-none"
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

function InspectorToolbar() {
  return (
    <div className="flex items-center gap-3 border-b border-white/8 px-4 py-4">
      <AvatarButton compact />
      <RoundButton compact>
        <HeadphoneIcon />
      </RoundButton>
      <GhostButton compact>
        <TranslateIcon />
        <span>Translate</span>
      </GhostButton>
      <PrimaryButton compact>Share</PrimaryButton>
    </div>
  );
}

function ProjectMark({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-[10px] border border-white/8 bg-[#171717] text-slate-500">
      {children}
    </span>
  );
}

function AvatarButton({ compact }: { compact?: boolean }) {
  const sizeClass = compact
    ? "h-10 w-10 rounded-[10px] text-[18px]"
    : "h-12 w-12 rounded-[12px] text-[22px]";
  return (
    <button
      className={`grid place-items-center border border-[#4668ff]/50 bg-[#3a63f3] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ${sizeClass}`}
      type="button"
    >
      R
    </button>
  );
}

function RoundButton({
  active,
  children,
  compact,
  disabled,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  compact?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const sizeClass = compact
    ? "h-10 w-10 rounded-[10px]"
    : "h-12 w-12 rounded-[12px]";
  return (
    <button
      className={`grid place-items-center border border-white/8 text-[17px] transition ${sizeClass} ${active ? "bg-[#3b67f4] text-white" : "bg-[#1b1b1b] text-slate-300"} disabled:opacity-40`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  const sizeClass = compact
    ? "h-10 rounded-[10px] px-4 text-[15px]"
    : "h-12 rounded-[12px] px-5 text-[16px]";
  return (
    <button
      className={`flex items-center gap-2 border border-white/8 bg-[#1b1b1b] text-slate-300 ${sizeClass}`}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  const sizeClass = compact
    ? "h-10 rounded-[10px] px-4 text-[15px]"
    : "h-12 rounded-[12px] px-6 text-[16px]";
  return (
    <button
      className={`bg-[#9b448f] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${sizeClass}`}
    >
      {children}
    </button>
  );
}
