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
type RailTool = {
  icon: ReactNode;
  id: string;
  label: string;
  tab?: EditorTab;
};

export function EditorRail({
  activeTab,
  setActiveTab,
}: {
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;
}) {
  return (
    <aside className="flex h-full flex-col items-center rounded-[14px] border border-white/6 bg-[#171717] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="flex flex-col gap-3">
        {toolbarItems().map((item) => (
          <RailButton
            key={item.id}
            active={item.tab === activeTab}
            disabled={!item.tab}
            label={item.label}
            onClick={railButtonHandler(item, setActiveTab)}
          >
            {item.icon}
          </RailButton>
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
  const selectedScene = sceneForPanel(draft.scenes, selectedSceneId);
  const transcriptScene = transcriptSceneForPanel(query, scenes, selectedScene);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[14px] border border-white/6 bg-[#1d1d1d] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <SearchBar query={query} setQuery={setQuery} />
      <ModeBar activeTab={activeTab} />
      <PanelViewport>
        {activeTab === "script" ? <TranscriptPanel captions={draft.captions} onSceneSelect={onSceneSelect} scene={transcriptScene} /> : null}
        {activeTab === "captions" ? <CaptionPanel captions={draft.captions} onCaptionSelect={onCaptionSelect} onCaptionUpdate={onCaptionUpdate} /> : null}
        {activeTab === "scenes" ? <ScenePanel onMoveScene={onMoveScene} onRegenerateScene={onRegenerateScene} onSceneSelect={onSceneSelect} onSceneUpdate={onSceneUpdate} regeneratePending={regeneratePending} scenes={scenes} /> : null}
      </PanelViewport>
      <FooterActions onRegenerateScene={() => onRegenerateScene(selectedScene?.id ?? selectedSceneId)} regeneratePending={regeneratePending} />
    </section>
  );
}

function SearchBar({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="flex h-10 flex-1 items-center rounded-[8px] border border-white/8 bg-[#1a1a1a] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <input
          className="w-full bg-transparent text-[14px] font-medium text-slate-300 outline-none placeholder:text-slate-500"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search in transcript"
          value={query}
        />
      </label>
      <button className="grid h-10 w-10 place-items-center rounded-[8px] border border-white/8 bg-[#1a1a1a] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]" type="button">
        <FilterIcon />
      </button>
    </div>
  );
}

function ModeBar({ activeTab }: { activeTab: EditorTab }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-[#191919] p-3 text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <Chip strong>1</Chip>
      <Chip>Video</Chip>
      <Chip accent>{tabLabel(activeTab)}</Chip>
      <button className="ml-auto grid h-8 w-8 place-items-center rounded-[8px] border border-white/8 text-slate-500" type="button">
        <WaveIcon />
      </button>
    </div>
  );
}

function TranscriptPanel({
  captions,
  onSceneSelect,
  scene,
}: {
  captions: EditorCaptionDraft[];
  onSceneSelect: (sceneId: string) => void;
  scene: EditorSceneDraft | null;
}) {
  if (!scene) {
    return <PanelEmptyState message="Select a scene to review the transcript." />;
  }
  return (
    <article className="rounded-[12px] border border-white/6 bg-[#222222] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <button className="w-full text-left" onClick={() => onSceneSelect(scene.id)} type="button">
        <p className="text-[18px] leading-[3rem] tracking-[-0.01em] text-slate-100">{scene.spokenLine}</p>
      </button>
      <div className="mt-5 flex flex-wrap gap-2">
        {captionsForScene(captions, scene.id).slice(0, 3).map((caption, index) => (
          <span key={caption.id} className="rounded-[8px] border border-white/10 bg-[#2a2a2a] px-3 py-1.5 text-[12px] text-slate-300">
            Sync Point {index + 1}
          </span>
        ))}
      </div>
    </article>
  );
}

function CaptionPanel({
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
        <article key={caption.id} className="rounded-[12px] border border-white/6 bg-[#222222] p-4">
          <button className="text-xs uppercase tracking-[0.18em] text-slate-500" onClick={() => caption.sceneId ? onCaptionSelect(caption.sceneId) : undefined} type="button">
            {formatRange(caption.start, caption.end)}
          </button>
          <textarea className="mt-3 min-h-24 w-full resize-none bg-transparent text-sm leading-7 text-slate-300 outline-none" onChange={(event) => onCaptionUpdate(caption.id, event.target.value)} value={caption.text} />
        </article>
      ))}
    </div>
  );
}

function ScenePanel({
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
        <SceneCard key={scene.id} canMoveDown={index < scenes.length - 1} canMoveUp={index > 0} onMoveScene={onMoveScene} onRegenerateScene={onRegenerateScene} onSceneSelect={onSceneSelect} onSceneUpdate={onSceneUpdate} regeneratePending={regeneratePending} scene={scene} />
      ))}
    </div>
  );
}

function SceneCard({
  canMoveDown,
  canMoveUp,
  onMoveScene,
  onRegenerateScene,
  onSceneSelect,
  onSceneUpdate,
  regeneratePending,
  scene,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  onMoveScene: (sceneId: string, direction: "backward" | "forward") => void;
  onRegenerateScene: (sceneId: string) => void;
  onSceneSelect: (sceneId: string) => void;
  onSceneUpdate: (sceneId: string, patch: Partial<EditorSceneDraft>) => void;
  regeneratePending: boolean;
  scene: EditorSceneDraft;
}) {
  return (
    <article className="rounded-[12px] border border-white/6 bg-[#202020] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <button className="w-full text-left" onClick={() => onSceneSelect(scene.id)} type="button">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{`Scene ${scene.sceneNumber}`}</p>
        <p className="mt-2 text-lg font-semibold text-white">{scene.title}</p>
      </button>
      <textarea className="mt-3 min-h-16 w-full resize-none bg-transparent text-sm leading-7 text-slate-300 outline-none" onChange={(event) => onSceneUpdate(scene.id, { spokenLine: event.target.value })} value={scene.spokenLine} />
      <div className="mt-3 flex flex-wrap gap-2">
        <MiniButton disabled={!canMoveUp} label="Move up" onClick={() => onMoveScene(scene.id, "backward")} />
        <MiniButton disabled={!canMoveDown} label="Move down" onClick={() => onMoveScene(scene.id, "forward")} />
        <MiniButton disabled={regeneratePending} label="Restore AI scene" onClick={() => onRegenerateScene(scene.id)} />
      </div>
    </article>
  );
}

function FooterActions({
  onRegenerateScene,
  regeneratePending,
}: {
  onRegenerateScene: () => void;
  regeneratePending: boolean;
}) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4">
      <div className="flex items-center gap-2">
        <FooterIcon>...</FooterIcon>
        <FooterIcon>+</FooterIcon>
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-[10px] border border-white/8 bg-[#1a1a1a] px-4 py-2.5 text-sm text-slate-300" disabled={regeneratePending} onClick={onRegenerateScene} type="button">
          AI Rewrite
        </button>
        <button className="rounded-[10px] bg-white px-4 py-2.5 text-sm font-medium text-black" type="button">
          Regenerate speech
        </button>
      </div>
    </div>
  );
}

function PanelViewport({ children }: { children: ReactNode }) {
  return <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>;
}

function PanelEmptyState({ message }: { message: string }) {
  return <div className="rounded-[12px] border border-white/6 bg-[#202020] p-5 text-sm text-slate-400">{message}</div>;
}

function Chip({
  accent,
  children,
  strong,
}: {
  accent?: boolean;
  children: ReactNode;
  strong?: boolean;
}) {
  const className = accent
    ? "border border-fuchsia-400/25 bg-fuchsia-500/12 text-fuchsia-200"
    : strong
      ? "border border-white/10 bg-[#2a2a2a] text-white"
      : "border border-white/10 text-slate-300";
  return <span className={`rounded-[10px] px-3 py-1.5 ${className}`}>{children}</span>;
}

function RailButton({
  active,
  children,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-disabled={disabled}
      aria-label={label}
      className={`grid h-12 w-12 place-items-center rounded-[12px] border border-transparent transition ${
        active ? "bg-white text-black" : "text-slate-500 hover:text-slate-300"
      } ${disabled ? "cursor-default opacity-45 hover:text-slate-500" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function FooterIcon({ children }: { children: ReactNode }) {
  return <button className="grid h-10 w-10 place-items-center rounded-[10px] border border-white/8 bg-[#1a1a1a] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">{children}</button>;
}

function MiniButton({
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

function toolbarItems(): RailTool[] {
  return [
    { id: "script", label: "Script", icon: <CursorIcon />, tab: "script" },
    { id: "captions", label: "Media", icon: <VideoTextIcon />, tab: "captions" },
    { id: "scenes", label: "Text", icon: <TypeIcon />, tab: "scenes" },
    { id: "box", label: "Box", icon: <SquareIcon /> },
    { id: "fx", label: "Fx", icon: <FxIcon /> },
    { id: "pointer", label: "Pointer", icon: <PointerIcon /> },
    { id: "grid", label: "Grid", icon: <GridIcon /> },
    { id: "split", label: "Split", icon: <SplitIcon /> },
    { id: "closed-captions", label: "Closed Captions", icon: <CcIcon /> },
    { id: "comments", label: "Comments", icon: <CommentIcon /> },
  ];
}

function railButtonHandler(
  item: RailTool,
  setActiveTab: (tab: EditorTab) => void,
) {
  const { tab } = item;
  if (!tab) {
    return undefined;
  }
  return () => setActiveTab(tab);
}

function captionsForScene(captions: EditorCaptionDraft[], sceneId: string) {
  return captions.filter((caption) => caption.sceneId === sceneId);
}

function filterScenes(scenes: EditorSceneDraft[], query: string) {
  if (!query.trim()) return scenes;
  const normalized = query.toLowerCase();
  return scenes.filter((scene) => [scene.title, scene.spokenLine, scene.onScreenText].join(" ").toLowerCase().includes(normalized));
}

function sceneForPanel(scenes: EditorSceneDraft[], selectedSceneId: string) {
  return scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0] ?? null;
}

function transcriptSceneForPanel(
  query: string,
  scenes: EditorSceneDraft[],
  selectedScene: EditorSceneDraft | null,
) {
  if (!query.trim()) {
    return selectedScene;
  }
  if (!selectedScene) {
    return null;
  }
  return scenes.some((scene) => scene.id === selectedScene.id) ? selectedScene : null;
}

function tabLabel(activeTab: EditorTab) {
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
