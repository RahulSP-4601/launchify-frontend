"use client";

import Link from "next/link";

const featureCards = [
  "Turn rough screen recordings into polished launch videos",
  "Rewrite messy narration into a crisp product story",
  "Auto-zoom and highlight the moments that matter",
  "Generate export-ready captions and voiceover tracks",
];

const showcaseSteps = [
  "Upload raw walkthrough",
  "AI cleans transcript and script",
  "Motion plan locks zooms and captions",
  "Export polished launch video",
];

const testimonialRows = [
  "Product marketing teams move from hours of editing to minutes of review.",
  "Customer education teams scale launches, SOPs, and feature explainers from one recording.",
  "Launchify turns every rough demo into a production-grade asset with one workflow.",
];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--launchify-surface)] text-[var(--launchify-ink)]">
      <HeroBackdrop />
      <div className="relative mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <LandingNav />
        <section className="grid items-center gap-12 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <HeroCopy />
          <HeroVisual />
        </section>
        <FeatureStrip />
        <WorkflowSection />
        <SocialProof />
      </div>
    </main>
  );
}

function LandingNav() {
  return (
    <header className="flex items-center justify-between rounded-full border border-black/5 bg-white/80 px-5 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--launchify-accent)] text-sm font-black text-white">L</div>
        <div>
          <p className="text-lg font-bold">Launchify</p>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--launchify-muted)]">AI Product Video Studio</p>
        </div>
      </div>
      <Link
        className="rounded-full bg-[var(--launchify-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(239,35,60,0.24)] transition hover:-translate-y-0.5"
        href="/auth"
      >
        Get Started
      </Link>
    </header>
  );
}

function HeroCopy() {
  return (
    <div>
      <p className="inline-flex rounded-full border border-[var(--launchify-accent)]/15 bg-[var(--launchify-accent)]/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--launchify-accent)]">
        Raw recording in. Launch video out.
      </p>
      <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-slate-950 lg:text-7xl">
        Create Clueso-style product videos in a cleaner red brand system.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
        Launchify turns rough product walkthroughs into sexy, captioned, zoomed, voiceover-ready
        launch videos and documentation with an AI-first workflow built for product teams.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          className="rounded-full bg-[var(--launchify-accent)] px-6 py-4 text-sm font-semibold text-white shadow-[0_20px_60px_rgba(239,35,60,0.28)] transition hover:-translate-y-0.5"
          href="/auth"
        >
          Get Started
        </Link>
        <button className="rounded-full border border-black/10 bg-white px-6 py-4 text-sm font-semibold text-slate-900" type="button">
          Watch Demo
        </button>
      </div>
      <div className="mt-10 grid gap-3">
        {featureCards.map((feature) => (
          <div key={feature} className="flex items-center gap-3 text-sm text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--launchify-accent)]" />
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="absolute inset-6 rounded-[36px] bg-[radial-gradient(circle_at_top,rgba(239,35,60,0.24),transparent_58%)] blur-3xl" />
      <div className="relative overflow-hidden rounded-[40px] border border-black/10 bg-white p-5 shadow-[0_40px_140px_rgba(15,23,42,0.16)]">
        <div className="rounded-[30px] bg-[#111111] p-4 text-white">
          <div className="flex items-center justify-between rounded-[24px] bg-white/8 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/55">Launch Pipeline</p>
              <p className="mt-1 text-lg font-semibold">Feature Launch Template</p>
            </div>
            <div className="rounded-full bg-[var(--launchify-accent)] px-4 py-2 text-xs font-semibold">Rendering</div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] bg-white px-4 py-4 text-slate-900">
              <div className="grid gap-3">
                {showcaseSteps.map((step, index) => (
                  <div key={step} className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Step {index + 1}</p>
                    <p className="mt-1 text-sm font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#ef233c_0%,#1f1f1f_90%)] p-5">
              <div className="absolute right-5 top-5 h-18 w-18 rounded-full bg-white/20 blur-2xl" />
              <div className="rounded-[24px] border border-white/12 bg-black/16 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25em] text-white/60">Output Preview</p>
                <div className="mt-4 rounded-[22px] bg-white/95 px-5 py-8 text-center text-slate-950">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--launchify-accent)]">Auto Zoom</p>
                  <h3 className="mt-4 text-3xl font-black leading-tight">Launch your feature like it’s ready for the spotlight.</h3>
                  <p className="mt-4 text-sm text-slate-500">Clean captions. Smart highlights. Review-ready output.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureStrip() {
  return (
    <section className="mt-16 grid gap-4 lg:grid-cols-4">
      {featureCards.map((feature, index) => (
        <article key={feature} className="rounded-[32px] border border-black/8 bg-white px-5 py-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--launchify-accent)]">0{index + 1}</p>
          <p className="mt-3 text-base font-semibold leading-7 text-slate-900">{feature}</p>
        </article>
      ))}
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="mt-20 rounded-[40px] border border-black/6 bg-white px-6 py-8 shadow-[0_30px_100px_rgba(15,23,42,0.08)] lg:px-8 lg:py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--launchify-accent)]">How it works</p>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950">A Clueso-style funnel built for fast product activation.</h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
            First we attract with polished before/after storytelling. Then we convert through a
            Google-first signup. Then we drop users into a dashboard built to start projects fast,
            apply templates, and generate export-ready product videos.
          </p>
        </div>
        <div className="grid gap-3">
          {showcaseSteps.map((step, index) => (
            <div key={step} className="flex gap-4 rounded-[24px] bg-slate-50 px-4 py-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--launchify-accent)] text-sm font-bold text-white">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{step}</p>
                <p className="mt-1 text-sm leading-7 text-slate-500">Purpose-built to move users from trial to first export with minimal friction.</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="mt-20 pb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--launchify-accent)]">Why teams will switch</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {testimonialRows.map((row) => (
          <article key={row} className="rounded-[30px] border border-black/6 bg-white/88 px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-base leading-8 text-slate-700">{row}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HeroBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,35,60,0.2),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(239,35,60,0.15),transparent_24%),linear-gradient(180deg,#faf8f6_0%,#f1f4f8_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(90deg,rgba(239,35,60,0.06)_0,transparent_18%,transparent_82%,rgba(239,35,60,0.06)_100%)]" />
    </>
  );
}
