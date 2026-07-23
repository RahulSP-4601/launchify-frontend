"use client";

import type { ReactNode } from "react";

import { commentsForScene } from "@/components/project-editor-tool-state";
import type { EditorCaptionDraft, EditorSceneDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
import type { ProjectEditorMediaAsset } from "@/lib/types";
import {
  AssetsPanel,
  CaptionStylesPanel,
  CommentsPanel,
  EffectsPanel,
  ShapesPanel,
} from "@/components/project-editor-left-panel-modes";
import {
  CcIcon,
  CommentIcon,
  CursorIcon,
  FxIcon,
  SquareIcon,
  TypeIcon,
  VideoTextIcon,
  WaveIcon,
} from "@/components/project-editor-icons";

export type EditorToolMode =
  | "pointer"
  | "media"
  | "text"
  | "shape"
  | "effects"
  | "captions"
  | "comments";

type RailTool = { icon: ReactNode; id: EditorToolMode; label: string };
type EditorLeftPanelProps = {
  activeTool: EditorToolMode;
  assets: ProjectEditorMediaAsset[];
  assetsPending: boolean;
  currentTime: number;
  draft: ProjectEditorDraft;
  onAssetSelect: (asset: ProjectEditorMediaAsset) => void;
  onAddComment: (body: string, time: number) => void;
  onCaptionSelect: (sceneId: string) => void;
  onCaptionUpdate: (captionId: string, text: string) => void;
  onMoveScene: (sceneId: string, direction: "backward" | "forward") => void;
  onRegenerateScene: (sceneId: string) => void;
  onSceneSelect: (sceneId: string) => void;
  onSetCaptionPreset: (preset: ProjectEditorDraft["toolState"]["active_caption_preset"]) => void;
  onSetMediaIntent: (intent: ProjectEditorDraft["toolState"]["pending_media_intent"]) => void;
  onSetMediaTab: (tab: ProjectEditorDraft["toolState"]["media_tab"]) => void;
  onSetSelectedEffect: (effect: ProjectEditorDraft["toolState"]["active_effect"]) => void;
  onSetSelectedShape: (shape: ProjectEditorDraft["toolState"]["active_shape"]) => void;
  onSceneUpdate: (sceneId: string, patch: Partial<EditorSceneDraft>) => void;
  onUploadRequest: () => void;
  regeneratePending: boolean;
  selectedSceneId: string;
};

export function EditorRail({
  activeTool,
  setActiveTool,
}: {
  activeTool: EditorToolMode;
  setActiveTool: (tool: EditorToolMode) => void;
}) {
  return (
    <aside className="flex h-full flex-col items-center rounded-[10px] bg-[#171717] py-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="flex flex-col gap-[10px]">
        {toolbarItems().map((item) => (
          <RailButton
            key={item.id}
            active={item.id === activeTool}
            label={item.label}
            onClick={() => setActiveTool(item.id)}
          >
            {item.icon}
          </RailButton>
        ))}
      </div>
    </aside>
  );
}

export function EditorLeftPanel(props: EditorLeftPanelProps) {
  const selectedScene = sceneForPanel(props.draft.scenes, props.selectedSceneId, Boolean(props.draft.selectedClipId));
  return activeModePanel(props, selectedScene) ?? renderTranscriptToolPanel({ ...props, selectedScene });
}

function activeModePanel(props: EditorLeftPanelProps, selectedScene: EditorSceneDraft | null) {
  if (props.activeTool === "media") {
    return <AssetsPanel assets={props.assets} assetsPending={props.assetsPending} draft={props.draft} onAssetSelect={props.onAssetSelect} onSetMediaIntent={props.onSetMediaIntent} onSetMediaTab={props.onSetMediaTab} onUploadRequest={props.onUploadRequest} />;
  }
  if (props.activeTool === "effects") return <EffectsPanel activeEffect={props.draft.toolState.active_effect} onSelectEffect={props.onSetSelectedEffect} />;
  if (props.activeTool === "captions") return <CaptionStylesPanel activePreset={props.draft.toolState.active_caption_preset} onSelectPreset={props.onSetCaptionPreset} showCaptions={props.draft.showCaptions} />;
  if (props.activeTool === "shape") return <ShapesPanel activeShape={props.draft.toolState.active_shape} onSelectShape={props.onSetSelectedShape} />;
  if (props.activeTool === "comments") return <CommentsPanel comments={commentsForScene(props.draft.comments, selectedScene?.id ?? null)} currentTime={props.currentTime} onAddComment={props.onAddComment} />;
  return null;
}

function renderTranscriptToolPanel({
  activeTool,
  draft,
  onCaptionSelect,
  onCaptionUpdate,
  onMoveScene,
  onRegenerateScene,
  onSceneSelect,
  onSceneUpdate,
  regeneratePending,
  selectedScene,
  selectedSceneId,
}: {
  activeTool: EditorToolMode;
  draft: ProjectEditorDraft;
  onCaptionSelect: (sceneId: string) => void;
  onCaptionUpdate: (captionId: string, text: string) => void;
  onMoveScene: (sceneId: string, direction: "backward" | "forward") => void;
  onRegenerateScene: (sceneId: string) => void;
  onSceneSelect: (sceneId: string) => void;
  onSceneUpdate: (sceneId: string, patch: Partial<EditorSceneDraft>) => void;
  regeneratePending: boolean;
  selectedScene: EditorSceneDraft | null;
  selectedSceneId: string;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-[10px] bg-[#201f1f] p-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <PanelScrollFrame>
        <TranscriptWorkspace
          captions={draft.captions}
          onCaptionSelect={onCaptionSelect}
          onCaptionUpdate={onCaptionUpdate}
          onMoveScene={onMoveScene}
          onRegenerateScene={onRegenerateScene}
          onSceneSelect={onSceneSelect}
          onSceneUpdate={onSceneUpdate}
          regeneratePending={regeneratePending}
          scene={selectedScene}
          scenes={draft.scenes}
          toolMode={activeTool}
        />
      </PanelScrollFrame>
      <FooterActions
        onRegenerateScene={() => onRegenerateScene(selectedScene?.id ?? selectedSceneId)}
        regeneratePending={regeneratePending}
      />
    </section>
  );
}

function TranscriptWorkspace({
  captions,
  onSceneSelect,
  scene,
  toolMode,
}: {
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
  toolMode: EditorToolMode;
}) {
  return (
    scene
      ? <TranscriptSceneBlock captions={captions} onSceneSelect={onSceneSelect} scene={scene} toolMode={toolMode} />
      : <PanelEmptyState message="Select a scene to review the transcript." />
  );
}

function TranscriptSceneBlock({
  captions,
  onSceneSelect,
  scene,
  toolMode,
}: {
  captions: EditorCaptionDraft[];
  onSceneSelect: (sceneId: string) => void;
  scene: EditorSceneDraft;
  toolMode: EditorToolMode;
}) {
  const paragraphs = spokenParagraphs(scene.spokenLine);
  const syncPoints = captionsForScene(captions, scene.id);

  return (
    <article className="rounded-[8px] border border-white/6 bg-[#262525] p-3">
      <div className="mb-4 flex items-center gap-2.5">
        <ModeChip subtle>{scene.sceneNumber}</ModeChip>
        <ModeChip>Video</ModeChip>
        <ModeChip accent>{toolMode === "text" ? "Casual Mark" : "Casual Mark"}</ModeChip>
        <button className="ml-auto grid h-8 w-8 place-items-center rounded-[7px] border border-white/8 text-[#8d8d8d]" onClick={() => onSceneSelect(scene.id)} type="button">
          <WaveIcon />
        </button>
      </div>
      <div className="rounded-[8px] bg-[#2f2d2d] px-4 py-5 text-left">
        {paragraphs.map((paragraph, index) => (
          <p key={`${scene.id}-${index}`} className="mb-8 text-[16px] font-normal leading-[1.62] text-[#ececec] last:mb-0">
            {paragraph}
            {syncPoints[index] ? <SyncChip index={index + 1} /> : null}
          </p>
        ))}
      </div>
    </article>
  );
}

function PanelScrollFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mt-0 min-h-0 flex-1 overflow-hidden rounded-[8px] border border-white/6 bg-[#232221]">
      <div className="h-full overflow-y-auto px-[8px] py-[8px]">{children}</div>
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
    <div className="mt-3 flex items-center justify-between border-t border-dashed border-white/8 px-1 pt-4">
      <div className="flex items-center gap-2">
        <FooterIcon>...</FooterIcon>
        <FooterIcon>+</FooterIcon>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-[7px] border border-white/8 bg-[#232221] px-4 py-2 text-[14px] text-[#e0e0e0]" disabled={regeneratePending} onClick={onRegenerateScene} type="button">
          AI Rewrite
        </button>
        <button className="min-w-[202px] rounded-[7px] bg-[#f2f2f2] px-4 py-2 text-[14px] font-medium text-[#1f1f1f]" type="button">
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
    ? "border-[#8f4a87] bg-[#312330] text-[#ecb7ea]"
    : subtle
      ? "border-white/6 bg-[#2f2f2f] text-[#c9c9c9]"
      : "border-white/6 bg-[#292929] text-[#d6d6d6]";
  return <span className={`rounded-[7px] border px-2.5 py-1 text-[12px] ${tone}`}>{children}</span>;
}

function RailButton({
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
  return (
    <button
      aria-label={label}
      className={`grid h-[42px] w-[42px] place-items-center rounded-[8px] transition ${active ? "bg-[#f2f2f2] text-[#111]" : "text-[#8c8c8c] hover:text-white"}`}
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
  return <button className="grid h-[38px] w-[38px] place-items-center rounded-[7px] border border-white/8 bg-[#222222] text-[#dedede]">{children}</button>;
}

function SyncChip({ index }: { index: number }) {
  return (
    <span className="ml-3 inline-flex items-center rounded-[6px] border border-white/10 bg-[#171717] px-2 py-[4px] text-[11px] text-[#cfcfcf] align-middle">
      {`Sync Point ${index}`}
    </span>
  );
}

function toolbarItems(): RailTool[] {
  return [
    { id: "pointer", label: "Pointer", icon: <CursorIcon /> },
    { id: "media", label: "Assets", icon: <VideoTextIcon /> },
    { id: "text", label: "Text", icon: <TypeIcon /> },
    { id: "shape", label: "Shape", icon: <SquareIcon /> },
    { id: "effects", label: "Effects", icon: <FxIcon /> },
    { id: "captions", label: "Captions", icon: <CcIcon /> },
    { id: "comments", label: "Comments", icon: <CommentIcon /> },
  ];
}

function captionsForScene(captions: EditorCaptionDraft[], sceneId: string) {
  return captions.filter((caption) => caption.sceneId === sceneId);
}

function sceneForPanel(scenes: EditorSceneDraft[], selectedSceneId: string, clipSelected: boolean) {
  if (clipSelected && !selectedSceneId) {
    return null;
  }
  return scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0] ?? null;
}

function spokenParagraphs(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
