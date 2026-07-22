"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Session } from "@supabase/supabase-js";

import { ProjectsWorkspace } from "@/components/projects-workspace";
import { fetchUsageSummary, isAuthenticationError } from "@/lib/api";
import { signOutUser } from "@/lib/supabase";
import { DashboardSection, useDashboardStore } from "@/lib/dashboard-store";

const navItems: Array<{ key: DashboardSection; label: string; short: string; locked?: boolean }> = [
  { key: "projects", label: "Projects", short: "PR" },
  { key: "templates", label: "Templates", short: "TM", locked: true },
  { key: "analytics", label: "Analytics", short: "AN", locked: true },
  { key: "settings", label: "Settings", short: "ST" },
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
          <DashboardContent section={activeSection} />
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
              : item.locked
                ? "text-slate-400"
                : "text-slate-500 hover:bg-white/70"
          }`}
          onClick={() => {
            if (item.locked) {
              return;
            }
            onSectionChange(item.key);
          }}
          type="button"
        >
          <span
            className={`grid h-9 w-9 place-items-center rounded-2xl ${
              activeSection === item.key
                ? "bg-[var(--launchify-accent)] text-white"
                : item.locked
                  ? "bg-white text-slate-300"
                  : "bg-white text-slate-500"
            }`}
          >
            {item.short}
          </span>
          <span>{item.label}</span>
          {item.locked ? <span className="ml-auto rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Soon</span> : null}
        </button>
      ))}
    </nav>
  );
}

function DashboardContent({ section }: { section: DashboardSection }) {
  if (section === "templates" || section === "analytics") {
    return <ComingSoonView section={section} />;
  }
  if (section === "settings") {
    return <SettingsView />;
  }
  return <ProjectsWorkspace section="projects" />;
}

function ComingSoonView({ section }: { section: "templates" | "analytics" }) {
  return (
    <div className="grid min-h-[calc(100vh-10rem)] place-items-center p-5">
      <section className="w-full max-w-3xl rounded-[34px] border border-black/6 bg-[linear-gradient(135deg,#fff6f7_0%,#ffffff_52%,#f6f8fb_100%)] p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.08)] lg:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--launchify-accent)]">Coming soon</p>
        <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] text-slate-950 capitalize">{section}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-500">
          We are polishing this area right now. For now, use Projects to create and manage launch-ready videos.
        </p>
      </section>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="grid gap-4 p-5 lg:grid-cols-2">
      <SettingsCard
        body="Later we’ll place branding, export defaults, providers, and workspace-level configuration here."
        title="Workspace settings"
      />
      <SettingsCard
        body="Trial usage, export limits, and subscription surfaces will live here once the payment system is added."
        title="Usage and billing"
      />
    </div>
  );
}

function SettingsCard({ body, title }: { body: string; title: string }) {
  return (
    <article className="rounded-[28px] border border-black/6 bg-[#fafbfc] p-5">
      <p className="text-lg font-bold text-slate-950">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-500">{body}</p>
    </article>
  );
}

function SidebarHeader() {
  return (
    <div className="flex items-center gap-3 px-2 pt-2">
      <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-[18px] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
        <Image
          alt="Launchify logo"
          className="h-9 w-9 object-contain"
          height={36}
          priority
          src="/logo.png"
          width={36}
        />
      </div>
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
