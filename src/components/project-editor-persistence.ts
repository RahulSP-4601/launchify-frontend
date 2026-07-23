"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import {
  buildProjectEditorDraft,
  EditorCaptionDraft,
  EditorCommentDraft,
  EditorSceneDraft,
  ProjectEditorDraft,
} from "@/components/project-editor-draft";
import { useProjectEditorHistory } from "@/components/project-editor-history";
import { deriveEditorSequence } from "@/components/project-editor-sequence";
import { extractAudioInputs, syncSequenceWithDraft } from "@/components/project-editor-persistence-sequence";
import {
  fetchProjectEditorRevisions,
  fetchProjectEditorState,
  restoreProjectEditorRevision,
  saveProjectEditorState,
} from "@/lib/api";
import {
  ProjectDetail,
  ProjectEditorSequence,
  ProjectEditorState,
  ProjectEditorStateRecord,
  TranscriptResponse,
} from "@/lib/types";

const STORAGE_PREFIX = "launchify-editor-draft:";
const SAVE_DELAY_MS = 900;
type LocalDraftRecord = {
  draft: ProjectEditorDraft;
  savedAt: string;
};

type StoredLocalDraft = {
  editor_state: ProjectEditorState;
  head_revision_id?: number | null;
  saved_at: string;
};

export function useProjectEditorBootstrap(
  project: ProjectDetail,
  transcript: TranscriptResponse["transcript"],
) {
  const baseDraft = buildProjectEditorDraft(project, transcript);
  const localDraft = loadLocalDraft(project.id, baseDraft);
  const fallbackDraft = localDraft?.draft ?? baseDraft;
  const query = useQuery({
    queryKey: ["project-editor", project.id],
    queryFn: () => fetchProjectEditorState(project.id),
    retry: 1,
    staleTime: 30_000,
  });
  const revisions = useQuery({
    queryKey: ["project-editor-revisions", project.id],
    queryFn: () => fetchProjectEditorRevisions(project.id),
    retry: 1,
    staleTime: 15_000,
  });
  return {
    draft: shouldUseServerDraft(query.data, localDraft?.savedAt)
      ? editorDraftFromApiState(project.id, query.data!.editor_state, query.data!.head_revision_id, fallbackDraft.sequence)
      : fallbackDraft,
    localDraftSavedAt: localDraft?.savedAt ?? "",
    localOverrideActive: shouldPreferLocalDraft(localDraft?.savedAt ?? "", query.data?.updated_at),
    pending: query.isPending,
    record: query.data,
    revisions: revisions.data ?? [],
  };
}

export function usePersistedProjectEditorDraft(
  initialDraft: ProjectEditorDraft,
  projectId: string,
  localOverrideActive = false,
) {
  const queryClient = useQueryClient();
  const history = useProjectEditorHistory(initialDraft);
  const [lastSavedSerialized, setLastSavedSerialized] = useState(
    localOverrideActive ? "" : JSON.stringify(editorDraftToApiState(initialDraft)),
  );
  const lastSavedRef = useRef(lastSavedSerialized);
  const mutation = useSaveDraftMutation(projectId, queryClient, history.syncDraft, lastSavedRef, setLastSavedSerialized);
  const restoreMutation = useRestoreRevisionMutation(history.replaceDraft, lastSavedRef, projectId, queryClient, setLastSavedSerialized);

  useEffect(() => persistLocalDraft(projectId, history.draft), [history.draft, projectId]);
  useEffect(
    () => queueAutosave(history.draft, mutation, lastSavedRef),
    [history.draft, mutation, mutation.isPending],
  );

  return {
    canRedo: history.canRedo,
    canUndo: history.canUndo,
    draft: history.draft,
    hydrateSavedDraft: (nextDraft: ProjectEditorDraft, updatedAt: string, headRevisionId: number | null) => {
      history.replaceDraft(nextDraft);
      markSavedState(nextDraft, headRevisionId, lastSavedRef, queryClient, projectId, setLastSavedSerialized, updatedAt);
    },
    redo: history.redo,
    restoreRevision: (revisionId: number) => restoreMutation.mutate(revisionId),
    restoreRevisionPending: restoreMutation.isPending,
    saveLabel: saveLabelForMutation(mutation, lastSavedSerialized, history.draft),
    setDraft: history.setDraft,
    undo: history.undo,
  };
}

function useRestoreRevisionMutation(
  replaceDraft: ReturnType<typeof useProjectEditorHistory>["replaceDraft"],
  lastSavedRef: RefObject<string>,
  projectId: string,
  queryClient: ReturnType<typeof useQueryClient>,
  setLastSavedSerialized: (value: string) => void,
) {
  return useMutation({
    mutationFn: (revisionId: number) => restoreProjectEditorRevision(projectId, revisionId),
    onSuccess: (record) => {
      replaceDraft(editorDraftFromApiState(projectId, record.editor_state, record.head_revision_id));
      queryClient.setQueryData(["project-editor", projectId], { editor_state: record.editor_state, head_revision_id: record.head_revision_id, project_id: record.project_id, updated_at: record.updated_at });
      queryClient.invalidateQueries({ queryKey: ["project-editor-revisions", projectId] });
      const nextSaved = JSON.stringify(record.editor_state);
      lastSavedRef.current = nextSaved;
      setLastSavedSerialized(nextSaved);
    },
  });
}

function useSaveDraftMutation(
  projectId: string,
  queryClient: ReturnType<typeof useQueryClient>,
  syncDraft: ReturnType<typeof useProjectEditorHistory>["syncDraft"],
  lastSavedRef: RefObject<string>,
  setLastSavedSerialized: (value: string) => void,
) {
  return useMutation({
    mutationFn: (nextDraft: ProjectEditorDraft) => saveProjectEditorState(projectId, editorDraftToApiState(nextDraft), nextDraft.headRevisionId),
    onSuccess: (record) => {
      queryClient.setQueryData(["project-editor", projectId], record);
      queryClient.invalidateQueries({ queryKey: ["project-editor-revisions", projectId] });
      const nextSaved = JSON.stringify(record.editor_state);
      lastSavedRef.current = nextSaved;
      setLastSavedSerialized(nextSaved);
      syncDraft((current) => ({ ...current, headRevisionId: record.head_revision_id }));
    },
  });
}

function markSavedState(
  draft: ProjectEditorDraft,
  headRevisionId: number | null,
  lastSavedRef: RefObject<string>,
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
  setLastSavedSerialized: (value: string) => void,
  updatedAt: string,
) {
  const nextSaved = JSON.stringify(editorDraftToApiState(draft));
  lastSavedRef.current = nextSaved;
  queryClient.setQueryData(["project-editor", projectId], {
    editor_state: editorDraftToApiState(draft),
    head_revision_id: headRevisionId,
    project_id: projectId,
    updated_at: updatedAt,
  });
  setLastSavedSerialized(nextSaved);
}

function queueAutosave(
  draft: ProjectEditorDraft,
  mutation: ReturnType<typeof useMutation<ProjectEditorStateRecord, Error, ProjectEditorDraft>>,
  lastSavedRef: RefObject<string>,
) {
  const nextSerialized = JSON.stringify(editorDraftToApiState(draft));
  if (nextSerialized === lastSavedRef.current || mutation.isPending) {
    return;
  }
  const timeoutId = window.setTimeout(() => mutation.mutate(draft), SAVE_DELAY_MS);
  return () => window.clearTimeout(timeoutId);
}

function saveLabelForMutation(
  mutation: ReturnType<typeof useMutation<ProjectEditorStateRecord, Error, ProjectEditorDraft>>,
  lastSaved: string,
  draft: ProjectEditorDraft,
) {
  if (mutation.isPending) {
    return "Saving to cloud";
  }
  if (mutation.error instanceof Error) {
    return mutation.error.message.includes("newer editor revision exists") ? "Draft out of date" : "Save failed";
  }
  return JSON.stringify(editorDraftToApiState(draft)) === lastSaved ? "Saved to cloud" : "Unsaved changes";
}

function loadLocalDraft(projectId: string, fallbackDraft: ProjectEditorDraft) {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (!stored) {
      return null;
    }
    return parseLocalDraftRecord(projectId, JSON.parse(stored) as ProjectEditorState | StoredLocalDraft, fallbackDraft.sequence);
  } catch {
    return null;
  }
}

function persistLocalDraft(projectId: string, draft: ProjectEditorDraft) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${projectId}`,
      JSON.stringify({
        editor_state: editorDraftToApiState(draft),
        head_revision_id: draft.headRevisionId,
        saved_at: new Date().toISOString(),
      } satisfies StoredLocalDraft),
    );
  } catch {
    return;
  }
}

function parseLocalDraftRecord(
  projectId: string,
  value: ProjectEditorState | StoredLocalDraft,
  fallbackSequence: ProjectEditorSequence,
): LocalDraftRecord | null {
  if (isStoredLocalDraft(value)) {
    return {
      draft: editorDraftFromApiState(projectId, value.editor_state, value.head_revision_id ?? null, fallbackSequence),
      savedAt: value.saved_at,
    };
  }
  return {
    draft: editorDraftFromApiState(projectId, value, null, fallbackSequence),
    savedAt: "",
  };
}

function isStoredLocalDraft(value: ProjectEditorState | StoredLocalDraft): value is StoredLocalDraft {
  return "editor_state" in value && typeof value.saved_at === "string";
}

function shouldUseServerDraft(
  record: ProjectEditorStateRecord | null | undefined,
  localSavedAt?: string,
) {
  return Boolean(record?.editor_state) && !shouldPreferLocalDraft(localSavedAt ?? "", record?.updated_at);
}

export function shouldPreferLocalDraft(localSavedAt: string, serverUpdatedAt?: string | null) {
  if (!localSavedAt) {
    return false;
  }
  const parsedLocalSavedAt = parseTimestamp(localSavedAt);
  if (parsedLocalSavedAt === null) {
    return true;
  }
  if (!serverUpdatedAt) {
    return true;
  }
  const parsedServerUpdatedAt = parseTimestamp(serverUpdatedAt);
  if (parsedServerUpdatedAt === null) {
    return true;
  }
  return parsedLocalSavedAt > parsedServerUpdatedAt;
}

function parseTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function editorDraftToApiState(draft: ProjectEditorDraft): ProjectEditorState {
  const sequence = syncSequenceWithDraft(draft);
  return {
    aspect_ratio: draft.aspectRatio,
    captions: draft.captions.map((caption) => ({
      end: caption.end,
      id: caption.id,
      scene_id: caption.sceneId,
      start: caption.start,
      text: caption.text,
    })),
    comments: draft.comments.map((comment) => ({
      body: comment.body,
      created_at: comment.createdAt,
      id: comment.id,
      scene_id: comment.sceneId,
      time: comment.time,
    })),
    scenes: draft.scenes.map((scene) => ({
      end: scene.end,
      id: scene.id,
      on_screen_text: scene.onScreenText,
      scene_number: scene.sceneNumber,
      source: scene.source,
      spoken_line: scene.spokenLine,
      start: scene.start,
      title: scene.title,
    })),
    edit_mode: draft.editMode,
    selected_clip_id: draft.selectedClipId || null,
    selected_scene_id: draft.selectedSceneId,
    selected_track_id: draft.selectedTrackId,
    sequence,
    show_captions: draft.showCaptions,
    tool_state: draft.toolState,
  };
}

function editorDraftFromApiState(
  projectId: string,
  state: ProjectEditorState,
  headRevisionId: number | null,
  fallbackSequence?: ProjectEditorSequence,
): ProjectEditorDraft {
  const scenes = state.scenes.map(mapSceneFromApi);
  const captions = state.captions.map(mapCaptionFromApi);
  return {
    aspectRatio: state.aspect_ratio,
    captions,
    comments: mapCommentsFromApi(state.comments ?? []),
    editMode: state.edit_mode ?? "overwrite",
    headRevisionId,
    projectId,
    selectedClipId: state.selected_clip_id ?? "",
    scenes,
    selectedSceneId: state.selected_scene_id,
    selectedTrackId: state.selected_track_id || state.sequence?.tracks.find((track) => track.kind === "video")?.id || "track-video-1",
    sequence: state.sequence ?? deriveSequenceWithFallbackAudio(projectId, scenes, captions, fallbackSequence),
    showCaptions: state.show_captions,
    toolState: state.tool_state ?? defaultToolState(),
  };
}

function mapCommentsFromApi(comments: NonNullable<ProjectEditorState["comments"]>): EditorCommentDraft[] {
  return comments.map((comment) => ({
    body: comment.body,
    createdAt: comment.created_at,
    id: comment.id,
    sceneId: comment.scene_id,
    time: comment.time,
  }));
}

function defaultToolState() {
  return {
    active_caption_preset: "basic" as const,
    active_effect: null,
    active_shape: null,
    media_tab: "project" as const,
    pending_media_intent: null,
  };
}

function deriveSequenceWithFallbackAudio(
  projectId: string,
  scenes: ProjectEditorDraft["scenes"],
  captions: ProjectEditorDraft["captions"],
  fallbackSequence?: ProjectEditorSequence,
) {
  return deriveEditorSequence(
    projectId,
    scenes,
    captions,
    extractAudioInputs(fallbackSequence),
  );
}

function mapCaptionFromApi(caption: ProjectEditorState["captions"][number]): EditorCaptionDraft {
  return {
    end: caption.end,
    id: caption.id,
    sceneId: caption.scene_id,
    start: caption.start,
    text: caption.text,
  };
}

function mapSceneFromApi(scene: ProjectEditorState["scenes"][number]): EditorSceneDraft {
  return {
    end: scene.end,
    id: scene.id,
    onScreenText: scene.on_screen_text,
    sceneNumber: scene.scene_number,
    source: scene.source,
    spokenLine: scene.spoken_line,
    start: scene.start,
    title: scene.title,
  };
}
