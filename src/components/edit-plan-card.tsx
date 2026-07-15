"use client";

import { EditPlanRecord } from "@/lib/types";

export function EditPlanCard({
  editPlan,
  projectError,
}: {
  editPlan: EditPlanRecord | null;
  projectError: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <p className="text-sm font-semibold text-slate-100">AI edit plan</p>
      {editPlan ? (
        <div className="mt-4 space-y-4">
          <DetailBlock label="Overview" value={editPlan.overview} />
          <DetailBlock
            label="Render spec"
            value={`Title: ${editPlan.render_spec.title_card} | CTA: ${editPlan.render_spec.cta} | Duration: ${editPlan.render_spec.total_duration_seconds.toFixed(2)}s`}
          />
          <EditPlanSceneList scenes={editPlan.scenes} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          {projectError || "Aligned captions, zooms, and highlight instructions will appear here once planning finishes."}
        </p>
      )}
    </div>
  );
}

function EditPlanSceneList({ scenes }: { scenes: EditPlanRecord["scenes"] }) {
  return (
    <div className="space-y-3">
      {scenes.map((scene) => (
        <div key={scene.scene_number} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-100">{scene.title}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {scene.start.toFixed(2)}s - {scene.end.toFixed(2)}s
            </p>
          </div>
          <p className="mt-2 text-sm text-slate-300">{scene.purpose}</p>
          <p className="mt-2 text-sm text-cyan-300">
            {scene.camera_mode} camera | confidence {(scene.confidence * 100).toFixed(0)}%
          </p>
          <p className="mt-2 text-sm text-slate-400">{scene.decision_summary}</p>
          <p className="mt-2 text-sm text-slate-500">{scene.visual_summary}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">Captions</p>
          <p className="mt-2 text-sm text-slate-100">{scene.captions.map((caption) => caption.text).join(" | ")}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">Visual moves</p>
          <p className="mt-2 text-sm text-slate-100">{describeZooms(scene.zooms)}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">Highlights</p>
          <p className="mt-2 text-sm text-slate-100">{describeHighlights(scene.highlights)}</p>
        </div>
      ))}
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-7 text-slate-100">{value}</p>
    </div>
  );
}

function describeZooms(zooms: EditPlanRecord["scenes"][number]["zooms"]) {
  if (!zooms.length) {
    return "No zoom move planned for this scene.";
  }
  return zooms
    .map((zoom) => {
      const box = zoom.focus_box ? " with detected UI box" : "";
      return `${zoom.focus_region} at ${zoom.scale.toFixed(2)}x (${(zoom.confidence * 100).toFixed(0)}%)${box}`;
    })
    .join(" | ");
}

function describeHighlights(highlights: EditPlanRecord["scenes"][number]["highlights"]) {
  if (!highlights.length) {
    return "No additional highlight needed.";
  }
  return highlights
    .map((highlight) => {
      const box = highlight.focus_box ? " anchored to detected target" : "";
      return `${highlight.style}: ${highlight.label} (${(highlight.confidence * 100).toFixed(0)}%)${box}`;
    })
    .join(" | ");
}
