"use client";

import { PreviewStudioCard, useAssetObjectUrl } from "@/components/render-preview-studio";
import { ProjectDetail } from "@/lib/types";

export function RenderOutputCard({ project }: { project: ProjectDetail }) {
  const renderedPreviewUrl = useAssetObjectUrl(project.id, "source", Boolean(project.preview_video), "preview");
  const sourceAssetUrl = useAssetObjectUrl(project.id, "source", Boolean(project.asset));
  const usesRenderedPreview = Boolean(project.preview_video && renderedPreviewUrl.objectUrl);
  const sourceError = renderedPreviewUrl.error || sourceAssetUrl.error;
  const sourceUrl = renderedPreviewUrl.objectUrl || sourceAssetUrl.objectUrl;
  const voiceoverEnabled = !usesRenderedPreview && project.voiceover?.status === "ready" && project.voiceover?.mode !== "original";
  const voiceoverUrl = useAssetObjectUrl(project.id, "voiceover", voiceoverEnabled);

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
