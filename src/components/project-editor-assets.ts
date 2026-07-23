"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ProjectEditorDraft } from "@/components/project-editor-draft";
import {
  fetchProjectEditorAssets,
  importProjectEditorAsset,
  uploadProjectEditorAsset,
} from "@/lib/api";
import type { ProjectEditorMediaAsset } from "@/lib/types";

export function useProjectEditorAssets(
  projectId: string,
  draft: ProjectEditorDraft,
  insertMediaAsset: (asset: ProjectEditorMediaAsset) => void,
  setMediaIntent: (intent: ProjectEditorDraft["toolState"]["pending_media_intent"]) => void,
) {
  const queryClient = useQueryClient();
  const scope = draft.toolState.media_tab === "saved" ? "saved" : "project";
  const assetsQuery = useQuery({
    queryFn: () => fetchProjectEditorAssets(projectId, scope),
    queryKey: ["project-editor-assets", projectId, scope],
  });
  const uploadAsset = useMutation({
    mutationFn: async (file: File) => uploadProjectEditorAsset(projectId, file, await mediaDuration(file)),
    onSuccess: (asset) => handleAssetResolved(queryClient, projectId, insertMediaAsset, setMediaIntent, asset),
  });
  const importAsset = useMutation({
    mutationFn: (asset: ProjectEditorMediaAsset) => importProjectEditorAsset(projectId, {
      asset_id: asset.source === "uploaded" || asset.source === "imported" ? asset.id : null,
      duration_seconds: asset.duration_seconds,
      source_project_id: asset.source_project_id ?? asset.project_id,
      variant: asset.source === "uploaded" || asset.source === "imported"
        ? "asset"
        : asset.kind === "audio"
          ? "voiceover"
          : "source",
    }),
    onSuccess: (asset) => handleAssetResolved(queryClient, projectId, insertMediaAsset, setMediaIntent, asset),
  });
  return {
    assets: assetsQuery.data ?? [],
    assetsPending: assetsQuery.isPending || uploadAsset.isPending || importAsset.isPending,
    handleFileSelection: (file: File | null) => file ? uploadAsset.mutate(file) : null,
    onAssetSelect: (asset: ProjectEditorMediaAsset) => selectEditorAsset(asset, draft.projectId, importAsset.mutate, insertMediaAsset),
  };
}

function handleAssetResolved(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
  insertMediaAsset: (asset: ProjectEditorMediaAsset) => void,
  setMediaIntent: (intent: ProjectEditorDraft["toolState"]["pending_media_intent"]) => void,
  asset: ProjectEditorMediaAsset,
) {
  queryClient.invalidateQueries({ queryKey: ["project-editor-assets", projectId] });
  insertMediaAsset(asset);
  setMediaIntent(null);
}

function selectEditorAsset(
  asset: ProjectEditorMediaAsset,
  projectId: string,
  importAsset: (asset: ProjectEditorMediaAsset) => void,
  insertMediaAsset: (asset: ProjectEditorMediaAsset) => void,
) {
  if (asset.project_id !== projectId) {
    importAsset(asset);
    return;
  }
  insertMediaAsset(asset);
}

async function mediaDuration(file: File) {
  const mediaType = sniffMediaTag(file);
  if (!mediaType) {
    return null;
  }
  return new Promise<number | null>((resolve) => {
    const element = document.createElement(mediaType);
    const objectUrl = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(objectUrl);
    element.preload = "metadata";
    element.onloadedmetadata = () => {
      const duration = Number.isFinite(element.duration) ? element.duration : null;
      cleanup();
      resolve(duration);
    };
    element.onerror = () => {
      cleanup();
      resolve(null);
    };
    element.src = objectUrl;
  });
}

function sniffMediaTag(file: File) {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  const name = file.name.toLowerCase();
  if ([".mp3", ".wav", ".m4a"].some((extension) => name.endsWith(extension))) return "audio";
  if ([".mp4", ".mov", ".webm"].some((extension) => name.endsWith(extension))) return "video";
  return null;
}
