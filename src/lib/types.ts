export type ProjectStatus = "draft" | "queued" | "uploading" | "transcribing" | "scripting" | "planning" | "rendering" | "ready" | "failed";

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
  has_edit_plan: boolean;
  has_preview_video: boolean;
  has_final_video: boolean;
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

export type EditPlanCaption = {
  start: number;
  end: number;
  text: string;
};

export type FocusBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EditPlanZoom = {
  start: number;
  end: number;
  scale: number;
  focus_region: string;
  reason: string;
  confidence: number;
  focus_box: FocusBox | null;
};

export type EditPlanHighlight = {
  start: number;
  end: number;
  label: string;
  style: string;
  anchor_region: string;
  confidence: number;
  focus_box: FocusBox | null;
};

export type EditPlanScene = {
  scene_number: number;
  title: string;
  purpose: string;
  start: number;
  end: number;
  confidence: number;
  camera_mode: "static" | "focus";
  decision_summary: string;
  visual_summary: string;
  spoken_line: string;
  on_screen_text: string;
  source_excerpt: string;
  captions: EditPlanCaption[];
  zooms: EditPlanZoom[];
  highlights: EditPlanHighlight[];
};

export type EditPlanRecord = {
  overview: string;
  total_duration_seconds: number;
  scenes: EditPlanScene[];
  render_spec: {
    title_card: string;
    title_options: string[];
    cta: string;
    total_duration_seconds: number;
  };
};

export type RenderedVideoRecord = {
  filename: string;
  content_type: string;
  size_bytes: number;
  storage_path: string;
  duration_seconds: number;
  variant: "preview" | "final";
};

export type ProjectDetail = ProjectSummary & {
  product_description: string;
  target_audience: string;
  error_message: string;
  launch_script: LaunchScriptRecord | null;
  edit_plan: EditPlanRecord | null;
  preview_video: RenderedVideoRecord | null;
  final_video: RenderedVideoRecord | null;
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
