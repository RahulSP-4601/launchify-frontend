import {
  EditPlanScene,
  LaunchScriptScene,
  ProjectDetail,
  TranscriptResponse,
} from "@/lib/types";

export type EditorAspectRatio = "16:9" | "9:16" | "1:1";

export type EditorSceneDraft = {
  id: string;
  sceneNumber: number;
  title: string;
  spokenLine: string;
  onScreenText: string;
  start: number;
  end: number;
  source: "edit_plan" | "launch_script" | "transcript" | "fallback";
};

export type EditorCaptionDraft = {
  id: string;
  start: number;
  end: number;
  text: string;
  sceneId: string | null;
};

export type ProjectEditorDraft = {
  aspectRatio: EditorAspectRatio;
  selectedSceneId: string;
  showCaptions: boolean;
  scenes: EditorSceneDraft[];
  captions: EditorCaptionDraft[];
};

export function buildProjectEditorDraft(
  project: ProjectDetail,
  transcript: TranscriptResponse["transcript"],
): ProjectEditorDraft {
  const scenes = buildSceneDrafts(project, transcript);
  return {
    aspectRatio: "16:9",
    captions: buildCaptionDrafts(project, transcript, scenes),
    selectedSceneId: scenes[0]?.id ?? "scene-1",
    scenes,
    showCaptions: true,
  };
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
    end: normalizeEnd(scene.start, scene.end, scene.render_duration_seconds),
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

function normalizeEnd(start: number, end: number, renderDuration: number | null) {
  if (end > start) {
    return end;
  }
  if (renderDuration && renderDuration > 0) {
    return start + renderDuration;
  }
  return start + 3;
}

function projectDurationSeconds(project: ProjectDetail) {
  const launchScriptDuration = project.launch_script?.scenes.reduce(
    (total, scene) => total + Math.max(scene.estimated_duration_seconds || 0, 0),
    0,
  );
  const guideDuration = project.guide?.steps.at(-1)?.end ?? 0;
  return (
    project.preview_video?.duration_seconds ||
    project.edit_plan?.total_duration_seconds ||
    launchScriptDuration ||
    guideDuration ||
    12
  );
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
