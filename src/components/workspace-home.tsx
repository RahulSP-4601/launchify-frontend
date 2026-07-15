"use client";

import { FormEvent } from "react";

import { CreateProjectInput, ProjectSummary } from "@/lib/types";

const gradients = [
  "bg-[linear-gradient(135deg,#ef233c_0%,#111111_100%)]",
  "bg-[linear-gradient(135deg,#2563eb_0%,#111111_100%)]",
  "bg-[linear-gradient(135deg,#111111_0%,#ef233c_100%)]",
];

export type CreateProjectWorkspace = {
  createMutation: { isPending: boolean; mutate: (input: CreateProjectInput) => void };
  projectForm: CreateProjectInput;
  setProjectForm: (input: CreateProjectInput) => void;
};

type HomeWorkspace = {
  projects: ProjectSummary[];
  setSelectedProjectId: (projectId: string) => void;
};

export function HomeDashboard({
  onBrowseTemplates,
  onOpenCreate,
  onOpenProject,
  workspace,
}: {
  onBrowseTemplates: () => void;
  onOpenCreate: () => void;
  onOpenProject: (projectId: string) => void;
  workspace: HomeWorkspace;
}) {
  return (
    <div className="grid gap-5 p-5">
      <HomeHero onBrowseTemplates={onBrowseTemplates} onOpenCreate={onOpenCreate} />
      <HomeTemplateStrip onBrowseTemplates={onBrowseTemplates} />
      <HomeRecentProjects onOpenProject={onOpenProject} workspace={workspace} />
    </div>
  );
}

function HomeHero({
  onBrowseTemplates,
  onOpenCreate,
}: {
  onBrowseTemplates: () => void;
  onOpenCreate: () => void;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <article className="rounded-[30px] border border-black/6 bg-[#fafbfc] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--launchify-accent)]">Home</p>
        <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">Create launch-ready videos from one clean workspace.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-500">
          Use templates, create a new project, upload a rough walkthrough, and let Launchify
          push it through transcript, script, edit planning, quality control, and export.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white" onClick={onOpenCreate} type="button">
            New project
          </button>
          <button className="rounded-[18px] border border-black/8 bg-white px-5 py-3 text-sm font-semibold text-slate-900" onClick={onBrowseTemplates} type="button">
            Explore templates
          </button>
        </div>
      </article>
      <article className="rounded-[30px] bg-[#111111] p-6 text-white">
        <p className="text-xs uppercase tracking-[0.25em] text-white/45">Trial usage</p>
        <p className="mt-5 text-4xl font-black tracking-[-0.05em]">0 mins / 10 mins</p>
        <p className="mt-3 text-sm leading-7 text-white/66">Modeled after the Clueso-style trial flow, without payments enabled yet.</p>
        <div className="mt-4 h-2 rounded-full bg-white/10">
          <div className="h-2 w-1/12 rounded-full bg-[var(--launchify-accent)]" />
        </div>
      </article>
    </section>
  );
}

function HomeTemplateStrip({ onBrowseTemplates }: { onBrowseTemplates: () => void }) {
  return (
    <section className="rounded-[30px] border border-black/6 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Templates</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Start from a polished pattern</h3>
        </div>
        <button className="rounded-[18px] border border-black/8 bg-[#fafbfc] px-4 py-2 text-sm font-semibold text-slate-900" onClick={onBrowseTemplates} type="button">
          View all
        </button>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {["Feature Launch", "Explainer", "How-to Walkthrough"].map((title, index) => (
          <TemplatePreviewCard index={index} key={title} title={title} />
        ))}
      </div>
    </section>
  );
}

function TemplatePreviewCard({ index, title }: { index: number; title: string }) {
  return (
    <article className="overflow-hidden rounded-[26px] border border-black/6 bg-[#fafbfc]">
      <div className={`h-36 ${gradients[index % gradients.length]} px-5 py-5 text-white`}>
        <p className="text-xs uppercase tracking-[0.25em] text-white/66">Launchify</p>
        <h4 className="mt-8 text-2xl font-black leading-tight">{title}</h4>
      </div>
      <div className="px-4 py-4">
        <p className="text-sm text-slate-500">A reusable workflow for consistent AI-driven product storytelling.</p>
      </div>
    </article>
  );
}

function HomeRecentProjects({
  onOpenProject,
  workspace,
}: {
  onOpenProject: (projectId: string) => void;
  workspace: HomeWorkspace;
}) {
  return (
    <section className="rounded-[30px] border border-black/6 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Recent Projects</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Jump back into active work</h3>
        </div>
        <p className="text-sm text-slate-400">{workspace.projects.length} total</p>
      </div>
      <div className="mt-5 grid gap-3">
        {workspace.projects.length ? workspace.projects.slice(0, 4).map((project) => (
          <RecentProjectButton key={project.id} onOpenProject={onOpenProject} project={project} />
        )) : <p className="rounded-[22px] border border-dashed border-black/10 bg-[#fafbfc] px-4 py-6 text-sm text-slate-400">No projects yet. Create one to start the Launchify pipeline.</p>}
      </div>
    </section>
  );
}

function RecentProjectButton({
  onOpenProject,
  project,
}: {
  onOpenProject: (projectId: string) => void;
  project: ProjectSummary;
}) {
  return (
    <button
      className="flex items-center justify-between rounded-[22px] border border-black/6 bg-[#fafbfc] px-4 py-4 text-left"
      onClick={() => onOpenProject(project.id)}
      type="button"
    >
      <div>
        <p className="font-semibold text-slate-900">{project.project_name}</p>
        <p className="mt-1 text-sm text-slate-400">{project.product_name}</p>
      </div>
      <StatusBadge status={project.status} />
    </button>
  );
}

export function CreateProjectModal({
  onClose,
  workspace,
}: {
  onClose: () => void;
  workspace: CreateProjectWorkspace;
}) {
  return (
    <div className="absolute inset-0 z-30 bg-slate-950/18 backdrop-blur-[2px]">
      <div className="absolute right-4 top-4 w-full max-w-xl rounded-[30px] border border-black/6 bg-white p-6 shadow-[0_30px_120px_rgba(15,23,42,0.18)]">
        <ModalHeader onClose={onClose} />
        <form className="mt-6 space-y-3" onSubmit={(event) => handleCreateProject(event, workspace)}>
          <FormInput label="Project name" value={workspace.projectForm.project_name} onValueChange={(value) => updateForm(workspace, "project_name", value)} />
          <FormInput label="Product name" value={workspace.projectForm.product_name} onValueChange={(value) => updateForm(workspace, "product_name", value)} />
          <FormInput label="Target audience" value={workspace.projectForm.target_audience} onValueChange={(value) => updateForm(workspace, "target_audience", value)} />
          <FormInput label="Video goal" value={workspace.projectForm.video_goal} onValueChange={(value) => updateForm(workspace, "video_goal", value)} />
          <DescriptionInput workspace={workspace} />
          <button className="w-full rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white" disabled={workspace.createMutation.isPending} type="submit">
            {workspace.createMutation.isPending ? "Creating..." : "Create project"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--launchify-accent)]">New Project</p>
        <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">Create a launch-ready project</h3>
        <p className="mt-3 text-sm leading-7 text-slate-500">Mirror the Clueso-style project entry point, then continue in the Launchify workspace.</p>
      </div>
      <button className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600" onClick={onClose} type="button">
        Close
      </button>
    </div>
  );
}

function DescriptionInput({ workspace }: { workspace: CreateProjectWorkspace }) {
  return (
    <label className="block text-sm text-slate-600">
      Product description
      <textarea
        className="mt-2 min-h-24 w-full rounded-[18px] border border-black/8 bg-white px-4 py-3 text-sm outline-none"
        value={workspace.projectForm.product_description}
        onChange={(event) => updateForm(workspace, "product_description", event.target.value)}
      />
    </label>
  );
}

function FormInput({
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <input
        className="mt-2 w-full rounded-[18px] border border-black/8 bg-white px-4 py-3 text-sm outline-none"
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

export function StatusBadge({ status }: { status: ProjectSummary["status"] }) {
  const palette: Record<ProjectSummary["status"], string> = {
    draft: "bg-slate-200/10 text-slate-600 border border-slate-200",
    queued: "bg-violet-100 text-violet-700 border border-violet-200",
    uploading: "bg-sky-100 text-sky-700 border border-sky-200",
    transcribing: "bg-amber-100 text-amber-700 border border-amber-200",
    scripting: "bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200",
    planning: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    rendering: "bg-orange-100 text-orange-700 border border-orange-200",
    ready: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    failed: "bg-rose-100 text-rose-700 border border-rose-200",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${palette[status]}`}>{status}</span>;
}

function updateForm(
  workspace: CreateProjectWorkspace,
  key: keyof CreateProjectInput,
  value: string,
) {
  workspace.setProjectForm({ ...workspace.projectForm, [key]: value });
}

function handleCreateProject(
  event: FormEvent<HTMLFormElement>,
  workspace: CreateProjectWorkspace,
) {
  event.preventDefault();
  workspace.createMutation.mutate(workspace.projectForm);
}
