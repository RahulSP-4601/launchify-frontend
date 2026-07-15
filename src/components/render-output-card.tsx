"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { fetchRenderOutput } from "@/lib/api";
import { ProjectDetail } from "@/lib/types";

export function RenderOutputCard({
  project,
}: {
  project: ProjectDetail;
}) {
  const previewUrl = useRenderObjectUrl(project.id, "preview", project.has_preview_video);
  const finalUrl = useRenderObjectUrl(project.id, "final", project.has_final_video);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold text-slate-100">Rendered output</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <RenderVideoPanel
          error={previewUrl.error}
          label="Preview render"
          objectUrl={previewUrl.objectUrl}
          pending={previewUrl.pending}
          placeholder="Preview video will appear here once the renderer finishes."
        />
        <RenderVideoPanel
          error={finalUrl.error}
          label="Final render"
          objectUrl={finalUrl.objectUrl}
          pending={finalUrl.pending}
          placeholder="Final export will appear here after the production render completes."
        />
      </div>
    </div>
  );
}

function useRenderObjectUrl(projectId: string, variant: "preview" | "final", enabled: boolean) {
  const query = useQuery({
    queryKey: ["render-output", projectId, variant],
    queryFn: () => fetchRenderOutput(projectId, variant),
    enabled,
    staleTime: 60_000,
  });
  const objectUrl = useMemo(() => (query.data ? URL.createObjectURL(query.data) : ""), [query.data]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return {
    error: query.error instanceof Error ? query.error.message : "",
    objectUrl,
    pending: enabled && query.isPending,
  };
}

function RenderVideoPanel({
  error,
  label,
  objectUrl,
  pending,
  placeholder,
}: {
  error: string;
  label: string;
  objectUrl: string;
  pending: boolean;
  placeholder: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      {objectUrl ? (
        <video className="mt-3 w-full rounded-2xl border border-white/10 bg-black" controls src={objectUrl} />
      ) : (
        <p className="mt-3 text-sm text-slate-400">{pending ? "Rendering in progress..." : placeholder}</p>
      )}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
