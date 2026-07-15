"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { EditPlanCard } from "@/components/edit-plan-card";
import { PhaseFourCard } from "@/components/phase-four-card";
import { RenderOutputCard } from "@/components/render-output-card";
import {
  CreateProjectModal,
  HomeDashboard,
  StatusBadge,
} from "@/components/workspace-home";
import {
  EmptyState,
  LaunchScriptCard,
  TemplatesGallery,
  TranscriptCard,
} from "@/components/workspace-detail-panels";
import {
  createProject,
  fetchProject,
  fetchProjects,
  fetchTranscript,
  updatePhaseFour,
  uploadProjectVideo,
} from "@/lib/api";
import { DashboardSection, HomePanel, useDashboardStore } from "@/lib/dashboard-store";
import {
  CreateProjectInput,
  ProjectDetail,
  ProjectSummary,
  UpdatePhaseFourInput,
} from "@/lib/types";

const initialForm: CreateProjectInput = {
  project_name: "",
  product_name: "",
  product_description: "",
  target_audience: "",
  video_goal: "launch_video",
};

const panelTabs: Array<{ key: HomePanel; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "transcript", label: "Transcript" },
  { key: "script", label: "Script" },
  { key: "edit-plan", label: "Edit Plan" },
  { key: "quality", label: "Quality" },
  { key: "exports", label: "Exports" },
];

export function ProjectsWorkspace({ section }: { section: DashboardSection }) {
  const workspace = useProjectsWorkspace();
  const { createProjectOpen, setActiveSection, setCreateProjectOpen } = useDashboardStore();

  if (section === "home") {
    return (
      <>
        <HomeDashboard
          onBrowseTemplates={() => setActiveSection("templates")}
          onOpenCreate={() => setCreateProjectOpen(true)}
          onOpenProject={(projectId) => openProject(projectId, setActiveSection, workspace.setSelectedProjectId)}
          workspace={workspace}
        />
        {createProjectOpen ? <CreateProjectModal onClose={() => setCreateProjectOpen(false)} workspace={workspace} /> : null}
      </>
    );
  }

  if (section === "templates") {
    return (
      <>
        <TemplatesGallery onCreate={() => {
          setActiveSection("projects");
          setCreateProjectOpen(true);
        }} />
        {createProjectOpen ? <CreateProjectModal onClose={() => setCreateProjectOpen(false)} workspace={workspace} /> : null}
      </>
    );
  }

  return (
    <>
      <div className="grid gap-5 p-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <CreateProjectPanel workspace={workspace} />
          <ProjectsPanel workspace={workspace} />
        </aside>
        <section className="space-y-4">
          <OverviewStrip workspace={workspace} />
          <PanelTabs />
          <WorkspaceCanvas workspace={workspace} />
        </section>
      </div>
      {createProjectOpen ? <CreateProjectModal onClose={() => setCreateProjectOpen(false)} workspace={workspace} /> : null}
    </>
  );
}

function useProjectsWorkspace() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectForm, setProjectForm] = useState<CreateProjectInput>(initialForm);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { createMutation, phaseFourMutation, uploadMutation } = useWorkspaceMutations({
    queryClient,
    selectedProjectId,
    setProjectForm,
    setSelectedProjectId,
    setUploadFile,
  });
  const { projectQuery, projectsQuery, transcriptQuery } = useWorkspaceQueries(selectedProjectId);

  return {
    createMutation,
    phaseFourMutation,
    projectForm,
    projects: projectsQuery.data ?? [],
    selectedProject: projectQuery.data,
    selectedProjectId,
    setProjectForm,
    setSelectedProjectId,
    setUploadFile,
    transcript: transcriptQuery.data?.transcript ?? [],
    uploadFile,
    uploadMutation,
  };
}

function CreateProjectPanel({ workspace }: { workspace: WorkspaceState }) {
  const { setCreateProjectOpen } = useDashboardStore();

  return (
    <section className="rounded-[28px] border border-black/6 bg-[#fafbfc] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--launchify-accent)]">Create project</p>
      <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">Start from a raw recording.</h2>
      <p className="mt-4 text-sm leading-7 text-slate-500">
        Create the project first, then upload the walkthrough and continue inside the Launchify
        studio workflow.
      </p>
      <button
        className="mt-5 w-full rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white"
        onClick={() => setCreateProjectOpen(true)}
        type="button"
      >
        New project
      </button>
      {workspace.selectedProjectId ? (
        <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">
          Active project selected
        </p>
      ) : null}
    </section>
  );
}

function ProjectsPanel({ workspace }: { workspace: WorkspaceState }) {
  return (
    <section className="rounded-[28px] border border-black/6 bg-[#fafbfc] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Projects</p>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{workspace.projects.length}</p>
      </div>
      <div className="mt-3 space-y-2">
        {workspace.projects.map((project) => (
          <ProjectRow
            key={project.id}
            onSelect={workspace.setSelectedProjectId}
            project={project}
            selectedProjectId={workspace.selectedProjectId}
          />
        ))}
      </div>
    </section>
  );
}

function OverviewStrip({ workspace }: { workspace: WorkspaceState }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
      <article className="rounded-[28px] bg-[#111111] p-5 text-white">
        <p className="text-xs uppercase tracking-[0.25em] text-white/45">Studio Overview</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
          {workspace.selectedProject?.project_name ?? "Choose a project to enter the launch studio"}
        </h2>
        <p className="mt-3 text-sm leading-7 text-white/68">
          {workspace.selectedProject?.product_description ?? "The active project appears here with its transcript, script, edit plan, and export output."}
        </p>
      </article>
      <StatCard body="Projects move from transcript to render inside one workspace." title="Pipeline" value={workspace.selectedProject?.status ?? "draft"} />
      <StatCard body="This mirrors Clueso’s trial-first, export-based activation loop." title="Trial usage" value="0 / 10 mins" />
    </section>
  );
}

function PanelTabs() {
  const { activeHomePanel, setActiveHomePanel } = useDashboardStore();
  return (
    <div className="flex flex-wrap gap-2">
      {panelTabs.map((tab) => (
        <button
          key={tab.key}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            activeHomePanel === tab.key ? "bg-slate-950 text-white" : "border border-black/8 bg-white text-slate-500"
          }`}
          onClick={() => setActiveHomePanel(tab.key)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function WorkspaceCanvas({ workspace }: { workspace: WorkspaceState }) {
  const { activeHomePanel } = useDashboardStore();
  if (!workspace.selectedProject) {
    return <EmptyState />;
  }
  if (activeHomePanel === "overview") {
    return <OverviewPanel workspace={workspace} />;
  }
  if (activeHomePanel === "transcript") {
    return <TranscriptCard transcript={workspace.transcript} />;
  }
  if (activeHomePanel === "script") {
    return <LaunchScriptCard launchScript={workspace.selectedProject.launch_script} projectError={workspace.selectedProject.error_message} />;
  }
  if (activeHomePanel === "edit-plan") {
    return <EditPlanCard editPlan={workspace.selectedProject.edit_plan} projectError={workspace.selectedProject.error_message} />;
  }
  if (activeHomePanel === "quality") {
    return (
      <PhaseFourCard
        isSaving={workspace.phaseFourMutation.isPending}
        onSave={(input) => handlePhaseFourSave(workspace, input)}
        project={workspace.selectedProject}
        saveError={workspace.phaseFourMutation.error?.message}
      />
    );
  }
  return <RenderOutputCard project={workspace.selectedProject} />;
}

function OverviewPanel({ workspace }: { workspace: WorkspaceState }) {
  return (
    <div className="grid gap-4">
      <UploadCard workspace={workspace} />
      <LaunchScriptCard launchScript={workspace.selectedProject?.launch_script ?? null} projectError={workspace.selectedProject?.error_message ?? ""} />
    </div>
  );
}

function UploadCard({ workspace }: { workspace: WorkspaceState }) {
  const project = workspace.selectedProject;
  return (
    <div className="rounded-[28px] border border-black/6 bg-white p-5">
      <p className="text-sm font-semibold text-slate-900">Upload recording</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">Supported: MP4, WebM, MOV. Upload the raw walkthrough and Launchify will run the full processing pipeline.</p>
      <input
        className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-white"
        onChange={(event) => workspace.setUploadFile(event.target.files?.[0] ?? null)}
        type="file"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={!workspace.uploadFile || workspace.uploadMutation.isPending}
          onClick={() => handleUpload(workspace)}
          type="button"
        >
          {workspace.uploadMutation.isPending ? "Uploading..." : "Upload video"}
        </button>
        {project?.asset?.filename ? <p className="text-sm text-slate-500">Stored as {project.asset.filename}</p> : null}
      </div>
      {workspace.uploadMutation.error?.message ? <p className="mt-3 text-sm text-rose-600">{workspace.uploadMutation.error.message}</p> : null}
      {project?.error_message ? <p className="mt-3 text-sm text-rose-600">{project.error_message}</p> : null}
    </div>
  );
}

function ProjectRow({
  onSelect,
  project,
  selectedProjectId,
}: {
  onSelect: (projectId: string) => void;
  project: ProjectSummary;
  selectedProjectId: string;
}) {
  return (
    <button
      className={`w-full rounded-[20px] px-4 py-4 text-left ${
        selectedProjectId === project.id ? "bg-slate-950 text-white" : "border border-black/6 bg-white text-slate-700"
      }`}
      onClick={() => onSelect(project.id)}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{project.project_name}</p>
          <p className={`mt-1 text-sm ${selectedProjectId === project.id ? "text-white/60" : "text-slate-400"}`}>{project.product_name}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>
    </button>
  );
}

function StatCard({ body, title, value }: { body: string; title: string; value: string }) {
  return (
    <article className="rounded-[28px] border border-black/6 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{title}</p>
      <p className="mt-5 text-3xl font-black tracking-[-0.05em] text-slate-950 capitalize">{value}</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">{body}</p>
    </article>
  );
}

function handleUpload(workspace: WorkspaceState) {
  if (!workspace.selectedProjectId || !workspace.uploadFile) {
    return;
  }
  workspace.uploadMutation.mutate({ file: workspace.uploadFile, projectId: workspace.selectedProjectId });
}

function handlePhaseFourSave(workspace: WorkspaceState, input: UpdatePhaseFourInput) {
  if (!workspace.selectedProjectId) {
    return;
  }
  workspace.phaseFourMutation.mutate({ input, projectId: workspace.selectedProjectId });
}

function resetAfterCreate(
  project: ProjectDetail,
  queryClient: ReturnType<typeof useQueryClient>,
  setSelectedProjectId: (projectId: string) => void,
  setProjectForm: (input: CreateProjectInput) => void,
) {
  void queryClient.invalidateQueries({ queryKey: ["projects"] });
  setSelectedProjectId(project.id);
  setProjectForm(initialForm);
}

function resetAfterUpload(
  selectedProjectId: string,
  queryClient: ReturnType<typeof useQueryClient>,
  setUploadFile: (file: File | null) => void,
) {
  void queryClient.invalidateQueries({ queryKey: ["projects"] });
  void queryClient.invalidateQueries({ queryKey: ["project", selectedProjectId] });
  void queryClient.invalidateQueries({ queryKey: ["transcript", selectedProjectId] });
  setUploadFile(null);
}

function handlePhaseFourSuccess(
  project: ProjectDetail,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.setQueryData(["project", project.id], project);
  void queryClient.invalidateQueries({ queryKey: ["projects"] });
}

function useWorkspaceQueries(selectedProjectId: string) {
  const projectsQuery = useQuery({ queryKey: ["projects"], queryFn: fetchProjects, refetchInterval: 3000 });
  const projectQuery = useQuery({
    queryKey: ["project", selectedProjectId],
    queryFn: () => fetchProject(selectedProjectId),
    enabled: Boolean(selectedProjectId),
    refetchInterval: 3000,
  });
  const transcriptQuery = useQuery({
    queryKey: ["transcript", selectedProjectId],
    queryFn: () => fetchTranscript(selectedProjectId),
    enabled: Boolean(selectedProjectId),
    refetchInterval: 3000,
  });
  return { projectQuery, projectsQuery, transcriptQuery };
}

function useWorkspaceMutations({
  queryClient,
  selectedProjectId,
  setProjectForm,
  setSelectedProjectId,
  setUploadFile,
}: {
  queryClient: ReturnType<typeof useQueryClient>;
  selectedProjectId: string;
  setProjectForm: (input: CreateProjectInput) => void;
  setSelectedProjectId: (projectId: string) => void;
  setUploadFile: (file: File | null) => void;
}) {
  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => resetAfterCreate(project, queryClient, setSelectedProjectId, setProjectForm),
  });
  const uploadMutation = useMutation({
    mutationFn: ({ projectId, file }: { file: File; projectId: string }) => uploadProjectVideo(projectId, file),
    onSuccess: () => resetAfterUpload(selectedProjectId, queryClient, setUploadFile),
  });
  const phaseFourMutation = useMutation({
    mutationFn: ({ input, projectId }: { input: UpdatePhaseFourInput; projectId: string }) =>
      updatePhaseFour(projectId, input),
    onSuccess: (project) => handlePhaseFourSuccess(project, queryClient),
  });
  return { createMutation, phaseFourMutation, uploadMutation };
}

function openProject(
  projectId: string,
  setActiveSection: (section: DashboardSection) => void,
  setSelectedProjectId: (projectId: string) => void,
) {
  setSelectedProjectId(projectId);
  setActiveSection("projects");
}

type WorkspaceState = ReturnType<typeof useProjectsWorkspace>;
