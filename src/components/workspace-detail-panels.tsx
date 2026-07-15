import { LaunchScriptRecord, TranscriptResponse } from "@/lib/types";

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

export function EmptyState() {
  return (
    <div className="grid min-h-[520px] place-items-center rounded-[30px] border border-dashed border-black/10 bg-[linear-gradient(135deg,#fff9f9_0%,#ffffff_50%,#f7f9fc_100%)] p-10 text-center">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--launchify-accent)]">No project selected</p>
        <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">Choose a project to continue your launch workflow.</h2>
        <p className="mt-4 text-sm leading-8 text-slate-500">Use the project list on the left, or create a new project from the top-right button when you are ready to start something new.</p>
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
