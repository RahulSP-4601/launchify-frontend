"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Session } from "@supabase/supabase-js";

import { ProjectsWorkspace } from "@/components/projects-workspace";
import { fetchUsageSummary, isAuthenticationError } from "@/lib/api";
import { signOutUser } from "@/lib/supabase";
import { DashboardSection, useDashboardStore } from "@/lib/dashboard-store";

const navItems: Array<{ key: DashboardSection; label: string; short: string }> = [
  { key: "projects", label: "Projects", short: "PR" },
];

export function DashboardShell({ session }: { session: Session }) {
  const { activeSection, setActiveSection } = useDashboardStore();
  const userInitials = useMemo(
    () => initials(session.user.user_metadata.full_name, session.user.email),
    [session.user.email, session.user.user_metadata.full_name],
  );

  return (
    <main className="min-h-screen bg-[var(--launchify-surface)] px-4 py-4 text-slate-950 lg:px-5">
      <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <DashboardSidebar
          activeSection={activeSection}
          email={session.user.email ?? ""}
          initials={userInitials}
          onSectionChange={setActiveSection}
        />
        <section className="overflow-hidden rounded-[34px] border border-black/6 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <ProjectsWorkspace section="projects" />
        </section>
      </div>
    </main>
  );
}

function DashboardSidebar({
  activeSection,
  email,
  initials,
  onSectionChange,
}: {
  activeSection: DashboardSection;
  email: string;
  initials: string;
  onSectionChange: (section: DashboardSection) => void;
}) {
  return (
    <aside className="rounded-[34px] border border-black/6 bg-[#f3f4f7] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <SidebarHeader />
      <SidebarNav activeSection={activeSection} onSectionChange={onSectionChange} />
      <TrialCard />
      <UserPanel email={email} initials={initials} onSignOut={() => void signOutUser()} />
    </aside>
  );
}

function SidebarNav({
  activeSection,
  onSectionChange,
}: {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}) {
  return (
    <nav className="mt-8 space-y-2">
      {navItems.map((item) => (
        <button
          key={item.key}
          className={`flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium transition ${
            activeSection === item.key
              ? "bg-white text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
              : "text-slate-500 hover:bg-white/70"
          }`}
          onClick={() => onSectionChange(item.key)}
          type="button"
        >
          <span
            className={`grid h-9 w-9 place-items-center rounded-2xl ${
              activeSection === item.key ? "bg-[var(--launchify-accent)] text-white" : "bg-white text-slate-500"
            }`}
          >
            {item.short}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function SidebarHeader() {
  return (
    <div className="flex items-center gap-3 px-2 pt-2">
      <div className="grid h-11 w-11 place-items-center rounded-[18px] bg-[var(--launchify-accent)] text-base font-black text-white">L</div>
      <div>
        <p className="text-xl font-bold">Launchify</p>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Product video studio</p>
      </div>
    </div>
  );
}

function TrialCard() {
  const usageQuery = useQuery({
    queryKey: ["usage"],
    queryFn: fetchUsageSummary,
    refetchInterval: (query) => (isAuthenticationError(query.state.error) ? false : 30000),
    retry: (failureCount, error) => !isAuthenticationError(error) && failureCount < 2,
  });
  const usage = usageQuery.data;
  const usedMinutes = usage ? formatMinutes(usage.used_seconds) : "0.0";
  const limitMinutes = usage ? formatMinutes(usage.limit_seconds) : "10.0";
  const progress = usage ? Math.min((usage.used_seconds / usage.limit_seconds) * 100, 100) : 0;
  const authError = usageQuery.error instanceof Error && isAuthenticationError(usageQuery.error) ? usageQuery.error.message : "";
  const body = usage?.blocked
    ? "Your trial limit has been reached. Uploads are blocked until billing logic is added."
    : authError
      ? "We could not verify trial usage because your session needs to be refreshed."
      : "Your trial usage is now based on rendered final video duration.";

  return (
    <div className="mt-8 rounded-[26px] bg-[#111111] p-4 text-white">
      <p className="text-sm font-semibold">Get more out of Launchify</p>
      <p className="mt-2 text-sm text-white/66">{body}</p>
      <div className="mt-4">
        <p className="text-2xl font-black">{usedMinutes} mins / {limitMinutes} mins</p>
        <div className="mt-3 h-2 rounded-full bg-white/10">
          <div className="h-2 rounded-full bg-[var(--launchify-accent)]" style={{ width: `${progress}%` }} />
        </div>
      </div>
      {usageQuery.error instanceof Error ? <p className="mt-3 text-sm text-rose-300">{usageQuery.error.message}</p> : null}
      {authError ? (
        <button
          className="mt-4 w-full rounded-[18px] bg-white px-4 py-3 text-sm font-semibold text-slate-950"
          onClick={() => void signOutUser()}
          type="button"
        >
          Sign out and sign in again
        </button>
      ) : (
        <button className="mt-4 w-full rounded-[18px] bg-white px-4 py-3 text-sm font-semibold text-slate-950" type="button">
          Upgrade Later
        </button>
      )}
    </div>
  );
}

function UserPanel({
  email,
  initials,
  onSignOut,
}: {
  email: string;
  initials: string;
  onSignOut: () => void;
}) {
  return (
    <div className="mt-8 rounded-[24px] border border-black/8 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2563eb] text-sm font-bold text-white">{initials}</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{email}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Launch team</p>
        </div>
      </div>
      <button className="mt-4 w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" onClick={onSignOut} type="button">
        Sign out
      </button>
    </div>
  );
}

function initials(name: string | undefined, email: string | undefined) {
  const source = name?.trim() || email?.trim() || "LA";
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMinutes(seconds: number) {
  return (seconds / 60).toFixed(1);
}
