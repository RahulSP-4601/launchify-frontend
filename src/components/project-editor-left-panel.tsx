"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { EditorCaptionDraft, EditorSceneDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
import {
  CcIcon,
  CommentIcon,
  CursorIcon,
  FilterIcon,
  FxIcon,
  GridIcon,
  PointerIcon,
  SplitIcon,
  SquareIcon,
  TypeIcon,
  VideoTextIcon,
  WaveIcon,
} from "@/components/project-editor-icons";

type EditorTab = "script" | "captions" | "scenes";

export function EditorRail({
  activeTab,
  setActiveTab,
}: {
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;
}) {
  return (
    <aside className="rounded-[14px] border border-white/6 bg-[#151515] p-2">
      <div className="flex flex-col gap-3">
        {toolbarItems().map((item) => (
          <ToolbarButton key={item.label} active={activeTab === item.id} label={item.label} onClick={() => setActiveTab(item.id)}>
            {item.icon}
          </ToolbarButton>
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
  selectedSceneId,
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
  selectedSceneId: string;
}) {
  const [query, setQuery] = useState("");
  const scenes = useMemo(() => filterScenes(draft.scenes, query), [draft.scenes, query]);
  return (
    <section className="flex min-h-0 flex-col rounded-[14px] border border-white/6 bg-[#1a1a1a] p-3">
      <SearchHeader query={query} setQuery={setQuery} />
      <ModeHeader activeTab={activeTab} />
      <PanelScroller>
        {activeTab === "script" ? <TranscriptList captions={draft.captions} onSceneSelect={onSceneSelect} scenes={scenes} selectedSceneId={selectedSceneId} /> : null}
        {activeTab === "captions" ? <CaptionList captions={draft.captions} onCaptionSelect={onCaptionSelect} onCaptionUpdate={onCaptionUpdate} /> : null}
        {activeTab === "scenes" ? <SceneList onMoveScene={onMoveScene} onRegenerateScene={onRegenerateScene} onSceneSelect={onSceneSelect} onSceneUpdate={onSceneUpdate} regeneratePending={regeneratePending} scenes={scenes} /> : null}
      </PanelScroller>
      <PanelFooter onRegenerateScene={() => onRegenerateScene(selectedSceneId)} regeneratePending={regeneratePending} />
    </section>
  );
}

function SearchHeader({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex h-10 flex-1 items-center rounded-[10px] border border-white/8 bg-[#171717] px-4">
        <input className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-slate-500" onChange={(event) => setQuery(event.target.value)} placeholder="Search in transcript" value={query} />
      </label>
      <button className="grid h-10 w-10 place-items-center rounded-[10px] border border-white/8 bg-[#171717] text-slate-500" type="button">
        <FilterIcon />
      </button>
    </div>
  );
}

function ModeHeader({ activeTab }: { activeTab: EditorTab }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-[#161616] p-3 text-[15px] text-slate-400">
      <span className="rounded-[8px] border border-white/10 bg-[#232323] px-3 py-1 text-white">1</span>
      <span className="rounded-[8px] border border-white/10 px-3 py-1">Video</span>
      <span className="rounded-[8px] border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-fuchsia-200">{panelLabel(activeTab)}</span>
      <button className="ml-auto grid h-8 w-8 place-items-center rounded-[8px] border border-white/8 text-slate-500" type="button">
        <WaveIcon />
      </button>
    </div>
  );
}

function PanelScroller({ children }: { children: ReactNode }) {
  return <div className="mt-3 min-h-0 flex-1 overflow-y-auto">{children}</div>;
}

function TranscriptList({
  captions,
  onSceneSelect,
  scenes,
  selectedSceneId,
}: {
  captions: EditorCaptionDraft[];
  onSceneSelect: (sceneId: string) => void;
  scenes: EditorSceneDraft[];
  selectedSceneId: string;
}) {
  return (
    <div className="rounded-[12px] border border-white/6 bg-[#1b1b1b] px-3 py-4">
      {scenes.map((scene) => (
        <TranscriptBlock key={scene.id} active={scene.id === selectedSceneId} captions={captions.filter((caption) => caption.sceneId === scene.id)} onClick={() => onSceneSelect(scene.id)} scene={scene} />
      ))}
    </div>
  );
}

function CaptionList({
  captions,
  onCaptionSelect,
  onCaptionUpdate,
}: {
  captions: EditorCaptionDraft[];
  onCaptionSelect: (sceneId: string) => void;
  onCaptionUpdate: (captionId: string, text: string) => void;
}) {
  return (
    <div className="space-y-3">
      {captions.map((caption) => (
        <article key={caption.id} className="rounded-[12px] border border-white/6 bg-[#1b1b1b] p-3">
          <button className="text-xs uppercase tracking-[0.18em] text-slate-500" onClick={() => caption.sceneId ? onCaptionSelect(caption.sceneId) : undefined} type="button">
            {formatRange(caption.start, caption.end)}
          </button>
          <textarea className="mt-3 min-h-24 w-full resize-none bg-transparent text-sm leading-7 text-white outline-none" onChange={(event) => onCaptionUpdate(caption.id, event.target.value)} value={caption.text} />
        </article>
      ))}
    </div>
  );
}

function SceneList({
  onMoveScene,
  onRegenerateScene,
  onSceneSelect,
  onSceneUpdate,
  regeneratePending,
  scenes,
}: {
  onMoveScene: (sceneId: string, direction: "backward" | "forward") => void;
  onRegenerateScene: (sceneId: string) => void;
  onSceneSelect: (sceneId: string) => void;
  onSceneUpdate: (sceneId: string, patch: Partial<EditorSceneDraft>) => void;
  regeneratePending: boolean;
  scenes: EditorSceneDraft[];
}) {
  return (
    <div className="space-y-3">
      {scenes.map((scene, index) => (
        <article key={scene.id} className="rounded-[12px] border border-white/6 bg-[#1b1b1b] p-4">
          <button className="w-full text-left" onClick={() => onSceneSelect(scene.id)} type="button">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Scene {scene.sceneNumber}</p>
            <p className="mt-2 text-lg font-semibold text-white">{scene.title}</p>
          </button>
          <textarea className="mt-3 min-h-16 w-full resize-none bg-transparent text-sm leading-7 text-slate-300 outline-none" onChange={(event) => onSceneUpdate(scene.id, { spokenLine: event.target.value })} value={scene.spokenLine} />
          <div className="mt-3 flex flex-wrap gap-2">
            <GhostAction disabled={index === 0} label="Move up" onClick={() => onMoveScene(scene.id, "backward")} />
            <GhostAction disabled={index === scenes.length - 1} label="Move down" onClick={() => onMoveScene(scene.id, "forward")} />
            <GhostAction disabled={regeneratePending} label="Restore AI scene" onClick={() => onRegenerateScene(scene.id)} />
          </div>
        </article>
      ))}
    </div>
  );
}

function TranscriptBlock({
  active,
  captions,
  onClick,
  scene,
}: {
  active: boolean;
  captions: EditorCaptionDraft[];
  onClick: () => void;
  scene: EditorSceneDraft;
}) {
  return (
    <article className={`rounded-[10px] px-3 py-4 transition ${active ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"}`}>
      <button className="w-full text-left" onClick={onClick} type="button">
        <p className="text-[17px] leading-[2.15rem] text-white">{scene.spokenLine}</p>
      </button>
      <div className="mt-3 flex flex-wrap gap-2">
        {captions.slice(0, 3).map((caption, index) => (
          <span key={caption.id} className="rounded-[8px] border border-white/10 bg-[#242424] px-3 py-1 text-xs text-slate-300">
            Sync Point {index + 1}
          </span>
        ))}
      </div>
    </article>
  );
}

function PanelFooter({
  onRegenerateScene,
  regeneratePending,
}: {
  onRegenerateScene: () => void;
  regeneratePending: boolean;
}) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-4">
      <div className="flex items-center gap-2">
        <IconButton>...</IconButton>
        <IconButton>+</IconButton>
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-[10px] border border-white/8 bg-[#1d1d1d] px-4 py-3 text-sm text-slate-300" disabled={regeneratePending} onClick={onRegenerateScene} type="button">
          AI Rewrite
        </button>
        <button className="rounded-[10px] bg-white px-4 py-3 text-sm font-medium text-black" type="button">
          Regenerate speech
        </button>
      </div>
    </div>
  );
}

function GhostAction({
  disabled,
  label,
  onClick,
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return <button className="rounded-[10px] border border-white/8 px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-300 disabled:opacity-40" disabled={disabled} onClick={onClick} type="button">{label}</button>;
}

function IconButton({ children }: { children: ReactNode }) {
  return <button className="grid h-10 w-10 place-items-center rounded-[10px] border border-white/8 bg-[#1d1d1d] text-slate-300" type="button">{children}</button>;
}

function ToolbarButton({
  active,
  children,
  label,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return <button aria-label={label} className={`grid h-10 w-10 place-items-center rounded-[10px] transition ${active ? "bg-white text-black" : "bg-[#161616] text-slate-500 hover:text-slate-300"}`} onClick={onClick} type="button">{children}</button>;
}

function toolbarItems() {
  return [
    { id: "script" as const, label: "Script", icon: <CursorIcon /> },
    { id: "captions" as const, label: "Media", icon: <VideoTextIcon /> },
    { id: "scenes" as const, label: "Text", icon: <TypeIcon /> },
    { id: "scenes" as const, label: "Box", icon: <SquareIcon /> },
    { id: "scenes" as const, label: "Fx", icon: <FxIcon /> },
    { id: "scenes" as const, label: "Pointer", icon: <PointerIcon /> },
    { id: "scenes" as const, label: "Grid", icon: <GridIcon /> },
    { id: "scenes" as const, label: "Split", icon: <SplitIcon /> },
    { id: "captions" as const, label: "Closed Captions", icon: <CcIcon /> },
    { id: "scenes" as const, label: "Comments", icon: <CommentIcon /> },
  ];
}

function filterScenes(scenes: EditorSceneDraft[], query: string) {
  if (!query.trim()) return scenes;
  const normalized = query.toLowerCase();
  return scenes.filter((scene) => [scene.title, scene.spokenLine, scene.onScreenText].join(" ").toLowerCase().includes(normalized));
}

function panelLabel(activeTab: EditorTab) {
  if (activeTab === "captions") return "Caption Pass";
  if (activeTab === "scenes") return "Scene Order";
  return "Casual Mark";
}

function formatRange(start: number, end: number) {
  return `${formatClock(start)} - ${formatClock(end)}`;
}

function formatClock(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
}
