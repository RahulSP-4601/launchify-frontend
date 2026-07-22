"use client";

import { useState } from "react";

import { CreateProjectModal, StatusBadge } from "@/components/workspace-home";
import { UploadProgressModal } from "@/components/upload-progress-modal";
import { AuthenticationRecoveryCard } from "@/components/workspace-auth-recovery";
import { useProjectsWorkspace } from "@/components/projects-workspace-state";
import { DashboardSection, useDashboardStore } from "@/lib/dashboard-store";
import { ProjectSummary } from "@/lib/types";

export function ProjectsWorkspace({ section }: { section: DashboardSection }) {
  const workspace = useProjectsWorkspace();
  const { createProjectOpen, setCreateProjectOpen } = useDashboardStore();
  const [searchTerm, setSearchTerm] = useProjectsSearch();

  if (section !== "projects") {
    return null;
  }

  const visibleProjects = workspace.projects.filter((project) =>
    project.project_name.toLowerCase().includes(searchTerm.toLowerCase().trim()),
  );

  return (
    <>
      <div className="space-y-6 p-6">
        <ProjectsHeader
          count={visibleProjects.length}
          onCreateProject={() => setCreateProjectOpen(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        {workspace.authError ? <AuthenticationRecoveryCard message={workspace.authError} /> : null}
        <ProjectsList
          hasProjects={workspace.projects.length > 0}
          onCreateProject={() => setCreateProjectOpen(true)}
          projects={visibleProjects}
        />
      </div>
      {workspace.uploadOverlay.active ? <UploadProgressModal uploadOverlay={workspace.uploadOverlay} /> : null}
      {createProjectOpen ? <CreateProjectModal onClose={() => setCreateProjectOpen(false)} workspace={workspace} /> : null}
    </>
  );
}

function ProjectsHeader({
  count,
  onCreateProject,
  searchTerm,
  setSearchTerm,
}: {
  count: number;
  onCreateProject: () => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}) {
  return (
    <header className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--launchify-accent)]">Projects</p>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-4xl font-black tracking-[-0.05em] text-slate-950">Project library</h1>
        <div className="flex flex-1 xl:max-w-xl xl:px-6">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>
        <div className="flex items-center gap-3 self-start xl:self-auto">
          <p className="rounded-full border border-black/8 bg-[#fbfcfe] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {count} projects
          </p>
          <button
            className="rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(239,35,60,0.2)]"
            onClick={onCreateProject}
            type="button"
          >
            New project
          </button>
        </div>
      </div>
    </header>
  );
}

function ProjectsList({
  hasProjects,
  onCreateProject,
  projects,
}: {
  hasProjects: boolean;
  onCreateProject: () => void;
  projects: ProjectSummary[];
}) {
  return (
    <section className="space-y-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
      {!hasProjects ? <EmptyProjectsState onOpen={onCreateProject} /> : null}
      {hasProjects && !projects.length ? <EmptySearchState /> : null}
    </section>
  );
}

function useProjectsSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  return [searchTerm, setSearchTerm] as const;
}

function SearchBar({
  searchTerm,
  setSearchTerm,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}) {
  return (
    <label className="flex w-full items-center gap-3 rounded-[20px] border border-black/7 bg-[#f8f9fb] px-4 py-3 text-sm text-slate-400">
      <span className="text-base">⌕</span>
      <input
        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search projects..."
        value={searchTerm}
      />
      <span className="rounded-xl border border-black/8 bg-white px-2 py-1 text-xs font-semibold text-slate-400">⌘ K</span>
    </label>
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
      className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-black/6 bg-white px-6 py-5 text-left shadow-[0_20px_50px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
      onClick={() => openProject(project.id)}
      type="button"
    >
      <p className="min-w-0 truncate text-2xl font-black tracking-[-0.04em] text-slate-950">{project.project_name}</p>
      <div className="shrink-0">
        <StatusBadge status={project.status} />
      </div>
    </button>
  );
}

function EmptySearchState() {
  return (
    <div className="rounded-[24px] border border-dashed border-black/10 bg-[#fafbfc] px-6 py-10 text-center text-sm text-slate-400">
      No projects match your search.
    </div>
  );
}

function openProject(projectId: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.location.assign(`/projects/${projectId}`);
}
