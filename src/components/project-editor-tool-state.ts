"use client";

import type { EditorCommentDraft, ProjectEditorDraft } from "@/components/project-editor-draft";
import type { ProjectEditorComment, ProjectEditorToolState } from "@/lib/types";

export function buildDefaultToolState(): ProjectEditorToolState {
  return {
    active_caption_preset: "basic",
    active_effect: null,
    active_shape: null,
    media_tab: "project",
    pending_media_intent: null,
  };
}

export function commentsForScene(
  comments: EditorCommentDraft[],
  sceneId: string | null,
) {
  return comments
    .filter((comment) => comment.sceneId === sceneId)
    .sort((left, right) => left.time - right.time);
}

export function addCommentDraft(
  draft: ProjectEditorDraft,
  input: Pick<ProjectEditorComment, "body" | "scene_id" | "time">,
) {
  const nextComment: EditorCommentDraft = {
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
    id: `comment-${draft.comments.length + 1}-${Math.round(input.time * 10)}`,
    sceneId: input.scene_id,
    time: input.time,
  };
  if (!nextComment.body) {
    return draft;
  }
  return {
    ...draft,
    comments: [...draft.comments, nextComment],
  };
}
