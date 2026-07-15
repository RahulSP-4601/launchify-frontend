"use client";

import { FormEvent } from "react";

import { CreateProjectInput, ProjectSummary } from "@/lib/types";

export type CreateProjectWorkspace = {
  createError: string;
  createMutation: { isPending: boolean; mutate: (input: CreateProjectInput) => void };
  projectForm: CreateProjectInput;
  setProjectForm: (input: CreateProjectInput) => void;
};

type HomeWorkspace = {
  projects: ProjectSummary[];
  setSelectedProjectId: (projectId: string) => void;
};

export function HomeDashboard({
  onOpenCreate,
  onOpenProject,
  workspace,
}: {
  onOpenCreate: () => void;
  onOpenProject: (projectId: string) => void;
  workspace: HomeWorkspace;
}) {
  return (
    <div className="grid gap-5 p-5">
      <HomeHero onOpenCreate={onOpenCreate} />
      <HomeRecentProjects onOpenProject={onOpenProject} workspace={workspace} />
    </div>
  );
}

function HomeHero({
  onOpenCreate,
}: {
  onOpenCreate: () => void;
}) {
  return (
    <section className="rounded-[34px] border border-black/6 bg-[linear-gradient(135deg,#fff8f8_0%,#ffffff_52%,#f4f7fb_100%)] p-6 lg:p-8">
      <article className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--launchify-accent)]">Home</p>
        <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">Create launch-ready videos from one clean workspace.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-500">
          Create a new project, upload a rough walkthrough, and move it through transcript,
          script, edit planning, quality control, and export from one simple workflow.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white" onClick={onOpenCreate} type="button">
            New project
          </button>
        </div>
        <div className="mt-8 grid gap-3 lg:grid-cols-3">
          {[
            "Create a project from the top-right action.",
            "Select a project to continue scripting and production.",
            "Keep every launch asset inside one workspace.",
          ].map((item) => (
            <div key={item} className="rounded-[24px] border border-black/6 bg-white/80 px-4 py-4 text-sm text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              {item}
            </div>
          ))}
        </div>
      </article>
    </section>
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
    <div className="absolute inset-0 z-30 grid place-items-center bg-slate-950/22 p-4 backdrop-blur-[4px]">
      <div className="w-full max-w-2xl rounded-[34px] border border-black/6 bg-white p-6 shadow-[0_40px_140px_rgba(15,23,42,0.22)] lg:p-8">
        <ModalHeader onClose={onClose} />
        <form className="mt-8 space-y-5" onSubmit={(event) => handleCreateProject(event, workspace)}>
          <FormInput label="Project name" value={workspace.projectForm.project_name} onValueChange={(value) => updateForm(workspace, "project_name", value)} />
          <FormInput label="Product name" value={workspace.projectForm.product_name} onValueChange={(value) => updateForm(workspace, "product_name", value)} />
          <FormInput label="Target audience" value={workspace.projectForm.target_audience} onValueChange={(value) => updateForm(workspace, "target_audience", value)} />
          <FormInput label="Video goal" value={workspace.projectForm.video_goal} onValueChange={(value) => updateForm(workspace, "video_goal", value)} />
          <DescriptionInput workspace={workspace} />
          <button className="w-full rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white" disabled={workspace.createMutation.isPending} type="submit">
            {workspace.createMutation.isPending ? "Creating..." : "Create project"}
          </button>
          {workspace.createError ? <p className="text-sm text-rose-600">{workspace.createError}</p> : null}
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
        <p className="mt-3 text-sm leading-7 text-slate-500">Set up the basics here, then continue inside the project workspace.</p>
      </div>
      <button className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-[var(--launchify-accent)] transition hover:bg-[var(--launchify-accent)] hover:text-white" onClick={onClose} type="button">
        Close
      </button>
    </div>
  );
}

function DescriptionInput({ workspace }: { workspace: CreateProjectWorkspace }) {
  return (
    <label className="block text-sm font-medium text-slate-600">
      Product description
      <textarea
        className="mt-2 min-h-32 w-full rounded-[20px] border border-black/8 bg-[#fbfcfe] px-4 py-3 text-sm outline-none transition focus:border-[var(--launchify-accent)] focus:bg-white"
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
    <label className="block text-sm font-medium text-slate-600">
      {label}
      <input
        className="mt-2 w-full rounded-[20px] border border-black/8 bg-[#fbfcfe] px-4 py-3 text-sm outline-none transition focus:border-[var(--launchify-accent)] focus:bg-white"
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
