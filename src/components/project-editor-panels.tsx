"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  EditorAspectRatio,
  EditorSceneDraft,
  ProjectEditorDraft,
  sceneDuration,
} from "@/components/project-editor-draft";
import { StatusBadge } from "@/components/workspace-home";
import { ProjectDetail } from "@/lib/types";

type EditorTab = "script" | "captions" | "scenes";

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
    <header className="flex flex-col gap-3 rounded-[22px] border border-white/8 bg-[#1b1b1b] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Link className="rounded-[14px] border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300" href="/">
          Projects
        </Link>
        <div className="min-w-0 rounded-[14px] border border-white/8 bg-[#232323] px-4 py-3">
          <p className="truncate text-lg font-semibold text-white">{project.project_name}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <HistoryButton disabled={!canUndo} label="Undo" onClick={onUndo} />
        <HistoryButton disabled={!canRedo} label="Redo" onClick={onRedo} />
        <StatusBadge status={project.status} />
        <span className="rounded-[14px] border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-200">
          {saveLabel}
        </span>
        <button className="rounded-[14px] border border-white/10 px-4 py-2 text-sm font-medium text-slate-200" type="button">
          Share
        </button>
        <button className="rounded-[14px] bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white" type="button">
          Export video
        </button>
      </div>
    </header>
  );
}

export function EditorRail({
  activeTab,
  setActiveTab,
}: {
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;
}) {
  return (
    <aside className="rounded-[22px] border border-white/8 bg-[#1b1b1b] p-2">
      <div className="space-y-2">
        {[
          { id: "script", label: "Script", short: "S" },
          { id: "captions", label: "Captions", short: "C" },
          { id: "scenes", label: "Scenes", short: "T" },
        ].map((item) => (
          <button
            key={item.id}
            className={`grid h-12 w-12 place-items-center rounded-[14px] text-sm font-semibold transition ${
              activeTab === item.id ? "bg-white text-slate-950" : "bg-[#232323] text-slate-300 hover:bg-[#2b2b2b]"
            }`}
            onClick={() => setActiveTab(item.id as EditorTab)}
            title={item.label}
            type="button"
          >
            {item.short}
          </button>
        ))}
      </div>
    </aside>
  );
}

export function EditorLeftPanel({
  activeTab,
  draft,
  onCaptionSelect,
  onCaptionUpdate,
  onMoveScene,
  onRegenerateScene,
  onSceneSelect,
  onSceneUpdate,
  regeneratePending,
}: {
  activeTab: EditorTab;
  draft: ProjectEditorDraft;
  onCaptionSelect: (sceneId: string) => void;
  onCaptionUpdate: (captionId: string, text: string) => void;
  onMoveScene: (sceneId: string, direction: "backward" | "forward") => void;
  onRegenerateScene: (sceneId: string) => void;
  onSceneSelect: (sceneId: string) => void;
  onSceneUpdate: (sceneId: string, patch: Partial<EditorSceneDraft>) => void;
  regeneratePending: boolean;
}) {
  return (
    <section className="rounded-[22px] border border-white/8 bg-[#1f1f1f] p-3">
      <EditorPanelHeader activeTab={activeTab} />
      {activeTab === "script" ? (
        <ScriptEditorList
          draft={draft}
          onRegenerateScene={onRegenerateScene}
          onSceneSelect={onSceneSelect}
          onSceneUpdate={onSceneUpdate}
          regeneratePending={regeneratePending}
        />
      ) : null}
      {activeTab === "captions" ? (
        <CaptionEditorList draft={draft} onCaptionSelect={onCaptionSelect} onCaptionUpdate={onCaptionUpdate} />
      ) : null}
      {activeTab === "scenes" ? (
        <SceneEditorList draft={draft} onMoveScene={onMoveScene} onSceneSelect={onSceneSelect} />
      ) : null}
    </section>
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
    <aside className="rounded-[22px] border border-white/8 bg-[#1f1f1f] p-4">
      <InspectorSection label="Project">
        <ToggleRow checked={draft.showCaptions} label="Show captions" onChange={onToggleCaptions} />
        <AspectRatioField aspectRatio={draft.aspectRatio} onChange={onAspectRatioChange} />
      </InspectorSection>
      <InspectorSection label="Selected scene">
        {selectedScene ? (
          <SelectedSceneFields
            onRegenerateScene={onRegenerateScene}
            onSceneUpdate={onSceneUpdate}
            regeneratePending={regeneratePending}
            selectedScene={selectedScene}
          />
        ) : (
          <p className="text-sm leading-7 text-slate-400">Select a scene on the left or timeline to tune its copy and timing.</p>
        )}
      </InspectorSection>
    </aside>
  );
}

function HistoryButton({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="rounded-[14px] border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 disabled:opacity-40" disabled={disabled} onClick={onClick} type="button">
      {label}
    </button>
  );
}

function EditorPanelHeader({ activeTab }: { activeTab: EditorTab }) {
  const title = activeTab === "script" ? "Script rewrite" : activeTab === "captions" ? "Caption pass" : "Scene order";
  return (
    <div className="mb-3 rounded-[18px] border border-white/8 bg-[#171717] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{title}</p>
    </div>
  );
}

function ScriptEditorList({
  draft,
  onRegenerateScene,
  onSceneSelect,
  onSceneUpdate,
  regeneratePending,
}: {
  draft: ProjectEditorDraft;
  onRegenerateScene: (sceneId: string) => void;
  onSceneSelect: (sceneId: string) => void;
  onSceneUpdate: (sceneId: string, patch: Partial<EditorSceneDraft>) => void;
  regeneratePending: boolean;
}) {
  return (
    <div className="space-y-3 overflow-y-auto pr-1">
      {draft.scenes.map((scene) => (
        <article key={scene.id} className="rounded-[18px] border border-white/8 bg-[#171717] p-4">
          <button className="w-full text-left" onClick={() => onSceneSelect(scene.id)} type="button">
            <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-200">Scene {scene.sceneNumber}</p>
          </button>
          <input className="mt-3 w-full bg-transparent text-lg font-semibold outline-none" onChange={(event) => onSceneUpdate(scene.id, { title: event.target.value })} value={scene.title} />
          <textarea className="mt-3 min-h-24 w-full rounded-[14px] border border-white/8 bg-[#222] px-3 py-3 text-sm leading-7 text-slate-100 outline-none" onChange={(event) => onSceneUpdate(scene.id, { spokenLine: event.target.value })} value={scene.spokenLine} />
          <textarea className="mt-3 min-h-20 w-full rounded-[14px] border border-white/8 bg-[#222] px-3 py-3 text-sm leading-7 text-slate-300 outline-none" onChange={(event) => onSceneUpdate(scene.id, { onScreenText: event.target.value })} value={scene.onScreenText} />
          <button className="mt-3 rounded-[12px] border border-fuchsia-400/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-200 disabled:opacity-40" disabled={regeneratePending} onClick={() => onRegenerateScene(scene.id)} type="button">
            Restore AI scene
          </button>
        </article>
      ))}
    </div>
  );
}

function CaptionEditorList({
  draft,
  onCaptionSelect,
  onCaptionUpdate,
}: {
  draft: ProjectEditorDraft;
  onCaptionSelect: (sceneId: string) => void;
  onCaptionUpdate: (captionId: string, text: string) => void;
}) {
  return (
    <div className="space-y-3 overflow-y-auto pr-1">
      {draft.captions.map((caption) => (
        <article key={caption.id} className="rounded-[18px] border border-white/8 bg-[#171717] p-4">
          <button className="w-full text-left" onClick={() => caption.sceneId ? onCaptionSelect(caption.sceneId) : undefined} type="button">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{formatRange(caption.start, caption.end)}</p>
          </button>
          <textarea className="mt-3 min-h-20 w-full rounded-[14px] border border-white/8 bg-[#222] px-3 py-3 text-sm leading-7 text-slate-100 outline-none" onChange={(event) => onCaptionUpdate(caption.id, event.target.value)} value={caption.text} />
        </article>
      ))}
    </div>
  );
}

function SceneEditorList({
  draft,
  onMoveScene,
  onSceneSelect,
}: {
  draft: ProjectEditorDraft;
  onMoveScene: (sceneId: string, direction: "backward" | "forward") => void;
  onSceneSelect: (sceneId: string) => void;
}) {
  return (
    <div className="space-y-3 overflow-y-auto pr-1">
      {draft.scenes.map((scene, index) => (
        <article key={scene.id} className="rounded-[18px] border border-white/8 bg-[#171717] p-4">
          <button className="w-full text-left" onClick={() => onSceneSelect(scene.id)} type="button">
            <p className="text-lg font-semibold text-white">{scene.title}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">{formatRange(scene.start, scene.end)}</p>
          </button>
          <div className="mt-4 flex items-center gap-2">
            <button className="rounded-[12px] border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-30" disabled={index === 0} onClick={() => onMoveScene(scene.id, "backward")} type="button">
              Move up
            </button>
            <button className="rounded-[12px] border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-30" disabled={index === draft.scenes.length - 1} onClick={() => onMoveScene(scene.id, "forward")} type="button">
              Move down
            </button>
          </div>
        </article>
      ))}
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
    <section className="border-b border-white/8 pb-5 pt-2 last:border-b-0">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <div className="mt-4 space-y-4">{children}</div>
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
      <span className="text-sm text-slate-200">{label}</span>
      <button className={`flex h-8 w-14 items-center rounded-full p-1 transition ${checked ? "bg-fuchsia-500" : "bg-[#2c2c2c]"}`} onClick={() => onChange(!checked)} type="button">
        <span className={`h-6 w-6 rounded-full bg-white transition ${checked ? "translate-x-6" : ""}`} />
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
      <span className="text-sm text-slate-300">Aspect ratio</span>
      <select className="mt-2 w-full rounded-[14px] border border-white/10 bg-[#171717] px-3 py-3 text-sm text-white outline-none" onChange={(event) => onChange(event.target.value as EditorAspectRatio)} value={aspectRatio}>
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
      <input className="w-full rounded-[14px] border border-white/10 bg-[#171717] px-3 py-3 text-sm text-white outline-none" onChange={(event) => onSceneUpdate(selectedScene.id, { title: event.target.value })} value={selectedScene.title} />
      <NumericSceneField label="Start" onChange={(value) => onSceneUpdate(selectedScene.id, { start: Math.min(value, selectedScene.end - 0.5) })} value={selectedScene.start} />
      <NumericSceneField label="End" onChange={(value) => onSceneUpdate(selectedScene.id, { end: Math.max(value, selectedScene.start + 0.5) })} value={selectedScene.end} />
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Duration {sceneDuration(selectedScene).toFixed(1)}s</p>
      <button className="rounded-[12px] border border-fuchsia-400/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-200 disabled:opacity-40" disabled={regeneratePending} onClick={() => onRegenerateScene(selectedScene.id)} type="button">
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
      <span className="text-sm text-slate-300">{label}</span>
      <input className="mt-2 w-full rounded-[14px] border border-white/10 bg-[#171717] px-3 py-3 text-sm text-white outline-none" min={0} onChange={(event) => onChange(Number(event.target.value) || 0)} step={0.1} type="number" value={value.toFixed(1)} />
    </label>
  );
}

function formatRange(start: number, end: number) {
  return `${formatClock(start)} - ${formatClock(end)}`;
}

function formatClock(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}
