"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { ProjectEditorShell } from "@/components/project-editor-shell";
import { UploadProgressModal } from "@/components/upload-progress-modal";
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
    return <LoadingScreen label="Loading project editor..." />;
  }

  return (
    <>
      <ProjectEditorShell project={project} transcript={workspace.transcript} />
      {workspace.uploadOverlay.active ? <UploadProgressModal uploadOverlay={workspace.uploadOverlay} /> : null}
    </>
  );
}

async function syncInitialSession(
  setSession: (session: Session | null) => void,
  setIsReady: (ready: boolean) => void,
) {
  setSession(await getCurrentSession());
  setIsReady(true);
}

function LoadingScreen({ label = "Preparing your editor..." }: { label?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#121212] text-white">
      <div className="rounded-[32px] border border-white/10 bg-[#1b1b1b] px-8 py-6 shadow-[0_30px_100px_rgba(0,0,0,0.3)]">
        <p className="text-sm font-medium tracking-[0.3em] text-slate-400">LAUNCHIFY</p>
        <p className="mt-3 text-lg font-semibold">{label}</p>
      </div>
    </main>
  );
}

function SigninRequiredState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#121212] px-4">
      <div className="max-w-lg rounded-[32px] border border-white/10 bg-[#1b1b1b] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.3)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-200">Sign in required</p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white">Open this project after signing in.</h1>
        <p className="mt-4 text-sm leading-7 text-slate-400">
          Your session is not active in this tab right now. Return to the main dashboard, sign in, and open the project again.
        </p>
      </div>
    </main>
  );
}
