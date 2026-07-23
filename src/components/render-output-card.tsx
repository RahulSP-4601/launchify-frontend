"use client";

import { PreviewStudioCard, useAssetUrl } from "@/components/render-preview-studio";
import { ProjectDetail } from "@/lib/types";

export function RenderOutputCard({ project }: { project: ProjectDetail }) {
  const renderedPreviewUrl = useAssetUrl(
    project.id,
    "source",
    Boolean(project.preview_video),
    project.preview_video?.storage_path ?? "",
    project.updated_at,
    "preview",
  );
  const sourceAssetUrl = useAssetUrl(
    project.id,
    "source",
    Boolean(project.asset),
    project.asset?.storage_path ?? "",
    project.updated_at,
  );
  const usesRenderedPreview = Boolean(project.preview_video && renderedPreviewUrl.url);
  const sourceError = renderedPreviewUrl.error || sourceAssetUrl.error;
  const sourceUrl = renderedPreviewUrl.url || sourceAssetUrl.url;
  const voiceoverEnabled =
    !usesRenderedPreview &&
    project.voiceover?.status === "ready" &&
    project.voiceover?.mode !== "original";
  const voiceoverUrl = useAssetUrl(
    project.id,
    "voiceover",
    voiceoverEnabled,
    project.voiceover?.audio_storage_path || project.updated_at,
    project.updated_at,
  );

  return (
    <div className="space-y-4">
      <PreviewStudioCard
        project={project}
        sourceError={sourceError}
        sourceUrl={sourceUrl}
        usesRenderedPreview={usesRenderedPreview}
        voiceoverError={voiceoverUrl.error}
        voiceoverUrl={voiceoverUrl.url}
      />
    </div>
  );
}
