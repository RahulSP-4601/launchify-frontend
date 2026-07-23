import { ProjectDetail } from "@/lib/types";

export function normalizeSceneEnd(start: number, end: number, renderDuration: number | null) {
  if (end > start) return end;
  if (renderDuration && renderDuration > 0) return start + renderDuration;
  return start + 3;
}

export function projectDurationSeconds(project: ProjectDetail) {
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
