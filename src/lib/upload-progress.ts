import { ProjectDetail, ProjectStatus } from "@/lib/types";

import { UploadOverlayState } from "@/components/upload-progress-modal";

const progressByStatus: Record<ProjectStatus, number> = {
  draft: 0,
  queued: 12,
  uploading: 22,
  transcribing: 38,
  scripting: 56,
  planning: 74,
  rendering: 92,
  ready: 100,
  failed: 100,
};

const detailByStatus: Record<ProjectStatus, { label: string; title: string; caption: string; phase: UploadOverlayState["phase"] }> = {
  draft: {
    label: "Waiting to start",
    title: "Choose your raw video",
    caption: "Select a walkthrough recording to start the Launchify pipeline.",
    phase: "uploading",
  },
  queued: {
    label: "Upload received",
    title: "Preparing your pipeline",
    caption: "Your file is in the queue and Launchify is preparing the processing steps.",
    phase: "processing",
  },
  uploading: {
    label: "Uploading raw video",
    title: "Sending your source file",
    caption: "Uploading your raw walkthrough to Launchify storage.",
    phase: "uploading",
  },
  transcribing: {
    label: "Transcribing",
    title: "Extracting spoken walkthrough",
    caption: "Launchify is converting your recording into a structured transcript.",
    phase: "processing",
  },
  scripting: {
    label: "Scripting",
    title: "Writing your launch narrative",
    caption: "The AI is rewriting the transcript into a sharper launch-ready script.",
    phase: "processing",
  },
  planning: {
    label: "Planning",
    title: "Building your grounded walkthrough",
    caption: "Launchify is preparing the guide, scene timing, focus moments, and AI voiceover for the Clueso-style preview.",
    phase: "processing",
  },
  rendering: {
    label: "Publishing preview",
    title: "Finalizing your grounded preview",
    caption: "Launchify is linking the original walkthrough with synced guide timing and AI voiceover for review.",
    phase: "processing",
  },
  ready: {
    label: "Ready",
    title: "Your grounded preview is ready",
    caption: "Processing is complete and your Clueso-style review preview is now available.",
    phase: "complete",
  },
  failed: {
    label: "Failed",
    title: "Processing needs attention",
    caption: "The pipeline stopped before completion. Review the project error and try again.",
    phase: "failed",
  },
};

function displayStatus(project: ProjectDetail): ProjectStatus {
  if (project.status === "ready" || project.status === "failed" || project.status === "draft") {
    return project.status;
  }
  if (project.preview_video || project.edit_plan || project.quality_report || project.benchmark_report) {
    return "rendering";
  }
  if (project.launch_script) {
    return "planning";
  }
  if (project.has_transcript) {
    return "scripting";
  }
  if (project.asset) {
    return "transcribing";
  }
  return project.status;
}

export function overlayFromProject(project: ProjectDetail, fallbackFileName: string): UploadOverlayState {
  const status = displayStatus(project);
  const detail = detailByStatus[status];
  return {
    active: status !== "draft",
    fileName: project.asset?.filename || fallbackFileName,
    label: detail.label,
    title: detail.title,
    caption: detail.caption,
    phase: detail.phase,
    progress: progressByStatus[status],
  };
}

export function uploadOverlayForFile(fileName: string, progress: number): UploadOverlayState {
  return {
    active: true,
    fileName,
    label: "Uploading raw video",
    title: "Sending your source file",
    caption: "Uploading your raw walkthrough to Launchify storage.",
    phase: "uploading",
    progress,
  };
}

export function uploadOverlayForFailure(fileName: string, message: string): UploadOverlayState {
  return {
    active: true,
    fileName,
    label: "Processing interrupted",
    title: "Launchify lost contact with the backend",
    caption: message,
    phase: "failed",
    progress: 100,
  };
}

export function shouldSyncUploadOverlay(
  project: ProjectDetail | undefined,
  selectedProjectId: string,
  active: boolean,
  phase: UploadOverlayState["phase"],
) {
  if (!selectedProjectId || !project || project.status === "draft") {
    return false;
  }
  if (!active && (project.status === "ready" || project.status === "failed")) {
    return false;
  }
  if (active && phase === "uploading") {
    return false;
  }
  return true;
}
