"use client";

import { useMemo, useState } from "react";

import { ProjectEditorRevisionSummary } from "@/lib/types";

export function EditorRevisionHistory({
  activeRevisionId,
  onRestore,
  restorePending,
  revisions,
}: {
  activeRevisionId: number | null;
  onRestore: (revisionId: number) => void;
  restorePending: boolean;
  revisions: ProjectEditorRevisionSummary[];
}) {
  const [selectedRevisionId, setSelectedRevisionId] = useState<number | null>(revisions[0]?.id ?? null);
  const selectedRevision = useSelectedRevision(revisions, selectedRevisionId);

  if (!revisions.length) {
    return <p className="text-[13px] leading-6 text-[#8c8c8c]">Revision history will appear after the first editor save.</p>;
  }

  return (
    <div className="space-y-3">
      <RevisionSelectionList activeRevisionId={activeRevisionId} revisions={revisions} selectedRevisionId={selectedRevisionId} onSelect={setSelectedRevisionId} />
      {selectedRevision ? <RevisionDetails activeRevisionId={activeRevisionId} onRestore={onRestore} restorePending={restorePending} revision={selectedRevision} /> : null}
    </div>
  );
}

function useSelectedRevision(revisions: ProjectEditorRevisionSummary[], selectedRevisionId: number | null) {
  return useMemo(
    () => revisions.find((revision) => revision.id === selectedRevisionId) ?? revisions[0] ?? null,
    [revisions, selectedRevisionId],
  );
}

function RevisionSelectionList({
  activeRevisionId,
  onSelect,
  revisions,
  selectedRevisionId,
}: {
  activeRevisionId: number | null;
  onSelect: (revisionId: number) => void;
  revisions: ProjectEditorRevisionSummary[];
  selectedRevisionId: number | null;
}) {
  return (
    <div className="max-h-[204px] space-y-2 overflow-y-auto pr-1">
      {revisions.map((revision) => (
        <RevisionRow activeRevisionId={activeRevisionId} key={revision.id} onSelect={onSelect} revision={revision} selected={revision.id === selectedRevisionId} />
      ))}
    </div>
  );
}

function RevisionRow({
  activeRevisionId,
  onSelect,
  revision,
  selected,
}: {
  activeRevisionId: number | null;
  onSelect: (revisionId: number) => void;
  revision: ProjectEditorRevisionSummary;
  selected: boolean;
}) {
  const active = revision.id === activeRevisionId;
  return (
    <button
      className={`w-full rounded-[8px] border px-3 py-3 text-left transition ${selected ? "border-[#8d6be2] bg-[#2a2535]" : "border-white/6 bg-[#1b1b1b] hover:border-white/12 hover:bg-[#202020]"}`}
      onClick={() => onSelect(revision.id)}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-white">{`Revision v${revision.sequence_version}`}</p>
          <p className="mt-1 text-[11px] text-[#8c8c8c]">{revisionMeta(revision)}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${active ? "bg-[#3e3656] text-[#d9ccff]" : "bg-[#292929] text-[#999999]"}`}>
          {active ? "Current" : "Saved"}
        </span>
      </div>
    </button>
  );
}

function RevisionDetails({
  activeRevisionId,
  onRestore,
  restorePending,
  revision,
}: {
  activeRevisionId: number | null;
  onRestore: (revisionId: number) => void;
  restorePending: boolean;
  revision: ProjectEditorRevisionSummary;
}) {
  const active = revision.id === activeRevisionId;
  return (
    <div className="rounded-[10px] border border-white/7 bg-[#171717] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#858585]">Selected Revision</p>
      <p className="mt-2 text-[15px] font-medium text-white">{`Revision v${revision.sequence_version}`}</p>
      <p className="mt-1 text-[12px] leading-5 text-[#a4a4a4]">{revisionMeta(revision)}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] uppercase tracking-[0.14em] text-[#858585]">
        <DetailChip label="Scenes" value={String(revision.scene_count)} />
        <DetailChip label="Revision ID" value={`#${revision.id}`} />
      </div>
      <button
        className={`mt-4 w-full rounded-[8px] px-3 py-2 text-[12px] font-medium transition ${active ? "bg-[#2d2d2d] text-[#8f8f8f]" : "bg-[#ece7ff] text-[#1f1639] hover:bg-white"}`}
        disabled={active || restorePending}
        onClick={() => onRestore(revision.id)}
        type="button"
      >
        {active ? "Current revision" : restorePending ? "Restoring revision..." : "Restore revision"}
      </button>
    </div>
  );
}

function DetailChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[8px] border border-white/7 bg-[#202020] px-3 py-2">
      <p>{label}</p>
      <p className="mt-1 text-[13px] normal-case tracking-normal text-white">{value}</p>
    </div>
  );
}

function revisionMeta(revision: ProjectEditorRevisionSummary) {
  const timestamp = new Date(revision.created_at);
  const formatted = Number.isNaN(timestamp.valueOf()) ? revision.created_at : timestamp.toLocaleString();
  return `${formatted} • ${revision.scene_count} scene${revision.scene_count === 1 ? "" : "s"}`;
}
