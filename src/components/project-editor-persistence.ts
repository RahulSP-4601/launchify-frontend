"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import {
  buildProjectEditorDraft,
  EditorCaptionDraft,
  EditorSceneDraft,
  ProjectEditorDraft,
} from "@/components/project-editor-draft";
import { useProjectEditorHistory } from "@/components/project-editor-history";
import {
  fetchProjectEditorState,
  saveProjectEditorState,
} from "@/lib/api";
import {
  ProjectDetail,
  ProjectEditorState,
  ProjectEditorStateRecord,
  TranscriptResponse,
} from "@/lib/types";

const STORAGE_PREFIX = "launchify-editor-draft:";
const SAVE_DELAY_MS = 900;

export function useProjectEditorBootstrap(
  project: ProjectDetail,
  transcript: TranscriptResponse["transcript"],
) {
  const fallbackDraft = loadLocalDraft(project.id) ?? buildProjectEditorDraft(project, transcript);
  const query = useQuery({
    queryKey: ["project-editor", project.id],
    queryFn: () => fetchProjectEditorState(project.id),
    retry: 1,
    staleTime: 30_000,
  });
  return {
    draft: query.data?.editor_state ? editorDraftFromApiState(query.data.editor_state) : fallbackDraft,
    pending: query.isPending,
    record: query.data,
  };
}

export function usePersistedProjectEditorDraft(
  initialDraft: ProjectEditorDraft,
  projectId: string,
) {
  const queryClient = useQueryClient();
  const history = useProjectEditorHistory(initialDraft);
  const [lastSavedSerialized, setLastSavedSerialized] = useState(
    JSON.stringify(editorDraftToApiState(initialDraft)),
  );
  const lastSavedRef = useRef(lastSavedSerialized);
  const mutation = useMutation({
    mutationFn: (nextDraft: ProjectEditorDraft) =>
      saveProjectEditorState(projectId, editorDraftToApiState(nextDraft)),
    onSuccess: (record) => {
      queryClient.setQueryData(["project-editor", projectId], record);
      const nextSaved = JSON.stringify(record.editor_state);
      lastSavedRef.current = nextSaved;
      setLastSavedSerialized(nextSaved);
    },
  });

  useEffect(() => persistLocalDraft(projectId, history.draft), [history.draft, projectId]);
  useEffect(
    () => queueAutosave(history.draft, mutation, lastSavedRef),
    [history.draft, mutation, mutation.isPending],
  );

  return {
    canRedo: history.canRedo,
    canUndo: history.canUndo,
    draft: history.draft,
    hydrateSavedDraft: (nextDraft: ProjectEditorDraft, updatedAt: string) => {
      history.replaceDraft(nextDraft);
      markSavedState(nextDraft, lastSavedRef, queryClient, projectId, setLastSavedSerialized, updatedAt);
    },
    redo: history.redo,
    saveLabel: saveLabelForMutation(mutation, lastSavedSerialized, history.draft),
    setDraft: history.setDraft,
    undo: history.undo,
  };
}

function markSavedState(
  draft: ProjectEditorDraft,
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
    return "Save failed";
  }
  return JSON.stringify(editorDraftToApiState(draft)) === lastSaved ? "Saved to cloud" : "Unsaved changes";
}

function loadLocalDraft(projectId: string) {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (!stored) {
      return null;
    }
    return editorDraftFromApiState(JSON.parse(stored) as ProjectEditorState);
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
      JSON.stringify(editorDraftToApiState(draft)),
    );
  } catch {
    return;
  }
}

export function editorDraftToApiState(draft: ProjectEditorDraft): ProjectEditorState {
  return {
    aspect_ratio: draft.aspectRatio,
    captions: draft.captions.map((caption) => ({
      end: caption.end,
      id: caption.id,
      scene_id: caption.sceneId,
      start: caption.start,
      text: caption.text,
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
    selected_scene_id: draft.selectedSceneId,
    show_captions: draft.showCaptions,
  };
}

function editorDraftFromApiState(state: ProjectEditorState): ProjectEditorDraft {
  return {
    aspectRatio: state.aspect_ratio,
    captions: state.captions.map(mapCaptionFromApi),
    scenes: state.scenes.map(mapSceneFromApi),
    selectedSceneId: state.selected_scene_id,
    showCaptions: state.show_captions,
  };
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
