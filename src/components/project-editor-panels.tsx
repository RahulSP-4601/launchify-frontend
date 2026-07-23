"use client";

import type { ReactNode } from "react";

import type { EditorAspectRatio, EditorSceneDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
import {
  CloudArrowIcon,
  FileDocIcon,
  HeadphoneIcon,
  RedoIcon,
  SpinnerIcon,
  TranslateIcon,
  UndoIcon,
} from "@/components/project-editor-icons";
export { EditorLeftPanel, EditorRail } from "@/components/project-editor-left-panel";
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
    <header className="flex items-center justify-between gap-6">
      <HeaderGroup project={project} />
      <ActionGroup canRedo={canRedo} canUndo={canUndo} onRedo={onRedo} onUndo={onUndo} saveLabel={saveLabel} />
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
    <aside className="flex h-full min-h-0 flex-col rounded-[12px] bg-[#1d1d1d]">
      <SectionTitle>Project</SectionTitle>
      <InspectorBody>
        <ToggleRow checked={draft.showCaptions} label="Show Transcript" onChange={onToggleCaptions} />
        <AspectRatioField aspectRatio={draft.aspectRatio} onChange={onAspectRatioChange} />
      </InspectorBody>
    </aside>
  );
}

function HeaderGroup({ project }: { project: ProjectDetail }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <TitleChip projectName={project.project_name} />
      <SegmentedView />
    </div>
  );
}

function TitleChip({ projectName }: { projectName: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[12px] border border-white/8 bg-[#1f1f1f] px-4 py-3">
      <IconPlate>
        <FileDocIcon />
      </IconPlate>
      <p className="truncate text-[17px] font-medium text-white">{projectName}</p>
      <button className="text-slate-500 transition hover:text-slate-300" type="button">
        <CloudArrowIcon />
      </button>
    </div>
  );
}

function SegmentedView() {
  return (
    <div className="flex items-center rounded-[12px] border border-white/8 bg-[#1b1b1b] p-1 text-[15px] text-slate-500">
      <span className="rounded-[10px] bg-[#2a2a2a] px-6 py-2.5 text-white">Video</span>
      <span className="px-6 py-2.5">Article</span>
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
    <div className="flex shrink-0 items-center gap-3">
      <SavePill saveLabel={saveLabel} />
      <RoundButton active>R</RoundButton>
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
    <div className="flex min-w-[410px] items-center justify-between rounded-[14px] bg-white px-5 py-3.5 text-black shadow-[0_8px_30px_rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-3">
        <SpinnerIcon />
        <span className="text-[17px] font-medium">{saveLabel}</span>
      </div>
      <button className="text-[16px] text-slate-700" type="button">
        Cancel
      </button>
    </div>
  );
}

function InspectorBody({ children }: { children: ReactNode }) {
  return <div className="space-y-8 px-4 py-4">{children}</div>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-white/8 px-4 py-4">
      <p className="text-[15px] font-medium text-slate-400">{children}</p>
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
        className={`flex h-8 w-11 items-center rounded-full p-1 transition ${checked ? "bg-[#ef72ea]" : "bg-[#313131]"}`}
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

function IconPlate({ children }: { children: ReactNode }) {
  return <span className="grid h-8 w-8 place-items-center rounded-[8px] border border-white/8 text-slate-500">{children}</span>;
}

function RoundButton({
  active,
  children,
  disabled,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`grid h-12 w-12 place-items-center rounded-[12px] border border-white/8 text-[17px] transition ${active ? "bg-[#3b67f4] text-white" : "bg-[#1b1b1b] text-slate-300"} disabled:opacity-40`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function GhostButton({ children }: { children: ReactNode }) {
  return <button className="flex h-12 items-center gap-2 rounded-[12px] border border-white/8 bg-[#1b1b1b] px-5 text-[16px] text-slate-300">{children}</button>;
}

function PrimaryButton({ children }: { children: ReactNode }) {
  return <button className="h-12 rounded-[12px] bg-[#97438f] px-6 text-[16px] font-medium text-white">{children}</button>;
}
