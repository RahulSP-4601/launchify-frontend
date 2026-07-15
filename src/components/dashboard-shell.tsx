"use client";

import { useMemo } from "react";
import type { Session } from "@supabase/supabase-js";

import { ProjectsWorkspace } from "@/components/projects-workspace";
import { signOutUser } from "@/lib/supabase";
import { DashboardSection, useDashboardStore } from "@/lib/dashboard-store";

const navItems: Array<{ key: DashboardSection; label: string; short: string }> = [
  { key: "home", label: "Home", short: "HM" },
  { key: "projects", label: "Projects", short: "PR" },
  { key: "templates", label: "Templates", short: "TM" },
  { key: "analytics", label: "Analytics", short: "AN" },
  { key: "settings", label: "Settings", short: "ST" },
];

export function DashboardShell({ session }: { session: Session }) {
  const { activeSection, setActiveSection, setCreateProjectOpen } = useDashboardStore();
  const userInitials = useMemo(() => initials(session.user.user_metadata.full_name, session.user.email), [session.user.email, session.user.user_metadata.full_name]);

  return (
    <main className="min-h-screen bg-[var(--launchify-surface)] px-4 py-4 text-slate-950 lg:px-5">
      <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[34px] border border-black/6 bg-[#f3f4f7] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <SidebarHeader />
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium transition ${
                  activeSection === item.key ? "bg-white text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.08)]" : "text-slate-500 hover:bg-white/70"
                }`}
                onClick={() => setActiveSection(item.key)}
                type="button"
              >
                <span className={`grid h-9 w-9 place-items-center rounded-2xl ${activeSection === item.key ? "bg-[var(--launchify-accent)] text-white" : "bg-white text-slate-500"}`}>
                  {item.short}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
          <TrialCard />
          <UserPanel email={session.user.email ?? ""} initials={userInitials} onSignOut={() => void signOutUser()} />
        </aside>
        <section className="overflow-hidden rounded-[34px] border border-black/6 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <TopBar
            initials={userInitials}
            onCreateProject={() => {
              setActiveSection("projects");
              setCreateProjectOpen(true);
            }}
            section={activeSection}
          />
          <DashboardContent section={activeSection} />
        </section>
      </div>
    </main>
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
  return (
    <div className="mt-8 rounded-[26px] bg-[#111111] p-4 text-white">
      <p className="text-sm font-semibold">Get more out of Launchify</p>
      <p className="mt-2 text-sm text-white/66">Your trial simulates the Clueso-style free plan without payments enabled yet.</p>
      <div className="mt-4">
        <p className="text-2xl font-black">0 mins / 10 mins</p>
        <div className="mt-3 h-2 rounded-full bg-white/10">
          <div className="h-2 w-1/12 rounded-full bg-[var(--launchify-accent)]" />
        </div>
      </div>
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
  if (section === "analytics") {
    return <AnalyticsView />;
  }
  if (section === "settings") {
    return <SettingsView />;
  }
  return <ProjectsWorkspace section={section} />;
}

function AnalyticsView() {
  return (
    <div className="grid gap-4 p-5 lg:grid-cols-3">
      {["Videos created", "Export minutes", "Docs generated"].map((title, index) => (
        <article key={title} className="rounded-[28px] border border-black/6 bg-[#fafbfc] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{title}</p>
          <p className="mt-5 text-4xl font-black tracking-[-0.05em] text-slate-950">{index === 0 ? "0" : index === 1 ? "0.0" : "0"}</p>
          <p className="mt-2 text-sm text-slate-500">This will fill up once users start exporting Launchify assets.</p>
        </article>
      ))}
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
