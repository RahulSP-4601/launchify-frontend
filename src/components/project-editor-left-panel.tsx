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
type RailTool = { icon: ReactNode; id: string; label: string; tab?: EditorTab };

export function EditorRail({
  activeTab,
  setActiveTab,
}: {
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;
}) {
  return (
    <aside className="flex h-full flex-col items-center rounded-[8px] bg-[#181818] py-2">
      <div className="flex flex-col gap-1.5">
        {toolbarItems().map((item) => (
          <RailButton
            key={item.id}
            active={item.tab === activeTab}
            disabled={!item.tab}
            label={item.label}
            onClick={railButtonHandler(item.tab, setActiveTab)}
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
  const panelState = useEditorLeftPanelState(draft.scenes, query, selectedSceneId);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[8px] bg-[#1f1f1f] p-3">
      <SearchRow query={query} setQuery={setQuery} />
      <PanelModeBar activeTab={activeTab} />
      <PanelScrollFrame>
        <PanelContent
          activeTab={activeTab}
          captions={draft.captions}
          onCaptionSelect={onCaptionSelect}
          onCaptionUpdate={onCaptionUpdate}
          onMoveScene={onMoveScene}
          onRegenerateScene={onRegenerateScene}
          onSceneSelect={onSceneSelect}
          onSceneUpdate={onSceneUpdate}
          regeneratePending={regeneratePending}
          scene={panelState.selectedScene}
          scenes={panelState.scenes}
          selectedSceneId={selectedSceneId}
        />
      </PanelScrollFrame>
      <FooterActions onRegenerateScene={() => onRegenerateScene(panelState.selectedScene?.id ?? selectedSceneId)} regeneratePending={regeneratePending} />
    </section>
  );
}

function PanelScrollFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-[8px] border border-white/6 bg-[#222222]">
      <div className="h-full overflow-y-auto px-3 py-3">{children}</div>
    </div>
  );
}

function SearchRow({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex h-10 flex-1 items-center rounded-[6px] border border-white/8 bg-[#232323] px-3">
        <input
          className="w-full bg-transparent text-[14px] text-[#d6d6d6] outline-none placeholder:text-[#777]"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search in transcript"
          value={query}
        />
      </label>
      <button className="grid h-10 w-10 place-items-center rounded-[6px] border border-white/8 bg-[#232323] text-[#a1a1a1]" type="button">
        <FilterIcon />
      </button>
    </div>
  );
}

function PanelModeBar({ activeTab }: { activeTab: EditorTab }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-[6px] bg-[#232323] p-2">
      <ModeChip subtle>1</ModeChip>
      <ModeChip>Video</ModeChip>
      <ModeChip accent>{tabLabel(activeTab)}</ModeChip>
      <button className="ml-auto grid h-8 w-8 place-items-center rounded-[6px] border border-white/8 text-[#9c9c9c]" type="button">
        <WaveIcon />
      </button>
    </div>
  );
}

function PanelContent(props: {
  activeTab: EditorTab;
  captions: EditorCaptionDraft[];
  onCaptionSelect: (sceneId: string) => void;
  onCaptionUpdate: (captionId: string, text: string) => void;
  onMoveScene: (sceneId: string, direction: "backward" | "forward") => void;
  onRegenerateScene: (sceneId: string) => void;
  onSceneSelect: (sceneId: string) => void;
  onSceneUpdate: (sceneId: string, patch: Partial<EditorSceneDraft>) => void;
  regeneratePending: boolean;
  scene: EditorSceneDraft | null;
  scenes: EditorSceneDraft[];
  selectedSceneId: string;
}) {
  if (props.activeTab === "captions") {
    return <CaptionPanel captions={props.captions} onCaptionSelect={props.onCaptionSelect} onCaptionUpdate={props.onCaptionUpdate} />;
  }
  if (props.activeTab === "scenes") {
    return <ScenePanel onMoveScene={props.onMoveScene} onRegenerateScene={props.onRegenerateScene} onSceneSelect={props.onSceneSelect} onSceneUpdate={props.onSceneUpdate} regeneratePending={props.regeneratePending} scenes={props.scenes} />;
  }
  return <TranscriptPanel captions={props.captions} onSceneSelect={props.onSceneSelect} scenes={props.scenes} selectedSceneId={props.selectedSceneId} />;
}

function TranscriptPanel({
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
  if (!scenes.length) {
    return <PanelEmptyState message="Select a scene to review the transcript." />;
  }

  return (
    <article className="rounded-[8px] border border-white/6 bg-[#262626] px-4 py-3">
      <TranscriptPanelHeader />
      <div className="space-y-7">
        {scenes.map((scene, sceneIndex) => (
          <TranscriptSceneBlock
            key={scene.id}
            captions={captions}
            isActive={scene.id === selectedSceneId}
            onSceneSelect={onSceneSelect}
            scene={scene}
            sceneIndex={sceneIndex}
          />
        ))}
      </div>
    </article>
  );
}

function TranscriptPanelHeader() {
  return (
    <div className="mb-4 flex items-center gap-2">
      <ModeChip subtle>1</ModeChip>
      <ModeChip>Video</ModeChip>
      <ModeChip accent>Casual Mark</ModeChip>
      <button className="ml-auto grid h-8 w-8 place-items-center rounded-[6px] border border-white/8 text-[#9c9c9c]" type="button">
        <WaveIcon />
      </button>
    </div>
  );
}

function TranscriptSceneBlock({
  captions,
  isActive,
  onSceneSelect,
  scene,
  sceneIndex,
}: {
  captions: EditorCaptionDraft[];
  isActive: boolean;
  onSceneSelect: (sceneId: string) => void;
  scene: EditorSceneDraft;
  sceneIndex: number;
}) {
  const paragraphs = spokenParagraphs(scene.spokenLine);
  const syncPoints = captionsForScene(captions, scene.id);

  return (
    <button
      className={`block w-full rounded-[6px] px-2 py-1 text-left transition ${isActive ? "bg-white/[0.03]" : ""}`}
      onClick={() => onSceneSelect(scene.id)}
      type="button"
    >
      {paragraphs.map((paragraph, index) => (
        <p key={`${scene.id}-${index}`} className="mb-6 text-[17px] leading-[1.58] text-[#ededed] last:mb-0">
          {paragraph}
          {syncPoints[index] ? <SyncChip index={sceneIndex + index + 1} /> : null}
        </p>
      ))}
      <p className="text-[17px] leading-[1.58] text-[#ededed]">{scene.onScreenText || scene.title}</p>
    </button>
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
        <article key={caption.id} className="rounded-[8px] border border-white/6 bg-[#262626] p-3">
          <button className="text-xs uppercase tracking-[0.18em] text-[#8e8e8e]" onClick={() => caption.sceneId ? onCaptionSelect(caption.sceneId) : undefined} type="button">
            {formatRange(caption.start, caption.end)}
          </button>
          <textarea className="mt-2 min-h-24 w-full resize-none bg-transparent text-[14px] leading-7 text-[#f0f0f0] outline-none" onChange={(event) => onCaptionUpdate(caption.id, event.target.value)} value={caption.text} />
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
        <article key={scene.id} className="rounded-[8px] border border-white/6 bg-[#262626] p-3">
          <button className="w-full text-left" onClick={() => onSceneSelect(scene.id)} type="button">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f8f8f]">{`Scene ${scene.sceneNumber}`}</p>
            <p className="mt-1 text-[17px] font-medium text-white">{scene.title}</p>
          </button>
          <textarea className="mt-2 min-h-16 w-full resize-none bg-transparent text-[14px] leading-6 text-[#e9e9e9] outline-none" onChange={(event) => onSceneUpdate(scene.id, { spokenLine: event.target.value })} value={scene.spokenLine} />
          <div className="mt-3 flex flex-wrap gap-2">
            <MiniButton disabled={index === 0} label="Move up" onClick={() => onMoveScene(scene.id, "backward")} />
            <MiniButton disabled={index === scenes.length - 1} label="Move down" onClick={() => onMoveScene(scene.id, "forward")} />
            <MiniButton disabled={regeneratePending} label="Restore AI scene" onClick={() => onRegenerateScene(scene.id)} />
          </div>
        </article>
      ))}
    </div>
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
    <div className="mt-3 flex items-center justify-between border-t border-dashed border-white/8 pt-4">
      <div className="flex items-center gap-2">
        <FooterIcon>...</FooterIcon>
        <FooterIcon>+</FooterIcon>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-[6px] border border-white/8 bg-[#222222] px-4 py-2 text-[14px] text-[#e0e0e0]" disabled={regeneratePending} onClick={onRegenerateScene} type="button">
          AI Rewrite
        </button>
        <button className="min-w-[200px] rounded-[6px] bg-[#f2f2f2] px-4 py-2 text-[14px] font-medium text-[#1f1f1f]" type="button">
          Regenerate speech
        </button>
      </div>
    </div>
  );
}

function ModeChip({
  accent,
  children,
  subtle,
}: {
  accent?: boolean;
  children: ReactNode;
  subtle?: boolean;
}) {
  const tone = accent
    ? "border-[#8f4a87] bg-[#2f232f] text-[#ecb7ea]"
    : subtle
      ? "border-white/6 bg-[#2e2e2e] text-[#c9c9c9]"
      : "border-white/6 bg-[#2a2a2a] text-[#d6d6d6]";
  return <span className={`rounded-[6px] border px-2.5 py-1 text-[13px] ${tone}`}>{children}</span>;
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
      className={`grid h-10 w-10 place-items-center rounded-[6px] transition ${active ? "bg-[#f2f2f2] text-[#111]" : "text-[#8c8c8c] hover:text-white"} ${disabled ? "cursor-default hover:text-[#8c8c8c]" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function PanelEmptyState({ message }: { message: string }) {
  return <div className="rounded-[8px] border border-white/6 bg-[#262626] p-4 text-[14px] text-[#979797]">{message}</div>;
}

function FooterIcon({ children }: { children: ReactNode }) {
  return <button className="grid h-10 w-10 place-items-center rounded-[6px] border border-white/8 bg-[#222222] text-[#dedede]">{children}</button>;
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
  return <button className="rounded-[6px] border border-white/8 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-[#dddddd] disabled:opacity-40" disabled={disabled} onClick={onClick} type="button">{label}</button>;
}

function SyncChip({ index }: { index: number }) {
  return (
    <span className="ml-3 inline-flex items-center rounded-[7px] border border-white/10 bg-[#171717] px-2 py-1 text-[12px] text-[#cfcfcf] align-middle">
      {`Sync Point ${index}`}
    </span>
  );
}

function toolbarItems(): RailTool[] {
  return [
    { id: "script", label: "Script", icon: <CursorIcon />, tab: "script" },
    { id: "captions", label: "Media", icon: <VideoTextIcon />, tab: "captions" },
    { id: "scenes", label: "Text", icon: <TypeIcon />, tab: "scenes" },
    { id: "box", label: "Shape", icon: <SquareIcon /> },
    { id: "fx", label: "Effects", icon: <FxIcon /> },
    { id: "pointer", label: "Motion", icon: <PointerIcon /> },
    { id: "grid", label: "Layout", icon: <GridIcon /> },
    { id: "split", label: "Transition", icon: <SplitIcon /> },
    { id: "closed-captions", label: "Captions", icon: <CcIcon /> },
    { id: "comments", label: "Comments", icon: <CommentIcon /> },
  ];
}

function railButtonHandler(
  tab: EditorTab | undefined,
  setActiveTab: (tab: EditorTab) => void,
) {
  if (!tab) return undefined;
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

function useEditorLeftPanelState(
  scenes: EditorSceneDraft[],
  query: string,
  selectedSceneId: string,
) {
  const filteredScenes = useMemo(() => filterScenes(scenes, query), [scenes, query]);
  return {
    scenes: filteredScenes,
    selectedScene: sceneForPanel(scenes, selectedSceneId),
  };
}

function sceneForPanel(scenes: EditorSceneDraft[], selectedSceneId: string) {
  return scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0] ?? null;
}

function tabLabel(activeTab: EditorTab) {
  if (activeTab === "captions") return "Voice Over";
  if (activeTab === "scenes") return "Casual Mark";
  return "Casual Mark";
}

function spokenParagraphs(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
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
