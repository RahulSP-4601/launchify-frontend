# Clueso Reference Migration Plan

Updated on July 18, 2026.

This document compares the current Launchify implementation with the `Clueso-Monorepo-master` reference repo and defines the exact architecture changes required to make Launchify behave like the reference system while staying on our stack:

- Frontend: React / Next.js
- Backend: Python / FastAPI
- Transcription: Deepgram
- LLM orchestration: OpenAI mini

## Goal

The goal is not to keep polishing the current "upload video -> generate preview -> generate final" pipeline.

The goal is to replace it with the same product shape as the reference:

1. capture one grounded recording session
2. use event log as truth
3. synthesize a structured walkthrough
4. edit the structured walkthrough
5. export from that structure

This is the architecture change that reduces time, storage, and render cost.

## What The Reference Actually Does

Based on the code in `../Clueso-Monorepo-master`:

- `apps/extension/src/content.js` records screen media once and captures DOM events in parallel
- `apps/backend/src/controllers/recording.controller.js` ingests one session payload containing video, metadata, and event log
- `apps/backend/src/services/ai.service.js` fuses Deepgram transcript + event log into a structured guide
- the generated guide, not the rendered video, becomes the core product object

Reference architecture pattern:

`capture -> ingest -> transcribe -> ground -> synthesize -> edit -> export`

This is the exact system behavior we want to reproduce in Launchify.

## What Launchify Does Today

Current Launchify pipeline in `launchify-backend/app/services/processing.py` and `launchify-backend/app/services/rendering.py`:

`upload raw video -> transcribe -> write launch script -> visual analysis/OCR heuristics -> generate edit plan -> render preview -> review preview -> render final`

That gives us three structural problems:

1. The upload is just pixels plus audio, so the planner must guess intent from transcript and vision.
2. We generate two rendered video artifacts for the same project, which increases latency, storage, and compute.
3. The structured object is downstream of rendering, while the reference makes the structured object the source of truth.

## Exact Gap Between Both Codebases

### 1. Capture Layer

Reference:

- browser extension is first-party
- captures click/input/keydown timing
- ships event log with the media

Launchify today:

- `RecordingSessionRecord` already exists in `launchify-backend/app/models/projects.py`
- but the main upload flow in `launchify-backend/app/api/routes.py` still accepts only the video file
- session data is optional and separate, not the ingestion source of truth

Required change:

- recording session must be created at capture time and uploaded together with the media
- event log can no longer be an optional post-upload add-on

### 2. Source Of Truth

Reference:

- event log is canonical
- transcript provides narration context
- AI prompt uses "events are truth, transcript is context"

Launchify today:

- transcript and scene heuristics drive most decisions
- visual analysis is used to infer focus regions after the fact

Required change:

- change planner contract so event timestamps and target metadata define step boundaries, zoom anchors, and highlight anchors

### 3. Core Product Object

Reference:

- structured guide JSON is the main artifact
- frontend operates on timestamped steps

Launchify today:

- central object is an edit plan built for rendering
- preview and final videos are treated as core outputs

Required change:

- central project artifact must become a grounded session graph and guide graph
- render plans should be derived from that graph only when needed

### 4. Rendering Strategy

Reference:

- capture once
- structure first
- render only after step synthesis

Launchify today:

- preview render and final render are both first-class outputs
- review loop depends on the preview artifact

Required change:

- replace two-video pipeline with one primary export path
- preview should be metadata-first and player-based, not a full stored MP4 by default

### 5. Storage Model

Reference:

- one source recording
- one event log
- one transcript
- one guide JSON
- optional derived assets

Launchify today:

- source upload
- transcript
- edit plan
- preview video
- final video
- optional voiceover audio

Required change:

- store only:
  - source recording
  - session event log
  - transcript
  - grounded guide
  - optional voiceover audio
  - final export only when the user requests it

## Target Launchify Architecture

We should restructure Launchify into the following layers.

### 1. Capture Layer

New component:

- `launchify-extension/`

Responsibilities:

- start display recording
- optionally capture mic audio
- capture DOM events:
  - click
  - input
  - enter/submit
  - focus
  - scroll
  - navigation
- normalize targets into semantic metadata:
  - selector
  - label
  - role
  - text
  - href
  - bounding box when safe

Important rule:

- do not rely on OCR to discover user intent when DOM metadata already exists

### 2. Ingestion Layer

New backend contract:

- create a single session upload endpoint that accepts:
  - project metadata
  - source video
  - optional mic audio if separated
  - session metadata
  - event log JSON

Recommended endpoint shape:

- `POST /projects/{project_id}/sessions`

This endpoint should replace the current split between:

- `POST /projects/{project_id}/upload`
- `PUT /projects/{project_id}/session`

### 3. Grounding Layer

New backend services:

- `session_ingestion.py`
- `event_grounding.py`
- `guide_synthesizer.py`

Responsibilities:

- validate and normalize event log
- align Deepgram transcript segments to event windows
- cluster events into user-visible steps
- produce a grounded scene graph

Grounding rule:

- event log wins over transcript whenever they conflict

### 4. AI Synthesis Layer

Replace transcript-led planning prompt with an OpenAI mini structured output prompt.

Input:

- transcript segments
- normalized event log
- viewport metadata
- project brief

Output:

- guide title
- summary
- ordered steps
- step timestamps
- narration lines
- highlight labels
- zoom anchors
- article step text

Important prompt rule:

- "The event log is truth. The transcript is supporting context. Never invent actions that are not present in the events."

### 5. Structured Editor Layer

Frontend should shift from "render status dashboard" to "session guide editor".

Primary UI units:

- session player
- synchronized step list
- narration editor
- scene timing editor
- highlight editor
- zoom editor
- article step editor

This should become the main workspace instead of preview/final output cards.

### 6. Export Layer

We need two modes, but not two stored videos by default.

Mode A: Fast export

- derive cuts and overlays directly from guide JSON
- use original recording as base
- preserve original audio unless voiceover is requested
- generate only one user-facing export

Mode B: Premium export

- optional polished render with:
  - spotlight
  - captions
  - zoom easing
  - branded intro/outro
  - AI voiceover

Critical rule:

- premium export should not be required before the user can review the structured guide

## Exact Changes Needed In The Current Backend

### Keep

These parts are still useful:

- `app/services/transcription.py`
- `app/services/storage.py`
- `app/services/job_store.py`
- `app/services/job_runner.py`
- `app/services/voiceover.py`
- FastAPI project and auth foundations

### Downgrade From Core To Optional

These should stop being the default reasoning path:

- `app/services/visual_analysis.py`
- `app/services/video_frames.py`
- `app/services/frame_signal_analyzer.py`
- `app/services/vision_analyzer.py`
- `app/services/scene_alignment.py`

Reason:

- they are compensating for the absence of captured UI events

### Replace

These should be redesigned around grounded sessions:

- `app/services/script_writer.py`
- `app/services/edit_planner.py`
- `app/services/processing.py`
- `app/services/render_review.py`

Replacement direction:

- `processing.py` becomes session orchestration, not render orchestration
- `script_writer.py` becomes guide narration synthesis from grounded steps
- `edit_planner.py` becomes export-plan builder from guide graph
- `render_review.py` becomes a lightweight quality checker on JSON, not a preview-video review dependency

### Defer Or Remove As Default Flow

These should not block the normal product path:

- preview video persistence
- preview-to-final refinement loop
- visual-analysis-first fallback logic

## Exact Changes Needed In The Current Data Model

Current `ProjectRecord` shape is too render-centric.

Add or promote these first-class records:

- `GroundedSessionRecord`
- `GroundedStepRecord`
- `GuideRecord`
- `ArticlePlanRecord`
- `ExportJobRecord`

Recommended structure:

```ts
Project
  sourceAsset
  groundedSession
    metadata
    transcriptSegments[]
    events[]
    stepClusters[]
  guide
    title
    summary
    steps[]
    articleSteps[]
  exportSettings
  finalExport?
```

The existing `EditPlanRecord` can stay temporarily, but it should become a render derivative of `GuideRecord`, not the project source of truth.

## Exact Changes Needed In The Frontend

### Current Frontend Direction

The current frontend types in `launchify-frontend/src/lib/types.ts` already contain useful session primitives:

- `RecordingSessionRecord`
- `SessionEventRecord`

But the UI is still centered around:

- transcript presence
- edit plan
- preview video
- final video

### Target Frontend Direction

The main project screen should be reworked to show:

1. source recording player
2. generated steps on the side
3. click a step -> seek video
4. play video -> auto-highlight active step
5. edit narration and labels inline
6. export only after guide review

### Required New Frontend Contracts

- `GuideRecord`
- `GuideStepRecord`
- `ArticleStepRecord`
- `ExportStatusRecord`

## New End-To-End Pipeline

The target Launchify pipeline should be:

1. User starts capture in extension
2. Extension records screen + mic + DOM event log
3. Extension uploads one session payload
4. FastAPI stores source assets and session JSON
5. Deepgram returns transcript segments
6. OpenAI mini grounds transcript against event log
7. Backend saves a guide graph
8. Frontend opens structured editor immediately
9. User edits steps, narration, and emphasis
10. Backend creates one final export when requested

## Why This Saves Time, Cost, And Storage

### Time

- no need to render preview before the user can review content
- fewer expensive retry loops
- less dependence on slow visual inference

### Cost

- fewer render-worker invocations
- fewer repeated FFmpeg jobs
- less LLM rework caused by poor OCR/scene guesses

### Storage

- no default preview MP4 per project
- one master recording instead of two derived full videos
- JSON-first project representation is much smaller than duplicate media artifacts

## Implementation Phases

### Phase 1: Grounded Session Foundation

- add session upload endpoint
- make event log mandatory in the new capture path
- persist normalized session graph
- keep current render pipeline untouched as fallback

### Phase 2: OpenAI Mini Grounded Guide

- add guide synthesis service using transcript + events
- generate steps from event clusters
- expose guide API to frontend

### Phase 3: Frontend Editor Reframe

- build player + step sync workspace
- shift project detail screen from render-first to guide-first
- allow inline narration and timing edits

### Phase 4: Single Export Architecture

- create export-plan builder from guide graph
- make preview MP4 optional or remove it from the default flow
- render only final export on demand

### Phase 5: Premium Render Add-Ons

- keep spotlight/caption/voiceover styling
- drive them from grounded guide metadata
- preserve current render worker only for premium export mode

## Recommended Build Order For This Repo

1. Add a new extension app instead of trying to simulate capture from the existing upload form.
2. Build the new session ingestion API in FastAPI before touching the current render worker.
3. Add guide synthesis records and endpoints.
4. Rework frontend project detail around guide editing.
5. After the guide-first flow works, strip preview render from the default path.
6. Keep premium render as an optional final stage, not the core user loop.

## Migration Rule

Until the grounded session pipeline is stable, we should support two modes:

- legacy upload mode
- grounded capture mode

But the product target should be clear:

- legacy upload mode is a fallback
- grounded capture mode is the main architecture

## Bottom Line

To match the reference product with our stack, we should not keep iterating on the current preview/final render architecture.

We should rebuild Launchify around:

- extension capture
- event-grounded session graphs
- Deepgram transcript
- OpenAI mini structured guide synthesis
- guide-first editing
- single final export

That is the closest equivalent to the reference architecture, and it is the path that cuts render time, compute cost, and storage usage at the same time.
