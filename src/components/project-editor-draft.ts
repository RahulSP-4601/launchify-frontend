import {
  EditorEditMode,
  EditPlanScene,
  LaunchScriptScene,
  ProjectDetail,
  ProjectEditorSequence,
  TranscriptResponse,
} from "@/lib/types";
import { normalizeSceneEnd, projectDurationSeconds } from "@/components/project-editor-draft-builders";
import { deriveEditorSequence } from "@/components/project-editor-sequence";
import { buildDefaultToolState } from "@/components/project-editor-tool-state";
import type { ProjectEditorToolState } from "@/lib/types";

export type EditorAspectRatio = "16:9" | "9:16" | "1:1";

export type EditorSceneDraft = {
  id: string;
  sceneNumber: number;
  title: string;
  spokenLine: string;
  onScreenText: string;
  start: number;
  end: number;
  source: "edit_plan" | "launch_script" | "transcript" | "fallback" | "inserted" | "imported";
};

export type EditorCaptionDraft = {
  id: string;
  start: number;
  end: number;
  text: string;
  sceneId: string | null;
};

export type EditorCommentDraft = {
  id: string;
  sceneId: string | null;
  body: string;
  time: number;
  createdAt: string;
};

export type ProjectEditorDraft = {
  aspectRatio: EditorAspectRatio;
  editMode: EditorEditMode;
  headRevisionId: number | null;
  projectId: string;
  selectedClipId: string;
  selectedSceneId: string;
  selectedTrackId: string;
  showCaptions: boolean;
  scenes: EditorSceneDraft[];
  captions: EditorCaptionDraft[];
  comments: EditorCommentDraft[];
  toolState: ProjectEditorToolState;
  sequence: ProjectEditorSequence;
};

export function buildProjectEditorDraft(
  project: ProjectDetail,
  transcript: TranscriptResponse["transcript"],
): ProjectEditorDraft {
  const scenes = buildSceneDrafts(project, transcript);
  const captions = buildCaptionDrafts(project, transcript, scenes);
  const audioClips = buildAudioClipInputs(project);
  return {
    aspectRatio: "16:9",
    captions,
    comments: [],
    editMode: "overwrite",
    headRevisionId: null,
    projectId: project.id,
    selectedClipId: "",
    selectedSceneId: scenes[0]?.id ?? "scene-1",
    selectedTrackId: "track-video-1",
    sequence: deriveEditorSequence(project.id, scenes, captions, audioClips),
    scenes,
    showCaptions: true,
    toolState: buildDefaultToolState(),
  };
}

function buildAudioClipInputs(project: ProjectDetail) {
  return (project.voiceover?.clips ?? [])
    .filter((clip) => clip.audio_storage_path)
    .map((clip, index) => ({
      end: clip.end,
      id: `voiceover-${clip.scene_number}-${index + 1}`,
      sceneId: `scene-${clip.scene_number}`,
      start: clip.start,
      text: clip.text,
      title: clip.text.slice(0, 48) || `Voiceover ${clip.scene_number}`,
    }));
}

function buildSceneDrafts(
  project: ProjectDetail,
  transcript: TranscriptResponse["transcript"],
) {
  return (
    buildScenesFromEditPlan(project.edit_plan?.scenes ?? []) ||
    buildScenesFromLaunchScript(project.launch_script?.scenes ?? []) ||
    buildScenesFromTranscript(transcript) ||
    [buildFallbackScene(project)]
  );
}

function buildScenesFromEditPlan(scenes: EditPlanScene[]) {
  if (!scenes.length) {
    return null;
  }
  return scenes.map((scene) => ({
    end: normalizeSceneEnd(scene.start, scene.end, scene.render_duration_seconds),
    id: `scene-${scene.scene_number}`,
    onScreenText: scene.on_screen_text,
    sceneNumber: scene.scene_number,
    source: "edit_plan" as const,
    spokenLine: scene.spoken_line,
    start: scene.start,
    title: scene.title || scene.purpose || `Scene ${scene.scene_number}`,
  }));
}

function buildScenesFromLaunchScript(scenes: LaunchScriptScene[]) {
  if (!scenes.length) {
    return null;
  }
  let cursor = 0;
  return scenes.map((scene) => {
    const duration = Math.max(scene.estimated_duration_seconds || 4, 2.5);
    const nextScene = {
      end: cursor + duration,
      id: `scene-${scene.scene_number}`,
      onScreenText: scene.on_screen_text,
      sceneNumber: scene.scene_number,
      source: "launch_script" as const,
      spokenLine: scene.spoken_line,
      start: cursor,
      title: scene.purpose || `Scene ${scene.scene_number}`,
    };
    cursor += duration;
    return nextScene;
  });
}

function buildScenesFromTranscript(transcript: TranscriptResponse["transcript"]) {
  if (!transcript.length) {
    return null;
  }
  return transcript.slice(0, 8).map((segment, index) => ({
    end: Math.max(segment.end, segment.start + 1.5),
    id: `scene-${index + 1}`,
    onScreenText: segment.text,
    sceneNumber: index + 1,
    source: "transcript" as const,
    spokenLine: segment.text,
    start: segment.start,
    title: `Scene ${index + 1}`,
  }));
}

function buildFallbackScene(project: ProjectDetail): EditorSceneDraft {
  return {
    end: projectDurationSeconds(project),
    id: "scene-1",
    onScreenText: "Add on-screen guidance for your first scene.",
    sceneNumber: 1,
    source: "fallback",
    spokenLine: "Start shaping the first AI draft here.",
    start: 0,
    title: project.project_name,
  };
}

function buildCaptionDrafts(
  project: ProjectDetail,
  transcript: TranscriptResponse["transcript"],
  scenes: EditorSceneDraft[],
) {
  return (
    buildCaptionsFromEditPlan(project.edit_plan?.scenes ?? []) ||
    buildCaptionsFromTranscript(transcript, scenes) ||
    buildCaptionsFromScenes(scenes)
  );
}

function buildCaptionsFromEditPlan(scenes: EditPlanScene[]) {
  const captions = scenes.flatMap((scene) =>
    scene.captions.map((caption, index) => ({
      end: Math.max(caption.end, caption.start + 0.8),
      id: `caption-${scene.scene_number}-${index + 1}`,
      sceneId: `scene-${scene.scene_number}`,
      start: caption.start,
      text: caption.text,
    })),
  );
  return captions.length ? captions : null;
}

function buildCaptionsFromTranscript(
  transcript: TranscriptResponse["transcript"],
  scenes: EditorSceneDraft[],
) {
  if (!transcript.length) {
    return null;
  }
  return transcript.map((segment, index) => ({
    end: Math.max(segment.end, segment.start + 0.8),
    id: `caption-transcript-${index + 1}`,
    sceneId: sceneIdForTime(scenes, segment.start),
    start: segment.start,
    text: segment.text,
  }));
}

function buildCaptionsFromScenes(scenes: EditorSceneDraft[]) {
  return scenes.map((scene) => ({
    end: scene.end,
    id: `caption-${scene.sceneNumber}`,
    sceneId: scene.id,
    start: scene.start,
    text: scene.spokenLine,
  }));
}

function sceneIdForTime(scenes: EditorSceneDraft[], time: number) {
  return scenes.find((scene) => time >= scene.start && time <= scene.end)?.id ?? scenes[0]?.id ?? null;
}

export function reorderScenes(
  scenes: EditorSceneDraft[],
  sceneId: string,
  direction: "backward" | "forward",
) {
  const index = scenes.findIndex((scene) => scene.id === sceneId);
  const targetIndex = direction === "backward" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= scenes.length) {
    return scenes;
  }
  const nextScenes = [...scenes];
  const [scene] = nextScenes.splice(index, 1);
  nextScenes.splice(targetIndex, 0, scene);
  return nextScenes.map((item, nextIndex) => ({
    ...item,
    sceneNumber: nextIndex + 1,
  }));
}

export function sceneDuration(scene: EditorSceneDraft) {
  return Math.max(scene.end - scene.start, 0.5);
}

export function isInsertedScene(scene: EditorSceneDraft) {
  return scene.source === "inserted" || scene.id.startsWith("inserted-scene-");
}

export function activeCaptionAtTime(
  captions: EditorCaptionDraft[],
  currentTime: number,
) {
  return captions.find((caption) => currentTime >= caption.start && currentTime <= caption.end) ?? null;
}

export function updateSceneTiming(
  draft: ProjectEditorDraft,
  sceneId: string,
  field: "start" | "end",
  value: number,
  totalDuration: number,
) {
  const scenes = adjustSceneTiming(draft.scenes, sceneId, field, value, totalDuration);
  return {
    ...draft,
    captions: clampCaptionsToScenes(draft.captions, scenes, totalDuration),
    scenes,
  };
}

export function shiftSceneTiming(
  draft: ProjectEditorDraft,
  sceneId: string,
  delta: number,
  totalDuration: number,
) {
  const index = draft.scenes.findIndex((scene) => scene.id === sceneId);
  if (index < 0) {
    return draft;
  }
  const scene = draft.scenes[index];
  const duration = sceneDuration(scene);
  const previousEnd = draft.scenes[index - 1]?.end ?? 0;
  const nextStart = draft.scenes[index + 1]?.start ?? totalDuration;
  const start = clampValue(scene.start + delta, previousEnd, Math.max(nextStart - duration, previousEnd));
  return updateSceneTiming(
    updateSceneTiming(draft, sceneId, "start", start, totalDuration),
    sceneId,
    "end",
    start + duration,
    totalDuration,
  );
}

function adjustSceneTiming(
  scenes: EditorSceneDraft[],
  sceneId: string,
  field: "start" | "end",
  value: number,
  totalDuration: number,
) {
  const index = scenes.findIndex((scene) => scene.id === sceneId);
  if (index < 0) {
    return scenes;
  }
  const scene = scenes[index];
  const minimumEnd = roundToTenth(scene.start + 0.5);
  const maximumStart = roundToTenth(scene.end - 0.5);
  const nextLimit = scenes[index + 1]?.start ?? totalDuration;
  const previousLimit = scenes[index - 1]?.end ?? 0;
  const nextValue = field === "start"
    ? clampValue(value, previousLimit, maximumStart)
    : clampValue(value, minimumEnd, Math.max(nextLimit, minimumEnd));
  return scenes.map((item) => item.id === sceneId ? { ...item, [field]: roundToTenth(nextValue) } : item);
}

function clampCaptionsToScenes(
  captions: EditorCaptionDraft[],
  scenes: EditorSceneDraft[],
  totalDuration: number,
) {
  const scenesById = new Map(scenes.map((scene) => [scene.id, scene]));
  return captions.map((caption) => clampCaption(caption, scenesById.get(caption.sceneId ?? ""), totalDuration));
}

function clampCaption(
  caption: EditorCaptionDraft,
  scene: EditorSceneDraft | undefined,
  totalDuration: number,
) {
  const lowerBound = scene?.start ?? 0;
  const upperBound = scene?.end ?? totalDuration;
  const start = clampValue(caption.start, lowerBound, upperBound);
  const end = clampValue(caption.end, start + 0.2, upperBound);
  return { ...caption, end: roundToTenth(end), start: roundToTenth(start) };
}

function clampValue(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

export function insertScreenAfterScene(
  draft: ProjectEditorDraft,
  afterSceneId: string,
  durationSeconds: number,
) {
  const insertAfterIndex = draft.scenes.findIndex((scene) => scene.id === afterSceneId);
  const safeIndex = insertAfterIndex >= 0 ? insertAfterIndex : draft.scenes.length - 1;
  const anchorEnd = draft.scenes[safeIndex]?.end ?? 0;
  const insertDuration = roundToTenth(Math.max(durationSeconds, 0.5));
  const insertedSceneId = `inserted-scene-${draft.scenes.length + 1}-${Math.round(anchorEnd * 10)}`;
  const insertedScene: EditorSceneDraft = {
    end: roundToTenth(anchorEnd + insertDuration),
    id: insertedSceneId,
    onScreenText: "Add visual guidance for this inserted screen.",
    sceneNumber: safeIndex + 2,
    source: "inserted",
    spokenLine: "Inserted screen placeholder.",
    start: roundToTenth(anchorEnd),
    title: `Inserted Screen ${safeIndex + 2}`,
  };
  const shiftedScenes = draft.scenes.map((scene, index) => (
    index > safeIndex
      ? { ...scene, end: roundToTenth(scene.end + insertDuration), start: roundToTenth(scene.start + insertDuration) }
      : scene
  ));
  const scenes = [...shiftedScenes.slice(0, safeIndex + 1), insertedScene, ...shiftedScenes.slice(safeIndex + 1)]
    .map((scene, index) => ({ ...scene, sceneNumber: index + 1 }));
  const captions = draft.captions.map((caption) => (
    caption.start >= anchorEnd
      ? { ...caption, end: roundToTenth(caption.end + insertDuration), start: roundToTenth(caption.start + insertDuration) }
      : caption
  ));
  return {
    ...draft,
    captions,
    scenes,
    selectedSceneId: insertedSceneId,
  };
}

export function splitSceneAtTime(
  draft: ProjectEditorDraft,
  sceneId: string,
  splitTime: number,
) {
  const index = draft.scenes.findIndex((scene) => scene.id === sceneId);
  const scene = draft.scenes[index];
  if (!scene) {
    return draft;
  }
  const nextSplit = roundToTenth(clampValue(splitTime, scene.start + 0.5, scene.end - 0.5));
  if (nextSplit <= scene.start || nextSplit >= scene.end) {
    return draft;
  }
  const firstScene = { ...scene, end: nextSplit };
  const secondSceneId = `${scene.id}-split-${Math.round(nextSplit * 10)}`;
  const secondScene: EditorSceneDraft = {
    ...scene,
    id: secondSceneId,
    sceneNumber: scene.sceneNumber + 1,
    start: nextSplit,
    title: `${scene.title} (Cont.)`,
  };
  const captions = draft.captions.flatMap((caption) => splitCaptionAtTime(caption, scene, secondSceneId, nextSplit));
  return {
    ...draft,
    captions,
    scenes: rebuildSceneNumbers([
      ...draft.scenes.slice(0, index),
      firstScene,
      secondScene,
      ...draft.scenes.slice(index + 1),
    ]),
    selectedSceneId: secondSceneId,
  };
}

export function trimSceneBoundary(
  draft: ProjectEditorDraft,
  sceneId: string,
  nextBoundary: number,
  totalDuration: number,
) {
  const index = draft.scenes.findIndex((scene) => scene.id === sceneId);
  const currentScene = draft.scenes[index];
  const nextScene = draft.scenes[index + 1];
  if (!currentScene || !nextScene) {
    return draft;
  }
  const minimumBoundary = roundToTenth(currentScene.start + 0.5);
  const maximumBoundary = roundToTenth(nextScene.end - 0.5);
  const boundary = roundToTenth(clampValue(nextBoundary, minimumBoundary, maximumBoundary));
  const scenes = draft.scenes.map((scene, sceneIndex) => {
    if (sceneIndex === index) {
      return { ...scene, end: boundary };
    }
    if (sceneIndex === index + 1) {
      return { ...scene, start: boundary };
    }
    return scene;
  });
  return {
    ...draft,
    captions: clampCaptionsToScenes(draft.captions, scenes, totalDuration),
    scenes,
  };
}

function splitCaptionAtTime(
  caption: EditorCaptionDraft,
  scene: EditorSceneDraft,
  secondSceneId: string,
  splitTime: number,
) {
  if (caption.sceneId !== scene.id) {
    return [caption];
  }
  if (caption.end <= splitTime) {
    return [{ ...caption, end: Math.min(caption.end, splitTime), sceneId: scene.id }];
  }
  if (caption.start >= splitTime) {
    return [{ ...caption, sceneId: secondSceneId, start: Math.max(caption.start, splitTime) }];
  }
  return [
    { ...caption, end: splitTime, sceneId: scene.id },
    {
      ...caption,
      id: `${caption.id}-b`,
      sceneId: secondSceneId,
      start: splitTime,
    },
  ];
}

function rebuildSceneNumbers(scenes: EditorSceneDraft[]) {
  return scenes.map((scene, index) => ({ ...scene, sceneNumber: index + 1 }));
}
