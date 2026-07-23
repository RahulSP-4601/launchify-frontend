"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { EditorAspectRatio, EditorSceneDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
import {
  HeadphoneIcon,
  RedoIcon,
  SparkIcon,
  SpinnerIcon,
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
    <header className="flex items-start justify-between gap-6">
      <TopBarProject project={project} />
      <TopBarActions canRedo={canRedo} canUndo={canUndo} onRedo={onRedo} onUndo={onUndo} saveLabel={saveLabel} status={project.status} />
    </header>
  );
}

export function EditorInspector({
  draft,
  onAspectRatioChange,
  onRegenerateScene,
  onSceneUpdate,
  onToggleCaptions,
  regeneratePending,
  selectedScene,
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
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-white/6 bg-[#1b1b1b]">
      <InspectorTopBar />
      <InspectorSection label="Project">
        <ToggleRow checked={draft.showCaptions} label="Show Transcript" onChange={onToggleCaptions} />
        <AspectRatioField aspectRatio={draft.aspectRatio} onChange={onAspectRatioChange} />
      </InspectorSection>
      <InspectorSection label="Selected Scene">
        {selectedScene ? (
          <SelectedSceneFields onRegenerateScene={onRegenerateScene} onSceneUpdate={onSceneUpdate} regeneratePending={regeneratePending} selectedScene={selectedScene} />
        ) : (
          <p className="text-sm leading-7 text-slate-500">Pick a scene on the left or timeline to edit timing and copy.</p>
        )}
      </InspectorSection>
    </aside>
  );
}

function TopBarProject({ project }: { project: ProjectDetail }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 rounded-[16px] border border-white/8 bg-[#1d1d1d] px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.24)]">
        <button className="grid h-8 w-8 place-items-center rounded-[10px] border border-white/8 text-slate-400" type="button">
          <SparkIcon />
        </button>
        <p className="truncate text-[15px] font-medium text-white">{project.project_name}</p>
      </div>
      <div className="flex items-center rounded-[14px] border border-white/8 bg-[#1a1a1a] p-1 text-sm text-slate-400">
        <span className="rounded-[10px] bg-[#262626] px-4 py-2 text-white">Video</span>
        <span className="px-4 py-2">Article</span>
      </div>
      <Link className="hidden rounded-[14px] border border-white/8 px-4 py-3 text-sm text-slate-400 xl:block" href="/">
        Projects
      </Link>
    </div>
  );
}

function TopBarActions({
  canRedo,
  canUndo,
  onRedo,
  onUndo,
  saveLabel,
  status,
}: {
  canRedo: boolean;
  canUndo: boolean;
  onRedo: () => void;
  onUndo: () => void;
  saveLabel: string;
  status: ProjectDetail["status"];
}) {
  return (
    <div className="flex items-center gap-3">
      <TopBarStatusPill saveLabel={saveLabel} />
      <span className="rounded-[12px] bg-[#2f5ef7] px-4 py-3 text-sm font-semibold text-white">{status === "ready" ? "R" : status.slice(0, 1).toUpperCase()}</span>
      <button className="grid h-11 w-11 place-items-center rounded-[12px] border border-white/8 bg-[#1d1d1d] text-slate-300" type="button">R</button>
      <button className="grid h-11 w-11 place-items-center rounded-[12px] border border-white/8 bg-[#151515] text-slate-400" onClick={onUndo} disabled={!canUndo} type="button">
        <UndoIcon />
      </button>
      <button className="grid h-11 w-11 place-items-center rounded-[12px] border border-white/8 bg-[#151515] text-slate-400" onClick={onRedo} disabled={!canRedo} type="button">
        <RedoIcon />
      </button>
      <button className="rounded-[12px] border border-white/8 bg-[#171717] px-4 py-3 text-sm text-slate-300" type="button">Translate</button>
      <button className="rounded-[12px] bg-[#8d3f82] px-4 py-3 text-sm font-semibold text-white" type="button">Share</button>
    </div>
  );
}

function TopBarStatusPill({ saveLabel }: { saveLabel: string }) {
  return (
    <div className="flex min-w-[280px] items-center justify-between rounded-[14px] bg-white px-4 py-3 text-black shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
      <div className="flex items-center gap-3">
        <SpinnerIcon />
        <span className="text-sm font-medium">{saveLabel}</span>
      </div>
      <button className="text-sm text-slate-700" type="button">Cancel</button>
    </div>
  );
}

function InspectorTopBar() {
  return (
    <div className="flex items-center justify-between border-b border-white/6 px-4 py-4">
      <div className="flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#3167f2] text-sm font-semibold text-white">R</span>
        <button className="grid h-10 w-10 place-items-center rounded-[10px] border border-white/8 text-slate-300" type="button">
          <HeadphoneIcon />
        </button>
      </div>
      <button className="rounded-[10px] bg-[#8d3f82] px-4 py-2 text-sm font-medium text-white" type="button">Share</button>
    </div>
  );
}

function InspectorSection({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <section className="border-b border-white/6 px-4 py-5 last:min-h-0 last:flex-1 last:overflow-y-auto last:border-b-0">
      <p className="text-[15px] font-medium text-slate-300">{label}</p>
      <div className="mt-5 space-y-5">{children}</div>
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
      <span className="text-[15px] text-slate-300">{label}</span>
      <button className={`flex h-8 w-11 items-center rounded-full p-1 ${checked ? "bg-[#e35de0]" : "bg-[#2d2d2d]"}`} onClick={() => onChange(!checked)} type="button">
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
      <span className="text-sm text-slate-400">Aspect Ratio</span>
      <select className="mt-3 w-full rounded-[10px] border border-white/8 bg-[#1a1a1a] px-4 py-3 text-sm text-white outline-none" onChange={(event) => onChange(event.target.value as EditorAspectRatio)} value={aspectRatio}>
        <option value="16:9">Landscape 16:9</option>
        <option value="9:16">Vertical 9:16</option>
        <option value="1:1">Square 1:1</option>
      </select>
    </label>
  );
}

function SelectedSceneFields({
  onRegenerateScene,
  onSceneUpdate,
  regeneratePending,
  selectedScene,
}: {
  onRegenerateScene: (sceneId: string) => void;
  onSceneUpdate: (sceneId: string, patch: Partial<EditorSceneDraft>) => void;
  regeneratePending: boolean;
  selectedScene: EditorSceneDraft;
}) {
  return (
    <>
      <textarea className="min-h-28 w-full rounded-[12px] border border-white/8 bg-[#171717] px-4 py-4 text-sm leading-7 text-white outline-none" onChange={(event) => onSceneUpdate(selectedScene.id, { spokenLine: event.target.value })} value={selectedScene.spokenLine} />
      <NumericSceneField label="Start" onChange={(value) => onSceneUpdate(selectedScene.id, { start: Math.min(value, selectedScene.end - 0.5) })} value={selectedScene.start} />
      <NumericSceneField label="End" onChange={(value) => onSceneUpdate(selectedScene.id, { end: Math.max(value, selectedScene.start + 0.5) })} value={selectedScene.end} />
      <button className="rounded-[12px] border border-fuchsia-400/30 px-4 py-3 text-sm font-medium text-fuchsia-200 disabled:opacity-40" disabled={regeneratePending} onClick={() => onRegenerateScene(selectedScene.id)} type="button">
        Restore AI scene
      </button>
    </>
  );
}

function NumericSceneField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-400">{label}</span>
      <input className="mt-3 w-full rounded-[10px] border border-white/8 bg-[#171717] px-4 py-3 text-sm text-white outline-none" min={0} onChange={(event) => onChange(Number(event.target.value) || 0)} step={0.1} type="number" value={value.toFixed(1)} />
    </label>
  );
}
