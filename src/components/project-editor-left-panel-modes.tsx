"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import type { EditorCommentDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
import type { ProjectEditorMediaAsset } from "@/lib/types";

export function AssetsPanel({
  assets,
  assetsPending,
  draft,
  onAssetSelect,
  onSetMediaIntent,
  onSetMediaTab,
  onUploadRequest,
}: {
  assets: ProjectEditorMediaAsset[];
  assetsPending: boolean;
  draft: ProjectEditorDraft;
  onAssetSelect: (asset: ProjectEditorMediaAsset) => void;
  onSetMediaIntent: (intent: ProjectEditorDraft["toolState"]["pending_media_intent"]) => void;
  onSetMediaTab: (tab: ProjectEditorDraft["toolState"]["media_tab"]) => void;
  onUploadRequest: () => void;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-[10px] bg-[#201f1f] p-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <PanelTitle title="Assets" />
      <AssetTabBar activeTab={draft.toolState.media_tab} onSelectTab={onSetMediaTab} />
      <SearchHeader placeholder="Search for assets in this project" />
      <div className="mt-3 flex items-center gap-2 text-[13px] text-[#cfcfcf]">
        <FilterPill>All sources</FilterPill>
        <FilterPill>All types</FilterPill>
      </div>
      <AssetGrid assets={assets} assetsPending={assetsPending} onAssetSelect={onAssetSelect} />
      <div className="mt-auto space-y-3 pt-4">
        <div className="rounded-[10px] border border-white/7 bg-[#232221] p-3 text-[14px] text-[#7e7e7e]">
          Describe the image you want to generate, or @ to reference an upload
        </div>
        <div className="flex items-center gap-2">
          <FilterPill>Nano Banana Flash</FilterPill>
          <FilterPill>16:9</FilterPill>
          <button className="ml-auto rounded-[8px] bg-[#8e3f87] px-3 py-2 text-[13px] text-white" type="button">→</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="rounded-[8px] border border-white/8 bg-[#232221] px-4 py-3 text-[14px] text-[#e4e4e4]" type="button">Grab from frame</button>
          <button className="rounded-[8px] bg-[#f1f1f1] px-4 py-3 text-[14px] font-medium text-[#1f1f1f]" onClick={() => { onSetMediaIntent("upload_file"); onUploadRequest(); }} type="button">Upload</button>
        </div>
        {draft.toolState.pending_media_intent ? <IntentBadge intent={draft.toolState.pending_media_intent} /> : null}
      </div>
    </section>
  );
}

export function EffectsPanel({
  activeEffect,
  onSelectEffect,
}: {
  activeEffect: ProjectEditorDraft["toolState"]["active_effect"];
  onSelectEffect: (effect: ProjectEditorDraft["toolState"]["active_effect"]) => void;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-[10px] bg-[#201f1f] p-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <PanelTitle title="Effects" />
      <div className="mt-4 grid grid-cols-2 gap-4">
        {effectOptions().map((effect) => (
          <button className={`rounded-[10px] border p-3 text-left ${activeEffect === effect.id ? "border-[#cf55ba] bg-[#312330]" : "border-white/6 bg-[#262525]"}`} key={effect.id} onClick={() => onSelectEffect(effect.id)} type="button">
            <div className="aspect-[1.2/0.82] rounded-[8px] bg-[#121212]" />
            <p className="mt-3 text-[14px] text-[#d9d9d9]">{effect.label}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function CaptionStylesPanel({
  activePreset,
  onSelectPreset,
  showCaptions,
}: {
  activePreset: ProjectEditorDraft["toolState"]["active_caption_preset"];
  onSelectPreset: (preset: ProjectEditorDraft["toolState"]["active_caption_preset"]) => void;
  showCaptions: boolean;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-[10px] bg-[#201f1f] p-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <PanelTitle title="Captions" />
      <div className="mt-3 flex items-center gap-2">
        <FilterPill>Saved</FilterPill>
        <FilterPill active>Library</FilterPill>
        <button className="ml-auto grid h-9 w-9 place-items-center rounded-[8px] border border-white/8 text-[#b8b8b8]" type="button">⌕</button>
      </div>
      <p className="mt-6 text-[15px] text-[#d3d3d3]">All 8</p>
      <div className="mt-3 space-y-3 overflow-y-auto">
        {captionOptions().map((style, index) => (
          <button className={`w-full rounded-[10px] border p-3 text-left ${activePreset === style.id ? "border-[#cf55ba] bg-[#312330]" : "border-white/6 bg-[#262525]"}`} key={style.id} onClick={() => onSelectPreset(style.id)} type="button">
            <div className="rounded-[8px] border border-white/7 bg-[#1f1f1f] px-4 py-6 text-center text-[18px] text-white">
              {index === 2 ? "the lazy dog" : "The quick brown fox jumped over"}
            </div>
            <p className="mt-3 text-[14px] text-[#d2d2d2]">{style.label}</p>
          </button>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/8 pt-3">
        <button className="rounded-[8px] border border-white/8 px-4 py-3 text-[14px] text-[#e6e6e6]" type="button">Download</button>
        <div className="flex items-center gap-3 text-[14px] text-[#d9d9d9]">
          <span>Visibility</span>
          <button className={`flex h-[22px] w-[42px] items-center rounded-full p-[2px] ${showCaptions ? "bg-[#d46ccc]" : "bg-[#3a3a3a]"}`} type="button">
            <span className={`h-4 w-4 rounded-full bg-white transition ${showCaptions ? "ml-auto" : ""}`} />
          </button>
        </div>
      </div>
    </section>
  );
}

export function ShapesPanel({
  activeShape,
  onSelectShape,
}: {
  activeShape: ProjectEditorDraft["toolState"]["active_shape"];
  onSelectShape: (shape: ProjectEditorDraft["toolState"]["active_shape"]) => void;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-[10px] bg-[#201f1f] p-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <PanelTitle title="Shapes" />
      <div className="mt-4 space-y-2 rounded-[10px] border border-white/6 bg-[#262525] p-3">
        {shapeOptions().map((shape) => (
          <button className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-[14px] ${activeShape === shape.id ? "bg-[#312330] text-white" : "text-[#dddddd] hover:bg-white/5"}`} key={shape.id} onClick={() => onSelectShape(shape.id)} type="button">
            <span>{shape.label}</span>
            <span className="rounded-[6px] border border-white/8 px-2 py-0.5 text-[12px] text-[#9f9f9f]">{shape.shortcut}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function CommentsPanel({
  comments,
  currentTime,
  onAddComment,
}: {
  comments: EditorCommentDraft[];
  currentTime: number;
  onAddComment: (body: string, time: number) => void;
}) {
  const [draftBody, setDraftBody] = useState("");
  return (
    <section className="flex h-full min-h-0 flex-col rounded-[10px] bg-[#201f1f] p-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <PanelTitle title="Comments" />
      <SearchHeader placeholder="Search in comments" />
      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto">
        {comments.length ? comments.map((comment) => <CommentCard comment={comment} key={comment.id} />) : <PanelEmptyState message="No comments yet for this scene." />}
      </div>
      <div className="mt-4 rounded-[10px] border border-white/8 bg-[#232221] p-3">
        <textarea className="min-h-[92px] w-full resize-none bg-transparent text-[14px] text-[#d7d7d7] outline-none placeholder:text-[#7c7c7c]" onChange={(event) => setDraftBody(event.target.value)} placeholder="Add a comment" value={draftBody} />
        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-[8px] bg-[#2e2d2d] px-3 py-1.5 text-[12px] text-[#d7d7d7]">{formatCommentTime(currentTime)}</span>
          <button className="rounded-[8px] bg-[#f1f1f1] px-4 py-2 text-[14px] font-medium text-[#1d1d1d]" onClick={() => submitComment(draftBody, currentTime, onAddComment, setDraftBody)} type="button">Save</button>
        </div>
      </div>
    </section>
  );
}

function PanelTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/8 pb-4">
      <h3 className="text-[18px] font-medium text-[#efefef]">{title}</h3>
      <button className="text-[26px] leading-none text-[#8c8c8c]" type="button">×</button>
    </div>
  );
}

function SearchHeader({ placeholder }: { placeholder: string }) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <label className="flex h-[42px] flex-1 items-center rounded-[8px] border border-white/8 bg-[#232221] px-4">
        <input className="w-full bg-transparent text-[14px] text-[#d5d5d5] outline-none placeholder:text-[#777]" placeholder={placeholder} readOnly value="" />
      </label>
      <button className="grid h-[42px] w-[42px] place-items-center rounded-[8px] border border-white/8 bg-[#232221] text-[#9f9f9f]" type="button">≡</button>
    </div>
  );
}

function AssetTabBar({
  activeTab,
  onSelectTab,
}: {
  activeTab: ProjectEditorDraft["toolState"]["media_tab"];
  onSelectTab: (tab: ProjectEditorDraft["toolState"]["media_tab"]) => void;
}) {
  return (
    <div className="mt-3 flex items-center gap-5 border-b border-white/8 pb-3 text-[14px] text-[#7f7f7f]">
      {[
        ["project", "In this project"],
        ["saved", "Saved in workspace"],
        ["stock", "Stock"],
      ].map(([tab, label]) => (
        <button className={activeTab === tab ? "border-b border-[#cf55ba] pb-2 text-[#f2f2f2]" : ""} key={tab} onClick={() => onSelectTab(tab as ProjectEditorDraft["toolState"]["media_tab"])} type="button">{label}</button>
      ))}
      <button className="ml-auto rounded-[8px] border border-white/8 px-3 py-2 text-[#d0d0d0]" type="button">⋮</button>
    </div>
  );
}

function FilterPill({ active, children }: { active?: boolean; children: ReactNode }) {
  return <span className={`rounded-[8px] border px-3 py-2 text-[13px] ${active ? "border-white/14 bg-[#2e2d2d] text-[#ededed]" : "border-white/8 bg-[#232221] text-[#d2d2d2]"}`}>{children}</span>;
}

function AssetGrid({
  assets,
  assetsPending,
  onAssetSelect,
}: {
  assets: ProjectEditorMediaAsset[];
  assetsPending: boolean;
  onAssetSelect: (asset: ProjectEditorMediaAsset) => void;
}) {
  if (assetsPending) {
    return <div className="mt-4 rounded-[10px] border border-white/6 bg-[#262626] p-4 text-[14px] text-[#979797]">Loading assets…</div>;
  }
  if (!assets.length) {
    return <div className="mt-4 rounded-[10px] border border-white/6 bg-[#262626] p-4 text-[14px] text-[#979797]">No assets available in this scope yet.</div>;
  }
  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      {assets.map((asset) => (
        <AssetCard asset={asset} key={asset.id} onSelect={() => onAssetSelect(asset)} />
      ))}
    </div>
  );
}

function AssetCard({
  asset,
  onSelect,
}: {
  asset: ProjectEditorMediaAsset;
  onSelect: () => void;
}) {
  const background = asset.kind === "audio" ? "bg-[linear-gradient(180deg,#0d8d50,#0b7a46)]" : "bg-[linear-gradient(180deg,#215eb7,#173f80)]";
  return (
    <button className="text-left" onClick={onSelect} type="button">
      <div className={`relative aspect-[0.82/1] rounded-[10px] ${background} p-4`}>
        {asset.duration_seconds ? <span className="rounded-[6px] bg-black/34 px-2 py-1 text-[12px] text-white">{formatAssetDuration(asset.duration_seconds)}</span> : null}
        <div className="absolute inset-x-4 bottom-4 text-[13px] text-white/90">{asset.kind === "audio" ? "Audio asset" : "Video asset"}</div>
      </div>
      <p className="mt-3 line-clamp-1 text-[14px] text-[#d6d6d6]">{asset.title}</p>
    </button>
  );
}

function IntentBadge({ intent }: { intent: NonNullable<ProjectEditorDraft["toolState"]["pending_media_intent"]> }) {
  const label = intent === "upload_file" ? "Upload flow ready" : "Project import ready";
  return <div className="rounded-[8px] border border-[#8f4a87] bg-[#312330] px-3 py-2 text-[13px] text-[#ecb7ea]">{label}</div>;
}

function PanelEmptyState({ message }: { message: string }) {
  return <div className="rounded-[8px] border border-white/6 bg-[#262626] p-4 text-[14px] text-[#979797]">{message}</div>;
}

function effectOptions() {
  return [
    { id: "blur" as const, label: "Blur" },
    { id: "callout" as const, label: "Callout" },
    { id: "spotlight" as const, label: "Spotlight" },
    { id: "zoom" as const, label: "Zoom" },
  ];
}

function captionOptions() {
  return [
    { id: "basic" as const, label: "Basic" },
    { id: "basic_karaoke" as const, label: "Basic Karaoke" },
    { id: "highlight_box" as const, label: "Highlight Box" },
    { id: "karaoke_highlight_box" as const, label: "Karaoke Highlight Box" },
  ];
}

function shapeOptions() {
  return [
    { id: "rectangle" as const, label: "Rectangle", shortcut: "R" },
    { id: "ellipse" as const, label: "Ellipse", shortcut: "O" },
    { id: "polygon" as const, label: "Polygon", shortcut: "P" },
    { id: "star" as const, label: "Star", shortcut: "S" },
    { id: "line" as const, label: "Line", shortcut: "L" },
    { id: "arrow" as const, label: "Arrow", shortcut: "A" },
  ];
}

function CommentCard({ comment }: { comment: EditorCommentDraft }) {
  return (
    <div className="rounded-[10px] border border-white/6 bg-[#262525] p-3">
      <p className="text-[14px] leading-7 text-[#e6e6e6]">{comment.body}</p>
      <p className="mt-2 text-[12px] text-[#8e8e8e]">{formatCommentTime(comment.time)}</p>
    </div>
  );
}

function formatCommentTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function submitComment(
  body: string,
  time: number,
  onAddComment: (body: string, time: number) => void,
  setDraftBody: (value: string) => void,
) {
  if (!body.trim()) return;
  onAddComment(body, time);
  setDraftBody("");
}

function formatAssetDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.round(durationSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
