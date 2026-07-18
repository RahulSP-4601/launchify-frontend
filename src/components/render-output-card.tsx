"use client";

import { PreviewStudioCard, useAssetObjectUrl } from "@/components/render-preview-studio";
import { ProjectDetail } from "@/lib/types";

export function RenderOutputCard({ project }: { project: ProjectDetail }) {
  const sourceUrl = useAssetObjectUrl(project.id, "source", Boolean(project.asset));
  const voiceoverEnabled = project.voiceover?.status === "ready" && project.voiceover?.mode !== "original";
  const voiceoverUrl = useAssetObjectUrl(project.id, "voiceover", voiceoverEnabled);

  return (
    <div className="space-y-4">
      <PreviewStudioCard
        project={project}
        sourceError={sourceUrl.error}
        sourceUrl={sourceUrl.objectUrl}
        voiceoverError={voiceoverUrl.error}
        voiceoverUrl={voiceoverUrl.objectUrl}
      />
    </div>
  );
}
