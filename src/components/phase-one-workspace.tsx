"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import {
  createProject,
  fetchProject,
  fetchProjects,
  fetchTranscript,
  uploadProjectVideo,
} from "@/lib/api";
import { CreateProjectInput, LaunchScriptRecord, ProjectDetail, ProjectSummary, TranscriptResponse } from "@/lib/types";

const initialForm: CreateProjectInput = {
  project_name: "",
  product_name: "",
  product_description: "",
  target_audience: "",
  video_goal: "launch_video",
};

export function PhaseOneWorkspace() {
  const workspace = usePhaseOneWorkspace();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_1.4fr]">
        <WorkspaceSidebar workspace={workspace} />
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <ProjectPanel workspace={workspace} />
        </section>
      </div>
    </main>
  );
}

function usePhaseOneWorkspace() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectForm, setProjectForm] = useState<CreateProjectInput>(initialForm);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const projectsQuery = useQuery({ queryKey: ["projects"], queryFn: fetchProjects, refetchInterval: 3000 });
  const selectedProject = useQuery({
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
  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => resetAfterCreate(project, queryClient, setSelectedProjectId, setProjectForm),
  });
  const uploadMutation = useMutation({
    mutationFn: ({ projectId, file }: { projectId: string; file: File }) =>
      uploadProjectVideo(projectId, file),
    onSuccess: () => resetAfterUpload(selectedProjectId, queryClient, setUploadFile),
  });

  return {
    createMutation,
    projectForm,
    projects: projectsQuery.data ?? [],
    selectedProject: selectedProject.data,
    selectedProjectId,
    setProjectForm,
    setSelectedProjectId,
    setUploadFile,
    transcript: transcriptQuery.data?.transcript ?? [],
    uploadFile,
    uploadMutation,
  };
}

function WorkspaceSidebar({ workspace }: { workspace: WorkspaceState }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="mb-2 text-sm uppercase tracking-[0.3em] text-emerald-200">Phase 2</p>
      <h1 className="text-3xl font-semibold tracking-tight">Transcript to launch script pipeline</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
        Launchify now takes a rough recording, extracts the transcript, and rewrites it into a
        structured launch script using product context and OpenAI.
      </p>
      <CreateProjectForm workspace={workspace} />
      <ProjectList workspace={workspace} />
    </section>
  );
}

function CreateProjectForm({ workspace }: { workspace: WorkspaceState }) {
  return (
    <form className="mt-8 space-y-3" onSubmit={(event) => handleCreateProject(event, workspace)}>
      <FormInput label="Project name" value={workspace.projectForm.project_name} onValueChange={(value) => updateForm(workspace, "project_name", value)} />
      <FormInput label="Product name" value={workspace.projectForm.product_name} onValueChange={(value) => updateForm(workspace, "product_name", value)} />
      <FormInput label="Target audience" value={workspace.projectForm.target_audience} onValueChange={(value) => updateForm(workspace, "target_audience", value)} />
      <FormInput label="Video goal" value={workspace.projectForm.video_goal} onValueChange={(value) => updateForm(workspace, "video_goal", value)} />
      <DescriptionInput workspace={workspace} />
      <button className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60" disabled={workspace.createMutation.isPending} type="submit">
        {workspace.createMutation.isPending ? "Creating project..." : "Create project"}
      </button>
    </form>
  );
}

function DescriptionInput({ workspace }: { workspace: WorkspaceState }) {
  return (
    <label className="block text-sm text-slate-200">
      Product description
      <textarea
        className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none"
        value={workspace.projectForm.product_description}
        onChange={(event) => updateForm(workspace, "product_description", event.target.value)}
      />
    </label>
  );
}

function ProjectList({ workspace }: { workspace: WorkspaceState }) {
  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Projects</h2>
      <div className="mt-3 space-y-3">
        {workspace.projects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            selectedProjectId={workspace.selectedProjectId}
            onSelect={workspace.setSelectedProjectId}
          />
        ))}
      </div>
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
      className={`w-full rounded-2xl border px-4 py-4 text-left ${
        project.id === selectedProjectId ? "border-emerald-300 bg-emerald-400/10" : "border-white/10 bg-white/5"
      }`}
      onClick={() => onSelect(project.id)}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{project.project_name}</p>
          <p className="text-sm text-slate-300">{project.product_name}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>
    </button>
  );
}

function ProjectPanel({ workspace }: { workspace: WorkspaceState }) {
  if (!workspace.selectedProject) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <ProjectHeader project={workspace.selectedProject} />
      <UploadCard workspace={workspace} />
      <TranscriptCard transcript={workspace.transcript} />
      <LaunchScriptCard
        launchScript={workspace.selectedProject.launch_script}
        projectError={workspace.selectedProject.error_message}
      />
    </div>
  );
}

function ProjectHeader({ project }: { project: ProjectDetail }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Selected project</p>
        <h2 className="mt-2 text-2xl font-semibold">{project.project_name}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
          {project.product_description || "No description yet."}
        </p>
      </div>
      <StatusBadge status={project.status} />
    </div>
  );
}

function UploadCard({ workspace }: { workspace: WorkspaceState }) {
  const project = workspace.selectedProject;
  if (!project) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold text-slate-100">Upload recording</p>
      <p className="mt-1 text-sm text-slate-300">
        Supported: MP4, WebM, MOV. The backend stores the file in Supabase Storage and sends it
        to Deepgram for transcription.
      </p>
      <UploadInput onFileChange={workspace.setUploadFile} />
      <UploadActions
        assetName={project.asset?.filename ?? ""}
        error={workspace.uploadMutation.error?.message}
        file={workspace.uploadFile}
        isUploading={workspace.uploadMutation.isPending}
        projectError={project.error_message}
        onUpload={() => handleUpload(workspace)}
      />
    </div>
  );
}

function UploadInput({ onFileChange }: { onFileChange: (file: File | null) => void }) {
  return (
    <input
      className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
      onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      type="file"
    />
  );
}

function UploadActions({
  assetName,
  error,
  file,
  isUploading,
  onUpload,
  projectError,
}: {
  assetName: string;
  error: string | undefined;
  file: File | null;
  isUploading: boolean;
  onUpload: () => void;
  projectError: string;
}) {
  return (
    <>
      <div className="mt-4 flex items-center gap-3">
        <button
          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          disabled={!file || isUploading}
          onClick={onUpload}
          type="button"
        >
          {isUploading ? "Uploading..." : "Upload video"}
        </button>
        {assetName ? <p className="text-sm text-slate-300">Stored as {assetName}</p> : null}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      {projectError ? <p className="mt-3 text-sm text-rose-300">{projectError}</p> : null}
    </>
  );
}

function TranscriptCard({ transcript }: { transcript: TranscriptResponse["transcript"] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <p className="text-sm font-semibold text-slate-100">Transcript</p>
      <div className="mt-4 space-y-3">
        {transcript.length ? transcript.map((segment, index) => <TranscriptSegmentCard key={`${segment.start}-${index}`} segment={segment} />) : <p className="text-sm text-slate-400">Transcript will appear here once processing finishes.</p>}
      </div>
    </div>
  );
}

function LaunchScriptCard({
  launchScript,
  projectError,
}: {
  launchScript: LaunchScriptRecord | null;
  projectError: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold text-slate-100">Launch script</p>
      {launchScript ? (
        <div className="mt-4 space-y-4">
          <ScriptBlock label="Hook" value={launchScript.hook} />
          <ScriptBlock label="Summary" value={launchScript.summary} />
          <SceneList scenes={launchScript.scenes} />
          <ScriptBlock label="CTA" value={launchScript.cta} />
          {launchScript.title_options.length ? (
            <ScriptBlock label="Title options" value={launchScript.title_options.join(" | ")} />
          ) : null}
          {launchScript.notes.length ? (
            <ScriptBlock label="Notes" value={launchScript.notes.join(" | ")} />
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          {projectError || "Structured launch script will appear here once transcript rewriting finishes."}
        </p>
      )}
    </div>
  );
}

function SceneList({ scenes }: { scenes: LaunchScriptRecord["scenes"] }) {
  return (
    <div className="space-y-3">
      {scenes.map((scene) => (
        <div key={scene.scene_number} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scene {scene.scene_number}</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{scene.purpose}</p>
          <p className="mt-2 text-sm text-slate-200">{scene.spoken_line}</p>
          <p className="mt-2 text-sm text-emerald-200">{scene.on_screen_text}</p>
          <p className="mt-2 text-xs text-slate-400">{scene.source_excerpt}</p>
        </div>
      ))}
    </div>
  );
}

function ScriptBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-7 text-slate-100">{value}</p>
    </div>
  );
}

function TranscriptSegmentCard({ segment }: { segment: TranscriptResponse["transcript"][number] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {segment.start.toFixed(2)}s - {segment.end.toFixed(2)}s
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-100">{segment.text}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">No project selected</p>
        <h2 className="mt-3 text-2xl font-semibold">Create the first Launchify project</h2>
        <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">
          Phase 2 now covers project creation, upload, transcript generation, and AI launch script
          rewriting. This is the core product intelligence layer.
        </p>
      </div>
    </div>
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
    <label className="block text-sm text-slate-200">
      {label}
      <input
        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none"
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function StatusBadge({ status }: { status: ProjectSummary["status"] }) {
  const palette: Record<ProjectSummary["status"], string> = {
    draft: "bg-slate-200/10 text-slate-200",
    queued: "bg-violet-400/10 text-violet-200",
    uploading: "bg-sky-400/10 text-sky-200",
    transcribing: "bg-amber-400/10 text-amber-200",
    scripting: "bg-fuchsia-400/10 text-fuchsia-200",
    ready: "bg-emerald-400/10 text-emerald-200",
    failed: "bg-rose-400/10 text-rose-200",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${palette[status]}`}>{status}</span>;
}

function updateForm(workspace: WorkspaceState, key: keyof CreateProjectInput, value: string) {
  workspace.setProjectForm({ ...workspace.projectForm, [key]: value });
}

function handleCreateProject(event: FormEvent<HTMLFormElement>, workspace: WorkspaceState) {
  event.preventDefault();
  workspace.createMutation.mutate(workspace.projectForm);
}

function handleUpload(workspace: WorkspaceState) {
  if (!workspace.selectedProjectId || !workspace.uploadFile) {
    return;
  }
  workspace.uploadMutation.mutate({
    projectId: workspace.selectedProjectId,
    file: workspace.uploadFile,
  });
}

function resetAfterCreate(
  project: ProjectDetail,
  queryClient: ReturnType<typeof useQueryClient>,
  setSelectedProjectId: (projectId: string) => void,
  setProjectForm: (input: CreateProjectInput) => void,
) {
  queryClient.invalidateQueries({ queryKey: ["projects"] });
  setSelectedProjectId(project.id);
  setProjectForm(initialForm);
}

function resetAfterUpload(
  selectedProjectId: string,
  queryClient: ReturnType<typeof useQueryClient>,
  setUploadFile: (file: File | null) => void,
) {
  queryClient.invalidateQueries({ queryKey: ["projects"] });
  queryClient.invalidateQueries({ queryKey: ["project", selectedProjectId] });
  queryClient.invalidateQueries({ queryKey: ["transcript", selectedProjectId] });
  setUploadFile(null);
}

type WorkspaceState = ReturnType<typeof usePhaseOneWorkspace>;
