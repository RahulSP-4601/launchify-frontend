"use client";

import { EditorSceneDraft, isInsertedScene, sceneDuration } from "@/components/project-editor-draft";

export type PlaybackSegment = {
  editorEnd: number;
  editorStart: number;
  sceneId: string;
  sourceEnd: number;
  sourceStart: number;
};

export function buildPlaybackSegments(scenes: EditorSceneDraft[]) {
  let sourceCursor = 0;
  return scenes.map((scene) => {
    const duration = sceneDuration(scene);
    const sourceStart = sourceCursor;
    const sourceEnd = isInsertedScene(scene) ? sourceCursor : sourceCursor + duration;
    if (!isInsertedScene(scene)) {
      sourceCursor = sourceEnd;
    }
    return {
      editorEnd: scene.end,
      editorStart: scene.start,
      sceneId: scene.id,
      sourceEnd,
      sourceStart,
    };
  });
}

export function sourceTimeForEditorTime(
  currentTime: number,
  scenes: EditorSceneDraft[],
) {
  const segment = findPlaybackSegment(currentTime, scenes);
  if (!segment) return 0;
  const scene = scenes.find((item) => item.id === segment.sceneId);
  if (!scene || isInsertedScene(scene)) {
    return segment.sourceStart;
  }
  const progress = (currentTime - segment.editorStart) / Math.max(segment.editorEnd - segment.editorStart, 0.001);
  return segment.sourceStart + Math.max(segment.sourceEnd - segment.sourceStart, 0) * Math.min(Math.max(progress, 0), 1);
}

export function insertedSceneAtTime(
  currentTime: number,
  scenes: EditorSceneDraft[],
) {
  const scene = scenes.find((item) => currentTime >= item.start && currentTime <= item.end);
  return scene && isInsertedScene(scene) ? scene : null;
}

function findPlaybackSegment(currentTime: number, scenes: EditorSceneDraft[]) {
  const segments = buildPlaybackSegments(scenes);
  return segments.find((segment) => currentTime >= segment.editorStart && currentTime <= segment.editorEnd)
    ?? segments.at(-1)
    ?? null;
}
