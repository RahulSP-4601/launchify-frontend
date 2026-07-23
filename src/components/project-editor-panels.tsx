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
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <ProjectCompactGroup project={project} />
      <div className="flex shrink-0 items-center gap-[10px]">
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
    </header>
  );
}

export function EditorInspector({
  draft,
  onAspectRatioChange,
  onToggleCaptions,
  selectedScene,
}: {
  draft: ProjectEditorDraft;
  onAspectRatioChange: (aspectRatio: EditorAspectRatio) => void;
  onToggleCaptions: (value: boolean) => void;
  selectedScene: EditorSceneDraft | null;
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-[8px] border border-white/7 bg-[#221f1f]">
      <InspectorToolbar />
      <InspectorSection title="Project">
        <ToggleRow checked={draft.showCaptions} label="Show Transcript" onChange={onToggleCaptions} />
      </InspectorSection>
      <InspectorSection title="Aspect Ratio">
        <AspectRatioField aspectRatio={draft.aspectRatio} onChange={onAspectRatioChange} />
      </InspectorSection>
      <InspectorSection title="Selected Scene">
        <SceneDetails scene={selectedScene} />
      </InspectorSection>
    </aside>
  );
}

function ProjectCompactGroup({ project }: { project: ProjectDetail }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex min-w-0 items-center gap-2 rounded-[8px] border border-white/7 bg-[#1d1d1d] px-2.5 py-2">
        <span className="grid h-8 w-8 place-items-center rounded-[6px] border border-white/8 bg-[#161616] text-[#747474]">
          <CloudArrowIcon />
        </span>
        <p className="max-w-[320px] truncate text-[14px] font-medium text-[#f0f0f0]">{project.project_name}</p>
        <button className="text-[#7f7f7f] transition hover:text-white" type="button">
          <CloudArrowIcon />
        </button>
      </div>
      <ViewSwitcher />
    </div>
  );
}

function ViewSwitcher() {
  return (
    <div className="flex items-center rounded-[8px] border border-white/7 bg-[#1d1d1d] p-1 text-[13px] text-[#838383]">
      <span className="rounded-[6px] bg-[#2b2b2b] px-5 py-1.5 text-[#f0f0f0]">Video</span>
      <span className="px-5 py-1.5">Article</span>
    </div>
  );
}

function SaveStatusPill({ label }: { label: string }) {
  const isPending = label.toLowerCase().includes("saving");
  return (
    <div className={`flex h-[52px] min-w-[318px] items-center justify-between rounded-[10px] px-4 ${isPending ? "bg-[#f5f2f0] text-[#1d1d1d]" : "bg-[#262626] text-[#f0f0f0]"}`}>
      <div className="flex min-w-0 items-center gap-3">
        {isPending ? <SpinnerIcon /> : <CloudArrowIcon />}
        <span className="truncate text-[14px] font-medium">{label}</span>
      </div>
      {isPending ? <span className="text-[14px] text-[#494949]">In progress</span> : null}
    </div>
  );
}

function InspectorToolbar() {
  return (
    <div className="flex items-center gap-2 border-b border-white/7 px-4 py-2.5">
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
    <section className="border-b border-white/7 px-4 py-5 last:border-b-0">
      <p className="text-[12px] font-medium text-[#dedede]">{title}</p>
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
        className="h-[48px] w-full rounded-[6px] border border-white/8 bg-[#1a1a1a] px-3 text-[14px] text-[#ededed] outline-none"
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
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#727272]">{`Scene ${scene.sceneNumber}`}</p>
        <p className="mt-1 text-[16px] font-medium text-white">{scene.title}</p>
      </div>
      <p className="line-clamp-5">{scene.spokenLine}</p>
      <p className="text-[#8f8f8f]">{`${scene.start.toFixed(1)}s - ${scene.end.toFixed(1)}s`}</p>
    </div>
  );
}

function AvatarButton({ compact }: { compact?: boolean }) {
  const shape = compact ? "h-10 w-10 rounded-[6px] text-[18px]" : "h-10 w-10 rounded-[8px] text-[18px]";
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
  const shape = compact ? "h-10 w-10 rounded-[6px]" : "h-10 w-10 rounded-[8px]";
  return (
    <button
      className={`grid place-items-center border border-white/8 bg-[#1d1d1d] text-[#bdbdbd] transition hover:text-white disabled:opacity-40 ${shape}`}
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
  const shape = compact ? "h-10 rounded-[6px] px-3 text-[14px]" : "h-10 rounded-[8px] px-4 text-[14px]";
  return <button className={`flex items-center gap-2 border border-white/8 bg-[#1d1d1d] text-[#d1d1d1] ${shape}`}>{children}</button>;
}

function ShareButton({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  const shape = compact ? "h-10 rounded-[6px] px-4 text-[14px]" : "h-10 rounded-[8px] px-5 text-[14px]";
  return <button className={`bg-[#91458a] font-medium text-white ${shape}`}>{children}</button>;
}
