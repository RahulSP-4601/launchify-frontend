export type ProjectStatus = "draft" | "queued" | "uploading" | "transcribing" | "scripting" | "planning" | "rendering" | "ready" | "failed";

export type ProjectSummary = {
  id: string;
  project_name: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  has_transcript: boolean;
  has_guide: boolean;
  has_launch_script: boolean;
  has_edit_plan: boolean;
  has_quality_report: boolean;
  has_benchmark_report: boolean;
  has_voiceover: boolean;
  has_preview_video: boolean;
};

export type LaunchScriptScene = {
  scene_number: number;
  purpose: string;
  spoken_line: string;
  on_screen_text: string;
  source_excerpt: string;
  estimated_duration_seconds: number;
};

export type SessionTargetRecord = {
  selector: string;
  label: string;
  role: string;
  text: string;
  href: string;
};

export type SessionEventRecord = {
  type: "click" | "input" | "scroll" | "hover" | "navigation" | "keypress" | "focus" | "custom";
  timestamp: number;
  x: number | null;
  y: number | null;
  value: string;
  url: string;
  title: string;
  target: SessionTargetRecord;
  metadata: Record<string, string>;
};

export type RecordingSessionRecord = {
  source: string;
  started_at: string;
  ended_at: string;
  viewport_width: number;
  viewport_height: number;
  page_title: string;
  page_url: string;
  events: SessionEventRecord[];
};

export type GuideStepRecord = {
  step_index: number;
  title: string;
  instruction: string;
  narration: string;
  on_screen_text: string;
  start: number;
  end: number;
  event_type: string;
  focus_selector: string;
  focus_label: string;
  highlight_label: string;
  source_excerpt: string;
};

export type ArticleStepRecord = {
  step_index: number;
  title: string;
  body: string;
};

export type GuideRecord = {
  title: string;
  summary: string;
  source: string;
  steps: GuideStepRecord[];
  article_steps: ArticleStepRecord[];
  generation_notes: string[];
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
  emphasis_words: string[];
  variant: string;
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
  easing: string;
  x_offset: number;
  y_offset: number;
  smoothing: number;
  hold_ratio: number;
};

export type EditPlanHighlight = {
  start: number;
  end: number;
  label: string;
  style: string;
  anchor_region: string;
  confidence: number;
  focus_box: FocusBox | null;
  placement_preference: string;
  ui_label: string;
};

export type TemplateConfigRecord = {
  theme: "clean" | "spotlight" | "bold";
  caption_profile: "product" | "minimal" | "cinematic";
  motion_profile: "balanced" | "dynamic" | "calm";
};

export type SceneOverrideRecord = {
  scene_number: number;
  title: string;
  spoken_line: string;
  on_screen_text: string;
  caption_override: string;
  force_zoom: boolean | null;
  force_highlight: boolean | null;
  notes: string;
};

export type ManualOverrideRecord = {
  scenes: SceneOverrideRecord[];
  updated_at: string;
};

export type QualityIssueRecord = {
  code: string;
  severity: "low" | "medium" | "high";
  scene_number: number | null;
  message: string;
  suggestion: string;
};

export type QualityReportRecord = {
  score: number;
  summary: string;
  issues: QualityIssueRecord[];
  ready_for_export: boolean;
};

export type BenchmarkMetricRecord = {
  name: string;
  score: number;
  detail: string;
};

export type BenchmarkReportRecord = {
  overall_score: number;
  verdict: string;
  metrics: BenchmarkMetricRecord[];
};

export type VoiceoverCueRecord = {
  scene_number: number;
  start: number;
  end: number;
  text: string;
  duration_seconds: number;
};

export type VoiceoverClipRecord = {
  scene_number: number;
  start: number;
  end: number;
  text: string;
  duration_seconds: number;
  audio_storage_path: string;
};

export type VoiceoverRecord = {
  provider: string;
  model: string;
  mode: "original" | "voiceover" | "mixed";
  status: "disabled" | "script_only" | "ready";
  script: string;
  cues: VoiceoverCueRecord[];
  clips: VoiceoverClipRecord[];
  audio_storage_path: string;
  duration_seconds: number;
};

export type EditPlanScene = {
  scene_number: number;
  title: string;
  purpose: string;
  start: number;
  end: number;
  render_duration_seconds: number | null;
  confidence: number;
  camera_mode: "static" | "focus";
  decision_summary: string;
  visual_summary: string;
  spoken_line: string;
  on_screen_text: string;
  source_excerpt: string;
  action_timestamp: number | null;
  transition_style: "cut" | "fade" | "slide-up" | "focus-push";
  transition_duration_seconds: number;
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
  error_message: string;
  recording_session: RecordingSessionRecord | null;
  guide: GuideRecord | null;
  launch_script: LaunchScriptRecord | null;
  edit_plan: EditPlanRecord | null;
  template_config: TemplateConfigRecord | null;
  manual_overrides: ManualOverrideRecord | null;
  quality_report: QualityReportRecord | null;
  benchmark_report: BenchmarkReportRecord | null;
  voiceover: VoiceoverRecord | null;
  preview_video: RenderedVideoRecord | null;
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
};

export type CreateRecordingSessionInput = {
  recording_session: RecordingSessionRecord;
};

export type UpdatePhaseFourInput = {
  template_config: TemplateConfigRecord;
  manual_overrides: ManualOverrideRecord;
  voiceover_mode: VoiceoverRecord["mode"];
};

export type UpdateRecordingSessionInput = {
  recording_session: RecordingSessionRecord;
};

export type EditorAspectRatio = "16:9" | "9:16" | "1:1";
export type EditorEditMode = "overwrite" | "insert";

export type EditorSceneSource = "edit_plan" | "launch_script" | "transcript" | "fallback" | "inserted" | "imported";

export type ProjectEditorScene = {
  id: string;
  scene_number: number;
  title: string;
  spoken_line: string;
  on_screen_text: string;
  start: number;
  end: number;
  source: EditorSceneSource;
};

export type ProjectEditorCaption = {
  id: string;
  start: number;
  end: number;
  text: string;
  scene_id: string | null;
};

export type ProjectEditorComment = {
  id: string;
  scene_id: string | null;
  body: string;
  time: number;
  created_at: string;
};

export type ProjectEditorToolState = {
  active_shape: "rectangle" | "ellipse" | "polygon" | "star" | "line" | "arrow" | null;
  active_effect: "blur" | "callout" | "spotlight" | "zoom" | null;
  active_caption_preset: "basic" | "basic_karaoke" | "highlight_box" | "karaoke_highlight_box";
  media_tab: "project" | "saved" | "stock";
  pending_media_intent: "upload_file" | "import_project" | null;
};

export type ProjectEditorMediaAssetKind = "audio" | "video";
export type ProjectEditorMediaAssetSource = "project_source" | "project_voiceover" | "uploaded" | "imported";

export type ProjectEditorMediaAsset = {
  id: string;
  project_id: string;
  kind: ProjectEditorMediaAssetKind;
  source: ProjectEditorMediaAssetSource;
  title: string;
  storage_path: string;
  content_type: string;
  size_bytes: number;
  duration_seconds: number | null;
  source_project_id: string | null;
  created_at: string;
  updated_at: string;
};

export type EditorTrackKind = "video" | "audio" | "caption" | "overlay";

export type EditorClipKind =
  | "source_video"
  | "inserted_card"
  | "caption"
  | "voiceover"
  | "media_audio"
  | "media_video"
  | "text_overlay"
  | "shape_overlay"
  | "effect_overlay";

export type ProjectEditorClip = {
  id: string;
  track_id: string;
  kind: EditorClipKind;
  title: string;
  scene_id: string | null;
  timeline_start: number;
  timeline_end: number;
  source_start: number | null;
  source_end: number | null;
  asset_path?: string | null;
  content_type?: string | null;
  source_project_id?: string | null;
  style_preset?: string | null;
  effect_preset?: string | null;
  text: string;
  locked: boolean;
  muted: boolean;
  volume_percent?: number | null;
  fade_in_seconds?: number | null;
  fade_out_seconds?: number | null;
  loop?: boolean | null;
};

export type ProjectEditorTrack = {
  id: string;
  kind: EditorTrackKind;
  name: string;
  locked: boolean;
  muted: boolean;
  clips: ProjectEditorClip[];
};

export type ProjectEditorSequence = {
  id: string;
  version: number;
  duration_seconds: number;
  playhead_seconds: number;
  tracks: ProjectEditorTrack[];
};

export type ProjectEditorState = {
  aspect_ratio: EditorAspectRatio;
  edit_mode: EditorEditMode;
  selected_clip_id?: string | null;
  selected_scene_id: string;
  selected_track_id: string;
  show_captions: boolean;
  scenes: ProjectEditorScene[];
  captions: ProjectEditorCaption[];
  comments?: ProjectEditorComment[];
  tool_state?: ProjectEditorToolState | null;
  sequence?: ProjectEditorSequence | null;
};

export type ProjectEditorStateRecord = {
  project_id: string;
  editor_state: ProjectEditorState;
  updated_at: string;
  head_revision_id: number | null;
};

export type ProjectEditorRevisionSummary = {
  id: number;
  project_id: string;
  created_at: string;
  scene_count: number;
  sequence_version: number;
  parent_revision_id: number | null;
};

export type ProjectEditorRevisionRecord = {
  project_id: string;
  revision: ProjectEditorRevisionSummary;
  editor_state: ProjectEditorState;
  updated_at: string;
  head_revision_id: number | null;
};

export type ProjectEditorSaveInput = {
  editor_state: ProjectEditorState;
  base_revision_id: number | null;
};

export type RegenerateProjectEditorSceneInput = {
  scene_id: string;
  editor_state: ProjectEditorState;
  base_revision_id: number | null;
};

export type ProjectEditorMediaAssetListResponse = {
  assets: ProjectEditorMediaAsset[];
};

export type ProjectEditorMediaAssetImportInput = {
  source_project_id: string;
  asset_id?: string | null;
  variant: "source" | "voiceover" | "asset";
  duration_seconds: number | null;
};

export type UsageSummary = {
  limit_seconds: number;
  used_seconds: number;
  remaining_seconds: number;
  blocked: boolean;
};
