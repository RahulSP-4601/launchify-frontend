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
  TranscriptCard,
} from "@/components/workspace-detail-panels";
import {
  createProject,
  fetchProject,
  fetchProjects,
  fetchTranscript,
  isAuthenticationError,
  updatePhaseFour,
  uploadProjectVideo,
} from "@/lib/api";
import { DashboardSection, HomePanel, useDashboardStore } from "@/lib/dashboard-store";
import { signOutUser } from "@/lib/supabase";
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
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

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
          onOpenCreate={() => setCreateProjectOpen(true)}
          onOpenProject={(projectId) => openProject(projectId, setActiveSection, workspace.setSelectedProjectId)}
          workspace={workspace}
        />
        {createProjectOpen ? <CreateProjectModal onClose={() => setCreateProjectOpen(false)} workspace={workspace} /> : null}
      </>
    );
  }

  return (
    <>
      <div className="grid gap-5 p-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <ProjectsPanel workspace={workspace} />
        </aside>
        <section className="space-y-4">
          <ProjectCanvasHeader workspace={workspace} />
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
  const { setActiveHomePanel, setActiveSection, setCreateProjectOpen } = useDashboardStore();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectForm, setProjectForm] = useState<CreateProjectInput>(initialForm);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { createMutation, phaseFourMutation, uploadMutation } = useWorkspaceMutations({
    queryClient,
    selectedProjectId,
    setActiveHomePanel,
    setActiveSection,
    setCreateProjectOpen,
    setProjectForm,
    setSelectedProjectId,
    setUploadFile,
  });
  const { projectQuery, projectsQuery, transcriptQuery } = useWorkspaceQueries(selectedProjectId);
  const authError = getWorkspaceAuthError(projectsQuery.error, projectQuery.error, transcriptQuery.error);

  return {
    authError,
    createError: createMutation.error instanceof Error ? createMutation.error.message : "",
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

function ProjectsPanel({ workspace }: { workspace: WorkspaceState }) {
  return (
    <section className="rounded-[30px] border border-black/6 bg-[linear-gradient(180deg,#fbfcfe_0%,#f6f8fb_100%)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Projects</p>
          <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Your workspace list</p>
        </div>
        <p className="rounded-full border border-black/6 bg-white px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-400">{workspace.projects.length}</p>
      </div>
      <div className="mt-3 space-y-2">
        {workspace.authError ? <AuthenticationRecoveryCard message={workspace.authError} /> : null}
        {workspace.projects.length ? workspace.projects.map((project) => (
          <ProjectRow
            key={project.id}
            onSelect={workspace.setSelectedProjectId}
            project={project}
            selectedProjectId={workspace.selectedProjectId}
          />
        )) : (
          <div className="rounded-[24px] border border-dashed border-black/10 bg-white px-4 py-8 text-sm text-slate-400">
            No projects yet. Use the top-right button to create your first one.
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectCanvasHeader({ workspace }: { workspace: WorkspaceState }) {
  return (
    <section className="rounded-[30px] border border-black/6 bg-[linear-gradient(135deg,#fff6f7_0%,#ffffff_48%,#f4f7fb_100%)] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--launchify-accent)]">Projects</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">
            {workspace.selectedProject?.project_name ?? "Select a project to continue"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-500">
            {workspace.selectedProject?.product_description ?? "Pick a project from the left to continue transcript, script, quality, and exports in one focused workspace."}
          </p>
        </div>
        {workspace.selectedProject ? (
          <div className="flex items-center gap-3">
            <StatusBadge status={workspace.selectedProject.status} />
            <p className="text-sm text-slate-400">{workspace.selectedProject.product_name}</p>
          </div>
        ) : null}
      </div>
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
  if (workspace.authError) {
    return <AuthenticationRecoveryPanel message={workspace.authError} />;
  }
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
      <p className="mt-2 text-sm leading-7 text-slate-500">Supported: MP4, WebM, MOV. Max file size: 50 MB. Upload the raw walkthrough and Launchify will run the full processing pipeline.</p>
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

function ProjectRow({ onSelect, project, selectedProjectId }: { onSelect: (projectId: string) => void; project: ProjectSummary; selectedProjectId: string }) {
  return (
    <button
      className={`w-full rounded-[24px] px-4 py-4 text-left transition ${
        selectedProjectId === project.id
          ? "bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
          : "border border-black/6 bg-white text-slate-700 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.06)]"
      }`}
      onClick={() => onSelect(project.id)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{project.project_name}</p>
          <p className={`mt-1 text-sm ${selectedProjectId === project.id ? "text-white/60" : "text-slate-400"}`}>{project.product_name}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>
      <div className={`mt-4 h-1.5 rounded-full ${selectedProjectId === project.id ? "bg-white/10" : "bg-slate-100"}`}>
        <div className={`h-1.5 rounded-full ${selectedProjectId === project.id ? "w-2/3 bg-[var(--launchify-accent)]" : "w-1/3 bg-slate-300"}`} />
      </div>
    </button>
  );
}

function AuthenticationRecoveryCard({ message }: { message: string }) {
  return (
    <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-5">
      <p className="text-sm font-semibold text-rose-700">Session expired</p>
      <p className="mt-2 text-sm leading-7 text-rose-600">{message}</p>
      <button
        className="mt-4 rounded-[18px] bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
        onClick={() => void signOutUser()}
        type="button"
      >
        Sign out and sign in again
      </button>
    </div>
  );
}

function AuthenticationRecoveryPanel({ message }: { message: string }) {
  return (
    <section className="rounded-[30px] border border-rose-200 bg-[linear-gradient(135deg,#fff1f3_0%,#ffffff_100%)] p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--launchify-accent)]">Session expired</p>
      <h3 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">Reconnect to continue your workspace.</h3>
      <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-500">{message}</p>
      <button
        className="mt-6 rounded-[18px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        onClick={() => void signOutUser()}
        type="button"
      >
        Sign out and sign in again
      </button>
    </section>
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
  setActiveHomePanel: (panel: HomePanel) => void,
  setActiveSection: (section: DashboardSection) => void,
  setCreateProjectOpen: (open: boolean) => void,
  setSelectedProjectId: (projectId: string) => void,
  setProjectForm: (input: CreateProjectInput) => void,
) {
  void queryClient.invalidateQueries({ queryKey: ["projects"] });
  setActiveHomePanel("overview");
  setActiveSection("projects");
  setCreateProjectOpen(false);
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
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    refetchInterval: (query) => (isAuthenticationError(query.state.error) ? false : 3000),
    retry: (failureCount, error) => !isAuthenticationError(error) && failureCount < 2,
  });
  const projectQuery = useQuery({
    queryKey: ["project", selectedProjectId],
    queryFn: () => fetchProject(selectedProjectId),
    enabled: Boolean(selectedProjectId),
    refetchInterval: (query) => (isAuthenticationError(query.state.error) ? false : 3000),
    retry: (failureCount, error) => !isAuthenticationError(error) && failureCount < 2,
  });
  const transcriptQuery = useQuery({
    queryKey: ["transcript", selectedProjectId],
    queryFn: () => fetchTranscript(selectedProjectId),
    enabled: Boolean(selectedProjectId),
    refetchInterval: (query) => (isAuthenticationError(query.state.error) ? false : 3000),
    retry: (failureCount, error) => !isAuthenticationError(error) && failureCount < 2,
  });
  return { projectQuery, projectsQuery, transcriptQuery };
}

function getWorkspaceAuthError(...errors: Array<unknown>) {
  const authFailure = errors.find(isAuthenticationError);
  if (!(authFailure instanceof Error)) {
    return "";
  }
  return authFailure.message;
}

function useWorkspaceMutations({
  queryClient,
  selectedProjectId,
  setActiveHomePanel,
  setActiveSection,
  setCreateProjectOpen,
  setProjectForm,
  setSelectedProjectId,
  setUploadFile,
}: {
  queryClient: ReturnType<typeof useQueryClient>;
  selectedProjectId: string;
  setActiveHomePanel: (panel: HomePanel) => void;
  setActiveSection: (section: DashboardSection) => void;
  setCreateProjectOpen: (open: boolean) => void;
  setProjectForm: (input: CreateProjectInput) => void;
  setSelectedProjectId: (projectId: string) => void;
  setUploadFile: (file: File | null) => void;
}) {
  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) =>
      resetAfterCreate(
        project,
        queryClient,
        setActiveHomePanel,
        setActiveSection,
        setCreateProjectOpen,
        setSelectedProjectId,
        setProjectForm,
      ),
  });
  const uploadMutation = useMutation({
    mutationFn: ({ projectId, file }: { file: File; projectId: string }) => {
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error("Uploaded file must be 50 MB or smaller.");
      }
      return uploadProjectVideo(projectId, file);
    },
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
