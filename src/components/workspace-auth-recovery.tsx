"use client";

import { signOutUser } from "@/lib/supabase";

export function AuthenticationRecoveryCard({ message }: { message: string }) {
  return (
    <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-5">
      <p className="text-sm font-semibold text-rose-700">Session expired</p>
      <p className="mt-2 text-sm leading-7 text-rose-600">{message}</p>
      <button
        className="mt-4 rounded-[18px] bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
        onClick={() => void signOutUser()}
        type="button"
      >
        Sign out and sign in again
      </button>
    </div>
  );
}

export function AuthenticationRecoveryPanel({ message }: { message: string }) {
  return (
    <section className="rounded-[30px] border border-rose-200 bg-[linear-gradient(135deg,#fff1f3_0%,#ffffff_100%)] p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--launchify-accent)]">Session expired</p>
      <h3 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">Reconnect to continue your workspace.</h3>
      <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-500">{message}</p>
      <button
        className="mt-6 rounded-[18px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        onClick={() => void signOutUser()}
        type="button"
      >
        Sign out and sign in again
      </button>
    </section>
  );
}
