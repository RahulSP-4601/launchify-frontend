"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Session } from "@supabase/supabase-js";

import { ProjectsWorkspace } from "@/components/projects-workspace";
import { fetchUsageSummary } from "@/lib/api";
import { signOutUser } from "@/lib/supabase";
import { DashboardSection, useDashboardStore } from "@/lib/dashboard-store";

const navItems: Array<{ key: DashboardSection; label: string; short: string; locked?: boolean }> = [
  { key: "home", label: "Home", short: "HM" },
  { key: "projects", label: "Projects", short: "PR" },
  { key: "templates", label: "Templates", short: "TM", locked: true },
  { key: "analytics", label: "Analytics", short: "AN", locked: true },
  { key: "settings", label: "Settings", short: "ST" },
];

export function DashboardShell({ session }: { session: Session }) {
  const { activeSection, setActiveSection, setCreateProjectOpen } = useDashboardStore();
  const userInitials = useMemo(() => initials(session.user.user_metadata.full_name, session.user.email), [session.user.email, session.user.user_metadata.full_name]);
  const openCreateProject = () => {
    setActiveSection("projects");
    setCreateProjectOpen(true);
  };

  return (
    <main className="min-h-screen bg-[var(--launchify-surface)] px-4 py-4 text-slate-950 lg:px-5">
      <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <DashboardSidebar
          activeSection={activeSection}
          email={session.user.email ?? ""}
          initials={userInitials}
          onSectionChange={setActiveSection}
        />
        <DashboardMain
          initials={userInitials}
          onCreateProject={openCreateProject}
          section={activeSection}
        />
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

function DashboardMain({
  initials,
  onCreateProject,
  section,
}: {
  initials: string;
  onCreateProject: () => void;
  section: DashboardSection;
}) {
  return (
    <section className="overflow-hidden rounded-[34px] border border-black/6 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <TopBar initials={initials} onCreateProject={onCreateProject} section={section} />
      <DashboardContent section={section} />
    </section>
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
        <SidebarNavButton
          activeSection={activeSection}
          item={item}
          key={item.key}
          onSectionChange={onSectionChange}
        />
      ))}
    </nav>
  );
}

function SidebarNavButton({
  activeSection,
  item,
  onSectionChange,
}: {
  activeSection: DashboardSection;
  item: { key: DashboardSection; label: string; short: string; locked?: boolean };
  onSectionChange: (section: DashboardSection) => void;
}) {
  const isActive = activeSection === item.key;
  const buttonClass = isActive
    ? "bg-white text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
    : item.locked
      ? "text-slate-400"
      : "text-slate-500 hover:bg-white/70";
  const iconClass = isActive
    ? "bg-[var(--launchify-accent)] text-white"
    : item.locked
      ? "bg-white text-slate-300"
      : "bg-white text-slate-500";

  return (
    <button
      className={`flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium transition ${buttonClass}`}
      onClick={() => {
        if (item.locked) {
          return;
        }
        onSectionChange(item.key);
      }}
      type="button"
    >
      <span className={`grid h-9 w-9 place-items-center rounded-2xl ${iconClass}`}>
        {item.short}
      </span>
      <span>{item.label}</span>
      {item.locked ? <span className="ml-auto rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Soon</span> : null}
    </button>
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
    refetchInterval: 5000,
  });
  const usage = usageQuery.data;
  const usedMinutes = usage ? formatMinutes(usage.used_seconds) : "0.0";
  const limitMinutes = usage ? formatMinutes(usage.limit_seconds) : "10.0";
  const progress = usage ? Math.min((usage.used_seconds / usage.limit_seconds) * 100, 100) : 0;
  const body = usage?.blocked
    ? "Your trial limit has been reached. Uploads are blocked until billing logic is added."
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
      <button className="mt-4 w-full rounded-[18px] bg-white px-4 py-3 text-sm font-semibold text-slate-950" type="button">
        Upgrade Later
      </button>
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

function TopBar({
  initials,
  onCreateProject,
  section,
}: {
  initials: string;
  onCreateProject: () => void;
  section: DashboardSection;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-black/6 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
        <div className="flex h-14 w-full items-center justify-between rounded-[20px] border border-black/7 bg-[#f8f9fb] px-4 text-sm text-slate-400 lg:w-[460px]">
          <span>Search anything...</span>
          <span className="rounded-xl border border-black/8 bg-white px-2 py-1 text-xs font-semibold text-slate-400">⌘ K</span>
        </div>
        <p className="hidden text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 lg:block">{section}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2563eb] text-sm font-bold text-white">{initials}</div>
        <button
          className="rounded-[18px] bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(239,35,60,0.2)]"
          onClick={onCreateProject}
          type="button"
        >
          New project
        </button>
      </div>
    </header>
  );
}

function DashboardContent({ section }: { section: DashboardSection }) {
  if (section === "templates" || section === "analytics") {
    return <ComingSoonView section={section} />;
  }
  if (section === "settings") {
    return <SettingsView />;
  }
  return <ProjectsWorkspace section={section} />;
}

function ComingSoonView({ section }: { section: "templates" | "analytics" }) {
  return (
    <div className="grid min-h-[calc(100vh-10rem)] place-items-center p-5">
      <section className="w-full max-w-3xl rounded-[34px] border border-black/6 bg-[linear-gradient(135deg,#fff6f7_0%,#ffffff_52%,#f6f8fb_100%)] p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.08)] lg:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--launchify-accent)]">Coming soon</p>
        <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] text-slate-950 capitalize">{section}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-500">
          We are polishing this area right now. For now, use Home and Projects to create and manage launch-ready videos.
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
