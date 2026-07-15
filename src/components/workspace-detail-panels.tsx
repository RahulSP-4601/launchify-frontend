import { LaunchScriptRecord, TranscriptResponse } from "@/lib/types";

const templateCards = [
  "Feature Launch",
  "Explainer",
  "Product Walkthrough",
  "Training Video",
  "Onboarding Tour",
  "Changelog Update",
];

export function TranscriptCard({ transcript }: { transcript: TranscriptResponse["transcript"] }) {
  return (
    <div className="rounded-[28px] border border-black/6 bg-white p-5">
      <p className="text-sm font-semibold text-slate-900">Transcript</p>
      <div className="mt-4 space-y-3">
        {transcript.length ? transcript.map((segment, index) => <TranscriptSegmentCard key={`${segment.start}-${index}`} segment={segment} />) : <p className="text-sm text-slate-400">Transcript will appear here once processing finishes.</p>}
      </div>
    </div>
  );
}

export function LaunchScriptCard({
  launchScript,
  projectError,
}: {
  launchScript: LaunchScriptRecord | null;
  projectError: string;
}) {
  return (
    <div className="rounded-[28px] border border-black/6 bg-white p-5">
      <p className="text-sm font-semibold text-slate-900">Launch script</p>
      {launchScript ? (
        <div className="mt-4 space-y-4">
          <ScriptBlock label="Hook" value={launchScript.hook} />
          <ScriptBlock label="Summary" value={launchScript.summary} />
          <SceneList scenes={launchScript.scenes} />
          <ScriptBlock label="CTA" value={launchScript.cta} />
          {launchScript.title_options.length ? <ScriptBlock label="Title options" value={launchScript.title_options.join(" | ")} /> : null}
          {launchScript.notes.length ? <ScriptBlock label="Notes" value={launchScript.notes.join(" | ")} /> : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">{projectError || "Structured launch script will appear here once transcript rewriting finishes."}</p>
      )}
    </div>
  );
}

export function TemplatesGallery({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid gap-5 p-5">
      <section className="flex items-center justify-between rounded-[28px] border border-black/6 bg-[#fafbfc] p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--launchify-accent)]">Templates</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">Pick a Clueso-style launch starting point.</h2>
        </div>
        <button className="rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white" onClick={onCreate} type="button">
          Use in project
        </button>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        {templateCards.map((template, index) => (
          <article key={template} className="overflow-hidden rounded-[28px] border border-black/6 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
            <div className={`h-40 ${templateGradient(index)} px-6 py-6 text-white`}>
              <p className="text-sm uppercase tracking-[0.24em] text-white/70">Launchify template</p>
              <h3 className="mt-8 text-3xl font-black leading-tight">{template}</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm leading-7 text-slate-500">Built to accelerate a product-marketing or education workflow with Launchify’s motion, caption, and export pipeline.</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="grid min-h-[520px] place-items-center rounded-[30px] border border-dashed border-black/10 bg-white p-10 text-center">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--launchify-accent)]">No project selected</p>
        <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">Create a Launchify project to start generating Clueso-style assets.</h2>
        <p className="mt-4 text-sm leading-8 text-slate-500">Use the left-side project creation panel to create a workspace, upload a raw recording, and push it through the transcript, script, quality, and export pipeline.</p>
      </div>
    </div>
  );
}

function SceneList({ scenes }: { scenes: LaunchScriptRecord["scenes"] }) {
  return (
    <div className="space-y-3">
      {scenes.map((scene) => (
        <div key={scene.scene_number} className="rounded-[22px] border border-black/6 bg-[#fafbfc] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scene {scene.scene_number}</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{scene.purpose}</p>
          <p className="mt-2 text-sm text-slate-700">{scene.spoken_line}</p>
          <p className="mt-2 text-sm text-[var(--launchify-accent)]">{scene.on_screen_text}</p>
          <p className="mt-2 text-xs text-slate-400">{scene.source_excerpt}</p>
        </div>
      ))}
    </div>
  );
}

function ScriptBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-black/6 bg-[#fafbfc] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-7 text-slate-900">{value}</p>
    </div>
  );
}

function TranscriptSegmentCard({ segment }: { segment: TranscriptResponse["transcript"][number] }) {
  return (
    <div className="rounded-[22px] border border-black/6 bg-[#fafbfc] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {segment.start.toFixed(2)}s - {segment.end.toFixed(2)}s
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-900">{segment.text}</p>
    </div>
  );
}

function templateGradient(index: number) {
  const gradients = [
    "bg-[linear-gradient(135deg,#ef233c_0%,#111111_100%)]",
    "bg-[linear-gradient(135deg,#111111_0%,#ef233c_100%)]",
    "bg-[linear-gradient(135deg,#1f2937_0%,#ef233c_100%)]",
  ];
  return gradients[index % gradients.length];
}
