"use client";

import { PreviewStudioCard, useAssetObjectUrl } from "@/components/render-preview-studio";
import { ProjectDetail } from "@/lib/types";

export function RenderOutputCard({ project }: { project: ProjectDetail }) {
  const renderedPreviewUrl = useAssetObjectUrl(
    project.id,
    "source",
    Boolean(project.preview_video),
    project.preview_video?.storage_path ?? "",
    project.updated_at,
    "preview",
  );
  const sourceAssetUrl = useAssetObjectUrl(
    project.id,
    "source",
    Boolean(project.asset),
    project.asset?.storage_path ?? "",
    project.updated_at,
  );
  const usesRenderedPreview = Boolean(project.preview_video && renderedPreviewUrl.objectUrl);
  const sourceError = renderedPreviewUrl.error || sourceAssetUrl.error;
  const sourceUrl = renderedPreviewUrl.objectUrl || sourceAssetUrl.objectUrl;
  const voiceoverEnabled =
    !usesRenderedPreview &&
    project.voiceover?.status === "ready" &&
    project.voiceover?.mode !== "original";
  const voiceoverUrl = useAssetObjectUrl(
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
        voiceoverUrl={voiceoverUrl.objectUrl}
      />
    </div>
  );
}
