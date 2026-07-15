"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentSession, signInWithGoogle } from "@/lib/supabase";

export function AuthScreen() {
  const router = useRouter();
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    void syncAuthState(router, setIsReady);
  }, [router]);

  if (!isReady) {
    return <AuthLoadingState />;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--launchify-surface)] text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,35,60,0.18),transparent_28%),linear-gradient(180deg,#faf8f6_0%,#eef2f7_100%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <AuthHero />
          <AuthCard
            authError={authError}
            isLoading={isLoading}
            onGoogleSignIn={() => void handleGoogleSignIn(router, setAuthError, setIsLoading)}
          />
        </div>
      </div>
    </main>
  );
}

function AuthLoadingState() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--launchify-surface)]">
      <div className="rounded-[32px] border border-black/8 bg-white px-8 py-6 text-slate-950 shadow-[0_30px_120px_rgba(15,23,42,0.15)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--launchify-accent)]">Launchify</p>
        <p className="mt-3 text-lg font-semibold">Preparing authentication...</p>
      </div>
    </main>
  );
}

function AuthHero() {
  return (
    <section className="flex flex-col justify-center">
      <Link className="inline-flex items-center gap-3 self-start rounded-full border border-black/6 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-900 backdrop-blur" href="/">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[var(--launchify-accent)] text-white">L</span>
        Back to Launchify
      </Link>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--launchify-accent)]">Sign in</p>
      <h1 className="mt-5 text-5xl font-black tracking-[-0.05em] text-slate-950 lg:text-6xl">
        Enter the studio where raw recordings become polished launch assets.
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
        Sign in with Google to access the Launchify dashboard, templates, projects,
        transcript-to-video pipeline, and the Clueso-style creation flow.
      </p>
    </section>
  );
}

function AuthCard({
  authError,
  isLoading,
  onGoogleSignIn,
}: {
  authError: string;
  isLoading: boolean;
  onGoogleSignIn: () => void;
}) {
  return (
    <section className="rounded-[40px] border border-black/6 bg-white p-6 shadow-[0_40px_140px_rgba(15,23,42,0.16)] lg:p-8">
      <div className="rounded-[32px] bg-[#111111] p-6 text-white">
        <p className="text-xs uppercase tracking-[0.25em] text-white/55">Google-first access</p>
        <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">Create your account and launch your first product video.</h2>
        <p className="mt-4 text-sm leading-7 text-white/66">
          No payment setup yet. Just sign in, create a project, upload a walkthrough, and
          push it through the full Launchify generation workflow.
        </p>
        <button
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-[22px] bg-white px-5 py-4 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:opacity-70"
          disabled={isLoading}
          onClick={onGoogleSignIn}
          type="button"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--launchify-accent)] text-white">G</span>
          {isLoading ? "Connecting to Google..." : "Continue with Google"}
        </button>
        {authError ? <p className="mt-4 text-sm text-rose-300">{authError}</p> : null}
      </div>
    </section>
  );
}

async function syncAuthState(
  router: ReturnType<typeof useRouter>,
  setIsReady: (value: boolean) => void,
) {
  const session = await getCurrentSession();
  if (session) {
    router.replace("/");
    return;
  }
  setIsReady(true);
}

async function handleGoogleSignIn(
  router: ReturnType<typeof useRouter>,
  setAuthError: (value: string) => void,
  setIsLoading: (value: boolean) => void,
) {
  setIsLoading(true);
  setAuthError("");
  try {
    await signInWithGoogle();
    router.refresh();
  } catch (error) {
    setAuthError(error instanceof Error ? error.message : "Unable to start Google sign in.");
    setIsLoading(false);
  }
}
