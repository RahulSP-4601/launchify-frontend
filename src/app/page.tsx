export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
      <section className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-slate-950/50 backdrop-blur">
        <div className="mb-8 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">
          Launchify setup is ready
        </div>
        <div className="space-y-4">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Frontend scaffolded with Next.js, TypeScript, Tailwind, Zustand, and TanStack Query.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            This is the clean starting shell for the Launchify workspace. We can layer auth,
            dashboard routes, editor state, and API integration on top of this without reworking
            the foundation.
          </p>
        </div>
      </section>
    </main>
  );
}
