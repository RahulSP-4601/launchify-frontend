"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { DashboardShell } from "@/components/dashboard-shell";
import { LandingPage } from "@/components/landing-page";
import { getBrowserSupabaseClient, getCurrentSession } from "@/lib/supabase";

export function LaunchifyApp() {
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

  useEffect(() => {
    if (!session || typeof window === "undefined") {
      return;
    }
    clearBareHash();
  }, [session]);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return session ? <DashboardShell session={session} /> : <LandingPage />;
}

async function syncInitialSession(
  setSession: (session: Session | null) => void,
  setIsReady: (ready: boolean) => void,
) {
  setSession(await getCurrentSession());
  setIsReady(true);
}

function clearBareHash() {
  const { hash, pathname, search } = window.location;
  if (hash !== "#" && hash !== "#/") {
    return;
  }
  window.history.replaceState(null, "", `${pathname}${search}`);
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--launchify-surface)] text-[var(--launchify-ink)]">
      <div className="rounded-[32px] border border-black/10 bg-white px-8 py-6 shadow-[0_30px_100px_rgba(15,23,42,0.15)]">
        <p className="text-sm font-medium tracking-[0.3em] text-[var(--launchify-muted)]">LAUNCHIFY</p>
        <p className="mt-3 text-lg font-semibold">Preparing your studio...</p>
      </div>
    </main>
  );
}
