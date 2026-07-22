"use client";

import { CreateProjectModal, StatusBadge } from "@/components/workspace-home";
import { UploadProgressModal } from "@/components/upload-progress-modal";
import { AuthenticationRecoveryCard } from "@/components/workspace-auth-recovery";
import { useProjectsWorkspace } from "@/components/projects-workspace-state";
import { DashboardSection, useDashboardStore } from "@/lib/dashboard-store";
import { ProjectSummary } from "@/lib/types";

export function ProjectsWorkspace({ section }: { section: DashboardSection }) {
  const workspace = useProjectsWorkspace();
  const { createProjectOpen, setCreateProjectOpen } = useDashboardStore();

  if (section !== "projects") {
    return null;
  }

  return (
    <>
      <div className="space-y-6 p-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--launchify-accent)]">Projects</p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.05em] text-slate-950">Project library</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                Keep the dashboard simple: create a project, upload the raw video, and open the dedicated preview workspace.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start lg:self-auto">
              <p className="rounded-full border border-black/8 bg-[#fbfcfe] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {workspace.projects.length} projects
              </p>
              <button
                className="rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(239,35,60,0.2)]"
                onClick={() => setCreateProjectOpen(true)}
                type="button"
              >
                New project
              </button>
            </div>
          </div>
        </header>
        {workspace.authError ? <AuthenticationRecoveryCard message={workspace.authError} /> : null}
        <section className="space-y-4">
          {workspace.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {!workspace.projects.length ? <EmptyProjectsState onOpen={() => setCreateProjectOpen(true)} /> : null}
        </section>
      </div>
      {workspace.uploadOverlay.active ? <UploadProgressModal uploadOverlay={workspace.uploadOverlay} /> : null}
      {createProjectOpen ? <CreateProjectModal onClose={() => setCreateProjectOpen(false)} workspace={workspace} /> : null}
    </>
  );
}

function EmptyProjectsState({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="rounded-[32px] border border-dashed border-[var(--launchify-accent)]/30 bg-[linear-gradient(135deg,#fff7f8_0%,#ffffff_58%,#f4f8fb_100%)] p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--launchify-accent)]">New project</p>
        <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950">Start with a raw video.</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Add the name, upload the source file, and jump straight into the big preview workspace.
        </p>
      </div>
      <button
        className="mt-6 inline-flex rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(239,35,60,0.18)]"
        onClick={onOpen}
        type="button"
      >
        Create project
      </button>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <button
      className="flex w-full flex-col gap-5 rounded-[28px] border border-black/6 bg-white p-6 text-left shadow-[0_20px_50px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)] xl:flex-row xl:items-center xl:justify-between"
      onClick={() => openProject(project.id)}
      type="button"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="max-w-[20rem] text-2xl font-black tracking-[-0.04em] text-slate-950 xl:max-w-none">{project.project_name}</p>
          <div className="xl:hidden">
            <StatusBadge status={project.status} />
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-500">
          {project.has_preview_video
            ? "Preview ready to review."
            : project.has_transcript
              ? "Processing is underway and the preview workspace is available."
            : "Raw upload flow started. Open the workspace to follow progress."}
        </p>
      </div>
      <div className="flex flex-col gap-4 xl:min-w-[540px] xl:max-w-[620px] xl:flex-row xl:items-center xl:justify-end">
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-500 xl:min-w-[420px]">
          <InfoChip label="Transcript" value={project.has_transcript ? "Ready" : "Pending"} />
          <InfoChip label="Preview" value={project.has_preview_video ? "Ready" : "Pending"} />
          <InfoChip label="Script" value={project.has_launch_script ? "Ready" : "Pending"} />
          <InfoChip label="Quality" value={project.has_quality_report ? "Ready" : "Pending"} />
        </div>
        <div className="flex items-center justify-between gap-3 xl:flex-col xl:items-end">
          <StatusBadge status={project.status} />
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
            Open project workspace
          </p>
        </div>
      </div>
    </button>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#f8fafc] px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function openProject(projectId: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.location.assign(`/projects/${projectId}`);
}
