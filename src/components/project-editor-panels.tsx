"use client";

import Link from "next/link";
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
    <header className="flex items-center justify-between gap-4 rounded-[14px] bg-[#121212]">
      <ProjectGroup project={project} />
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
    <aside className="flex min-h-0 flex-col rounded-[14px] border border-white/6 bg-[#1f1f1f]">
      <InspectorHeader />
      <InspectorSection title="Project">
        <ToggleRow checked={draft.showCaptions} label="Show Transcript" onChange={onToggleCaptions} />
        <AspectRatioField aspectRatio={draft.aspectRatio} onChange={onAspectRatioChange} />
      </InspectorSection>
      <div className="flex-1 border-t border-white/6" />
    </aside>
  );
}

function ProjectGroup({ project }: { project: ProjectDetail }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex min-w-0 items-center gap-3 rounded-[12px] border border-white/8 bg-[#202020] px-3 py-2.5">
        <button className="grid h-8 w-8 place-items-center rounded-[8px] border border-white/8 text-slate-500" type="button">
          <FileDocIcon />
        </button>
        <p className="truncate text-[15px] font-medium text-white">{project.project_name}</p>
        <button className="grid h-8 w-8 place-items-center rounded-[8px] text-slate-500" type="button">
          <CloudArrowIcon />
        </button>
      </div>
      <div className="flex items-center rounded-[12px] border border-white/8 bg-[#1e1e1e] p-1 text-[15px] text-slate-500">
        <span className="rounded-[8px] bg-[#2a2a2a] px-4 py-2 text-white">Video</span>
        <span className="px-4 py-2">Article</span>
      </div>
      <Link className="hidden rounded-[12px] border border-white/8 px-4 py-2.5 text-[15px] text-slate-400 xl:block" href="/">
        Projects
      </Link>
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
    <div className="flex items-center gap-3">
      <SavePill saveLabel={saveLabel} />
      <TopSquare active>R</TopSquare>
      <TopSquare><HeadphoneIcon /></TopSquare>
      <TopSquare disabled={!canUndo} onClick={onUndo}><UndoIcon /></TopSquare>
      <TopSquare disabled={!canRedo} onClick={onRedo}><RedoIcon /></TopSquare>
      <GhostButton><TranslateIcon /><span>Translate</span></GhostButton>
      <PrimaryButton>Share</PrimaryButton>
    </div>
  );
}

function SavePill({ saveLabel }: { saveLabel: string }) {
  return (
    <div className="flex min-w-[318px] items-center justify-between rounded-[14px] bg-white px-4 py-3 text-black">
      <div className="flex items-center gap-3">
        <SpinnerIcon />
        <span className="text-[15px] font-medium">{saveLabel}</span>
      </div>
      <button className="text-[15px] text-slate-700" type="button">Cancel</button>
    </div>
  );
}

function InspectorHeader() {
  return (
    <div className="flex items-center justify-between border-b border-white/6 px-3 py-3">
      <div className="flex items-center gap-2">
        <TopSquare active>R</TopSquare>
        <TopSquare><HeadphoneIcon /></TopSquare>
      </div>
      <PrimaryButton>Share</PrimaryButton>
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
    <section className="px-4 py-4">
      <p className="text-[15px] font-medium text-slate-400">{title}</p>
      <div className="mt-6 space-y-8">{children}</div>
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-[15px] text-white">{label}</span>
      <button className={`flex h-8 w-12 items-center rounded-full p-1 ${checked ? "bg-[#e35de0]" : "bg-[#2b2b2b]"}`} onClick={() => onChange(!checked)} type="button">
        <span className={`h-6 w-6 rounded-full bg-white transition ${checked ? "translate-x-4" : ""}`} />
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
      <select className="mt-4 h-11 w-full rounded-[8px] border border-white/8 bg-[#181818] px-4 text-[15px] text-white outline-none" onChange={(event) => onChange(event.target.value as EditorAspectRatio)} value={aspectRatio}>
        <option value="16:9">Landscape 16:9</option>
        <option value="9:16">Vertical 9:16</option>
        <option value="1:1">Square 1:1</option>
      </select>
    </label>
  );
}

function TopSquare({
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
  return <button className={`grid h-11 w-11 place-items-center rounded-[12px] border border-white/8 text-[15px] ${active ? "bg-[#3564f3] text-white" : "bg-[#1a1a1a] text-slate-300"} disabled:opacity-40`} disabled={disabled} onClick={onClick} type="button">{children}</button>;
}

function GhostButton({ children }: { children: ReactNode }) {
  return <button className="flex h-11 items-center gap-2 rounded-[12px] border border-white/8 bg-[#1a1a1a] px-4 text-[15px] text-slate-300" type="button">{children}</button>;
}

function PrimaryButton({ children }: { children: ReactNode }) {
  return <button className="h-11 rounded-[12px] bg-[#8d3f82] px-5 text-[15px] font-medium text-white" type="button">{children}</button>;
}
