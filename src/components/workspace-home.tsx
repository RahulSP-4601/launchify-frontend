"use client";

import { ChangeEvent, FormEvent } from "react";

import { CreateProjectInput, ProjectSummary } from "@/lib/types";

export type CreateProjectWorkspace = {
  createError: string;
  createMutation: { isPending: boolean; mutate: (input: { file: File; project: CreateProjectInput }) => void };
  dismissCreateFlow: () => void;
  projectForm: CreateProjectInput;
  resetCreateFlow: () => void;
  setProjectForm: (input: CreateProjectInput) => void;
  uploadFile: File | null;
  setUploadFile: (file: File | null) => void;
};

export type ProjectTileWorkspace = {
  projects: ProjectSummary[];
};

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
        <ModalHeader
          onClose={() => {
            workspace.dismissCreateFlow();
            onClose();
          }}
        />
        <form className="mt-8 space-y-5" onSubmit={(event) => handleCreateProject(event, workspace)}>
          <FormInput
            label="Project name"
            value={workspace.projectForm.project_name}
            onValueChange={(value) => updateForm(workspace, value)}
          />
          <UploadInput
            file={workspace.uploadFile}
            onChange={(event) => workspace.setUploadFile(event.target.files?.[0] ?? null)}
          />
          <button
            className="w-full rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={!workspace.projectForm.project_name.trim() || !workspace.uploadFile || workspace.createMutation.isPending}
            type="submit"
          >
            {workspace.createMutation.isPending ? "Creating project..." : "Create project"}
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
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Add the project name and the raw video upload. Launchify will open the preview workspace right after.
        </p>
      </div>
      <button
        className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-[var(--launchify-accent)] transition hover:bg-[var(--launchify-accent)] hover:text-white"
        onClick={onClose}
        type="button"
      >
        Close
      </button>
    </div>
  );
}

function UploadInput({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-600">
      Raw video
      <div className="mt-2 rounded-[24px] border border-dashed border-black/10 bg-[#fbfcfe] p-4">
        <input
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-white"
          onChange={onChange}
          type="file"
        />
        <p className="mt-3 text-sm text-slate-500">
          {file ? `${file.name} selected` : "Upload the raw walkthrough video used for the preview pipeline."}
        </p>
      </div>
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

function updateForm(workspace: CreateProjectWorkspace, project_name: string) {
  workspace.setProjectForm({ project_name });
}

function handleCreateProject(
  event: FormEvent<HTMLFormElement>,
  workspace: CreateProjectWorkspace,
) {
  event.preventDefault();
  if (!workspace.uploadFile) {
    return;
  }
  workspace.createMutation.mutate({ file: workspace.uploadFile, project: workspace.projectForm });
}
