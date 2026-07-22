"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { EditPlanCard } from "@/components/edit-plan-card";
import { LaunchScriptCard, TranscriptCard } from "@/components/workspace-detail-panels";
import { PhaseFourCard } from "@/components/phase-four-card";
import { RenderOutputCard } from "@/components/render-output-card";
import { UploadProgressModal } from "@/components/upload-progress-modal";
import { StatusBadge } from "@/components/workspace-home";
import { AuthenticationRecoveryPanel } from "@/components/workspace-auth-recovery";
import { getBrowserSupabaseClient, getCurrentSession } from "@/lib/supabase";
import { useProjectsWorkspace } from "@/components/projects-workspace-state";

export function ProjectStudioApp({ projectId }: { projectId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    void syncInitialSession(setSession, setIsReady);
    const client = getBrowserSupabaseClient();
    const listener = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsReady(true);
    });
    return () => listener.data.subscription.unsubscribe();
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <SigninRequiredState />;
  }

  return <ProjectStudioPage projectId={projectId} />;
}

function ProjectStudioPage({ projectId }: { projectId: string }) {
  const workspace = useProjectsWorkspace(projectId);
  const project = workspace.selectedProject;

  if (workspace.authError) {
    return <AuthenticationRecoveryPanel message={workspace.authError} />;
  }

  if (!project) {
    return <LoadingScreen label="Loading project workspace..." />;
  }

  return (
    <>
      <main className="min-h-screen bg-[var(--launchify-surface)] px-4 py-4 text-slate-950 lg:px-5">
        <ProjectStudioContent project={project} projectId={projectId} workspace={workspace} />
      </main>
      {workspace.uploadOverlay.active ? <UploadProgressModal uploadOverlay={workspace.uploadOverlay} /> : null}
    </>
  );
}

function ProjectStudioContent({
  project,
  projectId,
  workspace,
}: {
  project: NonNullable<ReturnType<typeof useProjectsWorkspace>["selectedProject"]>;
  projectId: string;
  workspace: ReturnType<typeof useProjectsWorkspace>;
}) {
  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <ProjectStudioHeader project={project} />
      <ProjectStudioPreviewSection project={project} projectId={projectId} workspace={workspace} />
      <ProjectStudioDetails project={project} projectId={projectId} workspace={workspace} />
    </div>
  );
}

function ProjectStudioHeader({
  project,
}: {
  project: NonNullable<ReturnType<typeof useProjectsWorkspace>["selectedProject"]>;
}) {
  return (
    <header className="rounded-[34px] border border-black/6 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--launchify-accent)]" href="/">
            Back to projects
          </Link>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">{project.project_name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            This workspace keeps the preview front and center. Upload the raw recording, review the generated output, and follow the transcript and script progress below.
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>
    </header>
  );
}

function ProjectStudioPreviewSection({
  project,
  projectId,
  workspace,
}: {
  project: NonNullable<ReturnType<typeof useProjectsWorkspace>["selectedProject"]>;
  projectId: string;
  workspace: ReturnType<typeof useProjectsWorkspace>;
}) {
  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.55fr)_360px]">
      <RenderOutputCard project={project} />
      <div className="space-y-5">
        <RawUploadCard
          error={workspace.uploadMutation.error?.message || project.error_message}
          file={workspace.uploadFile}
          filename={project.asset?.filename ?? ""}
          isUploading={workspace.uploadMutation.isPending}
          onChange={(file) => workspace.setUploadFile(file)}
          onUpload={() => uploadProjectFile(workspace, projectId)}
        />
        <ProgressCard project={project} />
      </div>
    </div>
  );
}

function ProjectStudioDetails({
  project,
  projectId,
  workspace,
}: {
  project: NonNullable<ReturnType<typeof useProjectsWorkspace>["selectedProject"]>;
  projectId: string;
  workspace: ReturnType<typeof useProjectsWorkspace>;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <TranscriptCard transcript={workspace.transcript} />
      <LaunchScriptCard
        guide={project.guide}
        launchScript={project.launch_script}
        projectError={project.error_message}
      />
      <EditPlanCard editPlan={project.edit_plan} projectError={project.error_message} />
      <PhaseFourCard
        isSaving={workspace.phaseFourMutation.isPending}
        onSave={(input) => workspace.phaseFourMutation.mutate({ input, projectId })}
        project={project}
        saveError={workspace.phaseFourMutation.error?.message}
      />
    </div>
  );
}

function uploadProjectFile(workspace: ReturnType<typeof useProjectsWorkspace>, projectId: string) {
  if (!workspace.uploadFile) {
    return;
  }
  workspace.uploadMutation.mutate({ file: workspace.uploadFile, projectId });
}

function RawUploadCard({
  error,
  file,
  filename,
  isUploading,
  onChange,
  onUpload,
}: {
  error: string;
  file: File | null;
  filename: string;
  isUploading: boolean;
  onChange: (file: File | null) => void;
  onUpload: () => void;
}) {
  return (
    <section className="rounded-[30px] border border-black/6 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--launchify-accent)]">Raw video</p>
      <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">Upload or replace the source recording</h2>
      <p className="mt-3 text-sm leading-7 text-slate-500">
        Supported: MP4, WebM, MOV. Max size: 50 MB.
      </p>
      <input
        className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-white"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        type="file"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={!file || isUploading}
          onClick={onUpload}
          type="button"
        >
          {isUploading ? "Uploading..." : "Upload video"}
        </button>
        {filename ? <p className="text-sm text-slate-500">Current file: {filename}</p> : null}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </section>
  );
}

function ProgressCard({ project }: { project: ReturnType<typeof useProjectsWorkspace>["selectedProject"] }) {
  if (!project) {
    return null;
  }
  const checkpoints = [
    { label: "Raw upload", ready: Boolean(project.asset) },
    { label: "Transcript", ready: project.has_transcript },
    { label: "Launch script", ready: project.has_launch_script },
    { label: "Preview", ready: project.has_preview_video },
  ];

  return (
    <section className="rounded-[30px] border border-black/6 bg-[linear-gradient(135deg,#fff7f8_0%,#ffffff_56%,#f4f8fb_100%)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--launchify-accent)]">Pipeline</p>
      <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">Preview progress</h2>
      <div className="mt-5 space-y-3">
        {checkpoints.map((checkpoint) => (
          <div key={checkpoint.label} className="flex items-center justify-between rounded-[20px] bg-white px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">{checkpoint.label}</p>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${checkpoint.ready ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {checkpoint.ready ? "Ready" : "Pending"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

async function syncInitialSession(
  setSession: (session: Session | null) => void,
  setIsReady: (ready: boolean) => void,
) {
  setSession(await getCurrentSession());
  setIsReady(true);
}

function LoadingScreen({ label = "Preparing your studio..." }: { label?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--launchify-surface)] text-[var(--launchify-ink)]">
      <div className="rounded-[32px] border border-black/10 bg-white px-8 py-6 shadow-[0_30px_100px_rgba(15,23,42,0.15)]">
        <p className="text-sm font-medium tracking-[0.3em] text-[var(--launchify-muted)]">LAUNCHIFY</p>
        <p className="mt-3 text-lg font-semibold">{label}</p>
      </div>
    </main>
  );
}

function SigninRequiredState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--launchify-surface)] px-4">
      <div className="max-w-lg rounded-[32px] border border-black/10 bg-white p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.15)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--launchify-accent)]">Sign in required</p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">Open this project after signing in.</h1>
        <p className="mt-4 text-sm leading-7 text-slate-500">
          Your session is not active in this tab right now. Return to the main dashboard, sign in, and open the project again.
        </p>
        <Link className="mt-6 inline-flex rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white" href="/">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
