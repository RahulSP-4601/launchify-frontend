export type ProjectStatus = "draft" | "queued" | "uploading" | "transcribing" | "scripting" | "ready" | "failed";

export type ProjectSummary = {
  id: string;
  project_name: string;
  product_name: string;
  video_goal: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  has_transcript: boolean;
  has_launch_script: boolean;
};

export type LaunchScriptScene = {
  scene_number: number;
  purpose: string;
  spoken_line: string;
  on_screen_text: string;
  source_excerpt: string;
  estimated_duration_seconds: number;
};

export type LaunchScriptRecord = {
  hook: string;
  summary: string;
  title_options: string[];
  scenes: LaunchScriptScene[];
  cta: string;
  notes: string[];
};

export type ProjectDetail = ProjectSummary & {
  product_description: string;
  target_audience: string;
  error_message: string;
  launch_script: LaunchScriptRecord | null;
  asset: {
    filename: string;
    content_type: string;
    size_bytes: number;
    storage_path: string;
  } | null;
};

export type TranscriptResponse = {
  project_id: string;
  status: ProjectStatus;
  transcript: Array<{
    start: number;
    end: number;
    text: string;
  }>;
};

export type CreateProjectInput = {
  project_name: string;
  product_name: string;
  product_description: string;
  target_audience: string;
  video_goal: string;
};
