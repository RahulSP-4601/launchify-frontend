"use client";

import { useEffect, useState } from "react";

import {
  ProjectDetail,
  SceneOverrideRecord,
  TemplateConfigRecord,
  UpdatePhaseFourInput,
  VoiceoverRecord,
} from "@/lib/types";

const defaultTemplateConfig: TemplateConfigRecord = {
  theme: "clean",
  caption_profile: "product",
  motion_profile: "balanced",
};

export function PhaseFourCard({
  isSaving,
  onSave,
  project,
  saveError,
}: {
  isSaving: boolean;
  onSave: (input: UpdatePhaseFourInput) => void;
  project: ProjectDetail;
  saveError: string | undefined;
}) {
  const [templateConfig, setTemplateConfig] = useState<TemplateConfigRecord>(project.template_config ?? defaultTemplateConfig);
  const [voiceoverMode, setVoiceoverMode] = useState<VoiceoverRecord["mode"]>(project.voiceover?.mode ?? "original");
  const [sceneOverrides, setSceneOverrides] = useState<SceneOverrideRecord[]>(overrideState(project));

  useEffect(() => {
    syncProjectState(project, setTemplateConfig, setVoiceoverMode, setSceneOverrides);
  }, [project]);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <p className="text-sm font-semibold text-slate-100">Phase 4 quality control</p>
      <p className="mt-2 text-sm text-slate-300">
        This layer tunes theme, motion, captions, voiceover, and manual corrections so the output
        feels intentional instead of just technically correct.
      </p>
      <TemplateControls templateConfig={templateConfig} onChange={setTemplateConfig} />
      <VoiceoverControls
        onVoiceoverModeChange={setVoiceoverMode}
        voiceoverMode={voiceoverMode}
      />
      <SceneOverridesEditor overrides={sceneOverrides} onChange={setSceneOverrides} />
      <button
        className="mt-4 rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
        disabled={isSaving || !project.edit_plan}
        onClick={() => onSave(buildInput(templateConfig, sceneOverrides, voiceoverMode))}
        type="button"
      >
        {isSaving ? "Saving Phase 4..." : "Apply Phase 4 updates"}
      </button>
      {saveError ? <p className="mt-3 text-sm text-rose-300">{saveError}</p> : null}
      <QualityReport project={project} />
      <BenchmarkPanel project={project} />
      <VoiceoverPanel project={project} />
    </div>
  );
}

function syncProjectState(
  project: ProjectDetail,
  setTemplateConfig: (value: TemplateConfigRecord) => void,
  setVoiceoverMode: (value: VoiceoverRecord["mode"]) => void,
  setSceneOverrides: (value: SceneOverrideRecord[]) => void,
) {
  setTemplateConfig(project.template_config ?? defaultTemplateConfig);
  setVoiceoverMode(project.voiceover?.mode ?? "original");
  setSceneOverrides(overrideState(project));
}

function SelectField({
  label,
  onValueChange,
  options,
  value,
}: {
  label: string;
  onValueChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="block text-sm text-slate-200">
      {label}
      <select
        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TemplateControls({
  onChange,
  templateConfig,
}: {
  onChange: (value: TemplateConfigRecord) => void;
  templateConfig: TemplateConfigRecord;
}) {
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      <SelectField
        label="Theme"
        value={templateConfig.theme}
        onValueChange={(value) => onChange({ ...templateConfig, theme: value as TemplateConfigRecord["theme"] })}
        options={["clean", "spotlight", "bold"]}
      />
      <SelectField
        label="Caption profile"
        value={templateConfig.caption_profile}
        onValueChange={(value) => onChange({ ...templateConfig, caption_profile: value as TemplateConfigRecord["caption_profile"] })}
        options={["product", "minimal", "cinematic"]}
      />
      <SelectField
        label="Motion profile"
        value={templateConfig.motion_profile}
        onValueChange={(value) => onChange({ ...templateConfig, motion_profile: value as TemplateConfigRecord["motion_profile"] })}
        options={["balanced", "dynamic", "calm"]}
      />
    </div>
  );
}

function VoiceoverControls({
  onVoiceoverModeChange,
  voiceoverMode,
}: {
  onVoiceoverModeChange: (value: VoiceoverRecord["mode"]) => void;
  voiceoverMode: VoiceoverRecord["mode"];
}) {
  return (
    <div className="mt-4">
      <label className="block text-sm text-slate-200">
        Voiceover mode
        <select
          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
          value={voiceoverMode}
          onChange={(event) => onVoiceoverModeChange(event.target.value as VoiceoverRecord["mode"])}
        >
          <option value="original">Original audio</option>
          <option value="mixed">Mixed with AI voice</option>
          <option value="voiceover">AI voiceover</option>
        </select>
      </label>
    </div>
  );
}

function SceneOverridesEditor({
  onChange,
  overrides,
}: {
  onChange: (value: SceneOverrideRecord[]) => void;
  overrides: SceneOverrideRecord[];
}) {
  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Manual correction editor</p>
      <div className="mt-3 space-y-3">
        {overrides.map((override, index) => (
          <SceneOverrideRow key={override.scene_number} index={index} override={override} onChange={onChange} overrides={overrides} />
        ))}
      </div>
    </div>
  );
}

function SceneOverrideRow({
  index,
  onChange,
  override,
  overrides,
}: {
  index: number;
  onChange: (value: SceneOverrideRecord[]) => void;
  override: SceneOverrideRecord;
  overrides: SceneOverrideRecord[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3">
      <p className="text-sm font-medium text-slate-100">Scene {override.scene_number}</p>
      <textarea
        className="mt-3 min-h-20 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none"
        value={override.caption_override}
        onChange={(event) => onChange(updateSceneOverride(overrides, index, "caption_override", event.target.value))}
        placeholder="Caption override"
      />
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <TextField
          label="Scene title override"
          value={override.title}
          onChange={(value) => onChange(updateSceneOverride(overrides, index, "title", value))}
        />
        <TextField
          label="On-screen text override"
          value={override.on_screen_text}
          onChange={(value) => onChange(updateSceneOverride(overrides, index, "on_screen_text", value))}
        />
      </div>
      <TextAreaField
        label="Spoken line override"
        value={override.spoken_line}
        onChange={(value) => onChange(updateSceneOverride(overrides, index, "spoken_line", value))}
      />
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <ToggleField label="Force zoom" value={override.force_zoom} onChange={(value) => onChange(updateSceneOverride(overrides, index, "force_zoom", value))} />
        <ToggleField label="Force highlight" value={override.force_highlight} onChange={(value) => onChange(updateSceneOverride(overrides, index, "force_highlight", value))} />
      </div>
      <TextAreaField
        label="Reviewer notes"
        value={override.notes}
        onChange={(value) => onChange(updateSceneOverride(overrides, index, "notes", value))}
      />
    </div>
  );
}

function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block text-sm text-slate-200">
      {label}
      <input
        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="mt-3 block text-sm text-slate-200">
      {label}
      <textarea
        className="mt-2 min-h-16 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ToggleField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: boolean | null) => void;
  value: boolean | null;
}) {
  return (
    <label className="block text-sm text-slate-200">
      {label}
      <select
        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm"
        value={String(value)}
        onChange={(event) => onChange(parseToggleValue(event.target.value))}
      >
        <option value="null">Auto</option>
        <option value="true">Force on</option>
        <option value="false">Force off</option>
      </select>
    </label>
  );
}

function QualityReport({ project }: { project: ProjectDetail }) {
  const report = project.quality_report;
  if (!report) {
    return <p className="mt-4 text-sm text-slate-400">Quality report will appear after planning finishes.</p>;
  }
  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Quality report</p>
      <p className="mt-2 text-lg font-semibold text-slate-100">
        Score {report.score}/100 {report.ready_for_export ? "• ready for export" : "• needs refinement"}
      </p>
      <p className="mt-2 text-sm text-slate-300">{report.summary}</p>
      <div className="mt-3 space-y-2">
        {report.issues.map((issue) => (
          <div key={`${issue.code}-${issue.scene_number ?? "global"}`} className="rounded-2xl border border-white/10 bg-slate-900/80 p-3">
            <p className="text-sm font-medium text-slate-100">
              {issue.severity.toUpperCase()} {issue.scene_number ? `• Scene ${issue.scene_number}` : "• Project"}
            </p>
            <p className="mt-1 text-sm text-slate-300">{issue.message}</p>
            <p className="mt-1 text-sm text-cyan-300">{issue.suggestion}</p>
          </div>
        ))}
        {!report.issues.length ? <p className="text-sm text-emerald-300">No blocking quality issues found.</p> : null}
      </div>
    </div>
  );
}

function VoiceoverPanel({ project }: { project: ProjectDetail }) {
  const voiceover = project.voiceover;
  if (!voiceover) {
    return null;
  }
  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Voiceover lane</p>
      <p className="mt-2 text-sm text-slate-100">
        {voiceover.provider} / {voiceover.model} / {voiceover.status}
      </p>
      <p className="mt-2 text-sm text-slate-300">
        {voiceover.script || "Voiceover script will appear here once a script is available."}
      </p>
      <p className="mt-2 text-sm text-slate-400">
        {voiceover.cues.length} cues • {voiceover.duration_seconds.toFixed(2)}s
      </p>
    </div>
  );
}

function BenchmarkPanel({ project }: { project: ProjectDetail }) {
  const report = project.benchmark_report;
  if (!report) {
    return null;
  }
  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Benchmark report</p>
      <p className="mt-2 text-lg font-semibold text-slate-100">
        {report.overall_score}/100 • {report.verdict}
      </p>
      <div className="mt-3 space-y-2">
        {report.metrics.map((metric) => (
          <div key={metric.name} className="rounded-2xl border border-white/10 bg-slate-900/80 p-3">
            <p className="text-sm font-medium text-slate-100">
              {metric.name} • {Math.round(metric.score * 100)}%
            </p>
            <p className="mt-1 text-sm text-slate-300">{metric.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildInput(
  templateConfig: TemplateConfigRecord,
  sceneOverrides: SceneOverrideRecord[],
  voiceoverMode: VoiceoverRecord["mode"],
): UpdatePhaseFourInput {
  return {
    template_config: templateConfig,
    manual_overrides: {
      scenes: sceneOverrides,
      updated_at: new Date().toISOString(),
    },
    voiceover_mode: voiceoverMode,
  };
}

function overrideState(project: ProjectDetail): SceneOverrideRecord[] {
  if (project.manual_overrides?.scenes.length) {
    return project.manual_overrides.scenes;
  }
  return (project.edit_plan?.scenes ?? []).map((scene) => ({
    scene_number: scene.scene_number,
    title: "",
    spoken_line: "",
    on_screen_text: "",
    caption_override: "",
    force_zoom: null,
    force_highlight: null,
    notes: "",
  }));
}

function updateSceneOverride(
  overrides: SceneOverrideRecord[],
  index: number,
  key:
    | "caption_override"
    | "force_zoom"
    | "force_highlight"
    | "title"
    | "spoken_line"
    | "on_screen_text"
    | "notes",
  value: string | boolean | null,
): SceneOverrideRecord[] {
  return overrides.map((override, currentIndex) =>
    currentIndex === index ? { ...override, [key]: value } : override,
  );
}

function parseToggleValue(value: string): boolean | null {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
}
