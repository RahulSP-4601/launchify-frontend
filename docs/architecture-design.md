# Architecture Design

## Purpose

This document explains how Launchify should work technically as a product and how the system should scale when traffic, users, projects, and rendering jobs increase.

The goal is not to over-engineer version one.
The goal is to build a clean architecture that supports:

- fast MVP execution
- reliable video generation
- structured editing
- AI orchestration
- multi-tenant growth
- large-scale job processing

## Core Product Architecture

Launchify should be built around one central idea:

**the product is a structured content engine, not just a video editor.**

A user does not simply upload a video and export a changed file.
Instead, the system creates a structured project containing:

- source assets
- transcript
- script
- voiceover settings
- sync points
- scenes
- captions
- zooms
- overlays
- brand kit data
- export settings
- share metadata

The rendered video is only one output of that structured project.

## High-Level System

The platform should be split into these main layers:

1. Frontend application
2. Backend API
3. Storage layer
4. Database and auth layer
5. AI orchestration layer
6. Media processing layer
7. Rendering worker layer
8. Publishing and analytics layer

## Frontend Layer

### Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query

### What the frontend does

The frontend should handle:

- authentication flows
- dashboard and project listing
- upload UI
- recording entry points
- transcript and script editing
- simple scene editing
- branding controls
- preview interactions
- export status tracking
- published share pages

### State design

Use:

- `TanStack Query` for server state
- `Zustand` for editor-local interactive state

This separation matters because:

- project data, auth data, and job status come from APIs
- playback state, selection state, open panel state, and temporary editor changes are local editor concerns

### Frontend under load

When there is a lot of traffic, the frontend should remain stable because:

- rendering does not happen in the browser
- AI generation does not happen in the browser
- uploads go directly to storage where possible
- polling or realtime status updates are lightweight
- public share pages can be cached aggressively

## Backend API Layer

### Recommended stack

- Python
- FastAPI

### Why FastAPI

Launchify is heavy on:

- AI orchestration
- async job creation
- media pipelines
- webhooks
- background work coordination

FastAPI is a strong fit because it is fast to build, works well with Python AI tooling, and is good for stateless horizontally scaled APIs.

### Backend responsibilities

The backend should handle:

- authentication validation
- workspace and project authorization
- project CRUD
- upload session creation
- job creation
- AI workflow orchestration
- export requests
- share page metadata
- billing and usage tracking
- analytics ingestion

### Backend under high traffic

The API should remain stateless.

That means:

- no in-memory project state required for correctness
- no dependence on one server instance
- all important state stored in Postgres or storage
- workers consume jobs independently

This allows:

- horizontal scaling on Railway or future infrastructure
- multiple API instances behind a load balancer
- stable handling of spikes in signups, uploads, and export requests

## Auth and Database Layer

### Recommended stack

- Supabase Auth
- Supabase PostgreSQL
- Row Level Security

### Core design principle

Every important row should be scoped by tenant identity.

At minimum, most product tables should carry:

- `user_id` in the earliest MVP
- later `workspace_id` for multi-user collaboration

### Likely core tables

- users
- projects
- project_versions
- assets
- transcripts
- script_segments
- voice_tracks
- captions
- scenes
- sync_points
- brand_kits
- jobs
- job_events
- exports
- published_pages
- usage_ledgers
- subscriptions

### Why project versions matter

Launchify should use versioned semantic project data.

That means:

- uploaded media remains immutable
- edits update structured metadata
- comments later attach to versions
- exports always point to a known project version

### Database under scale

The database must be used carefully:

- store metadata in Postgres
- do not store large media binaries in Postgres
- keep heavy files in R2
- index by `user_id`, `workspace_id`, `project_id`, and `job_status`
- use database-backed jobs early
- archive or prune abandoned temp artifacts

For `100K+ users`, Postgres is still viable if media stays out of the database and heavy compute is offloaded to workers.

## Storage Layer

### Recommended stack

- Cloudflare R2

### What R2 stores

- raw uploads
- audio extracts
- thumbnails
- waveform files
- preview assets
- rendered exports
- captions
- screenshots
- published media assets

### Storage strategy

Use object storage paths that are predictable and tenant-safe, such as:

- `users/{userId}/projects/{projectId}/raw/...`
- `users/{userId}/projects/{projectId}/derived/...`
- `users/{userId}/projects/{projectId}/exports/...`

### Why this scales

R2 is good here because:

- video files are large
- storage needs grow faster than database size
- object storage is better for media delivery
- no egress fee is useful for early economics

## Job System

### Why jobs are essential

Launchify is not a request-response-only product.

Many operations are long-running:

- upload ingestion
- transcription
- script generation
- voiceover generation
- caption generation
- zoom detection
- rendering
- publishing

These should never block a normal API request.

### Early design

Use a database-backed job system first.

Core tables:

- `jobs`
- `job_attempts`
- `job_events`

Core states:

- queued
- running
- completed
- failed
- canceled

### Common job types

- ingest_asset
- transcribe_audio
- generate_script
- generate_voiceover
- generate_captions
- detect_zooms
- render_export
- publish_page

### Why this works at scale

This design gives:

- retries
- auditability
- progress updates
- idempotency
- failure recovery
- multi-worker concurrency

Later, execution can move to a more advanced queue system if needed, while Postgres can remain the source of truth.

## AI Orchestration Layer

### Providers

The product should use provider abstraction from day one.

Abstract these services:

- speech-to-text
- LLM script rewriting
- TTS voice generation
- translation
- OCR and visual analysis

### Why abstraction matters

It allows us to:

- swap vendors later
- control cost
- test quality differences
- avoid lock-in

### Example internal interfaces

- `transcribe_audio(asset_id)`
- `rewrite_script(project_version_id, tone, duration)`
- `generate_voice_segment(segment_id, voice_id, pace)`
- `translate_project(project_version_id, language)`

### AI under heavy usage

At scale, AI calls become one of the biggest operational risks.

To control this:

- cache repeatable outputs where possible
- regenerate only changed scenes
- generate voice per scene instead of whole project when possible
- track AI cost per project
- add quotas and usage limits
- implement retries with backoff

## Media Processing Layer

### Tools

- FFmpeg

### What FFmpeg should do

- audio extraction
- video normalization
- frame rate normalization
- thumbnails
- preview proxy generation
- waveform generation
- scene trims
- compression
- muxing audio and video when needed

### Why this is separate from frontend/API

These tasks are CPU-heavy and should run in workers, not inside web requests.

## Rendering Layer

### Tools

- Remotion
- FFmpeg
- Docker-based rendering workers

### How rendering should work

1. User clicks export
2. Backend creates render job
3. Worker loads project version
4. Worker resolves source assets and settings
5. Remotion composes frames from structured scene data
6. Audio tracks are aligned and mixed
7. FFmpeg encodes final MP4 or GIF
8. Export is uploaded to R2
9. Job status is updated
10. User sees completed export in dashboard

### Why Remotion is useful

Remotion lets us treat video output as a deterministic composition system rather than manual browser-only editing.

This is important because Launchify is really rendering:

- captions
- zoom animations
- branded frames
- intros
- outros
- CTA overlays
- scene layouts

### Rendering under large traffic

Rendering is the hardest scale problem in the system.

To manage it:

- isolate rendering in worker containers
- enforce project duration limits
- queue exports fairly
- track render progress
- allow cancellation
- implement retries
- clean up temp files
- measure render cost per minute

At `100K+ users`, not all users will render simultaneously, but export spikes can still be large. The queue and worker design matters more than raw user count.

## How Major Features Work Technically

### 1. Screen recording

For extension recording:

- Chrome extension captures tab video and microphone audio
- content script records click and cursor metadata
- chunks upload progressively
- backend stores raw chunks or merged recording in R2
- ingestion job normalizes media and creates first project version

For upload flow:

- user uploads MP4/WebM/MOV
- backend validates file
- upload stored in R2
- ingestion job creates normalized assets

### 2. Transcription

- worker extracts audio with FFmpeg
- audio is sent to STT provider
- response returns transcript and timestamps
- transcript stored as structured segments, not one plain string
- frontend loads transcript editor

### 3. AI script rewriting

- worker sends transcript plus product context to LLM
- LLM returns improved structured script
- script stored by scene or segment
- user can manually edit before voice generation

### 4. AI voiceover

- voice generated scene by scene
- each scene stores voice ID, text, pace, and provider metadata
- audio files stored in R2
- regeneration only affects changed scenes

This is more scalable and cheaper than regenerating the entire project every time.

### 5. Captions

- captions derive from transcript timestamps or generated voice timing
- stored as structured caption segments
- frontend allows style changes
- renderer burns them into video or exports as sidecar files later

### 6. Automatic zooms

- extension captures click coordinates and element bounds
- worker identifies meaningful interaction points
- structured zoom events are created
- renderer animates scale and position around those coordinates

### 7. Branding

- user saves one or more brand kits
- brand kit includes logo, colors, fonts, CTA text, and product metadata
- project version references a brand kit
- intro, outro, caption styles, and background derive from it

### 8. Simple scene editor

The first editor should be scene-based, not a full advanced timeline.

Each scene should reference:

- source asset
- source start/end
- scene order
- script segment
- voice track
- zoom settings
- caption settings
- branding state

### 9. Export

- export request generates a render job
- job loads project version and export settings
- renderer produces output
- export metadata saved in database
- user sees final downloadable and shareable result

### 10. Share page

- published page reads export metadata
- serves player with cached video asset
- includes title, description, logo, CTA, and website link
- analytics events track impressions and playback milestones

## Public Site and Traffic Handling

Launchify has two different traffic patterns:

1. authenticated product traffic
2. public share-page traffic

These should be treated differently.

### Authenticated product traffic

This includes:

- dashboard
- editor
- uploads
- job status
- export flows

This traffic is interactive and stateful from the user’s perspective, but the servers should remain stateless.

### Public share-page traffic

This includes:

- video landing pages
- embedded video pages
- public previews

This traffic should be optimized for caching and read-heavy delivery.

The system should:

- cache share-page HTML where possible
- serve video assets through CDN
- separate public reads from heavy authenticated workflows

## Scaling Strategy for High Traffic

### Phase 1: MVP scale

Keep architecture simple:

- one Next.js frontend
- one FastAPI backend
- one Postgres database
- one R2 bucket strategy
- one media worker group
- one render worker group

This is enough for early traction.

### Phase 2: Growth scale

As usage grows:

- horizontally scale API instances
- increase worker concurrency
- separate ingestion workers from rendering workers
- optimize database indexes
- introduce rate limits and quotas
- add stronger observability around queue times and render failures

### Phase 3: Large scale

For very large traffic:

- isolate share-page delivery from app traffic
- separate compute pools by workload type
- shard or partition heavy job tables if necessary
- use stronger queue infrastructure if Postgres polling becomes a bottleneck
- add per-tenant fairness controls for heavy render customers

## Reliability Requirements

To support heavy usage, Launchify must be reliable in these areas:

- uploads do not fail silently
- jobs are retryable
- export failures are visible
- partial progress is preserved
- regenerated scenes do not corrupt the whole project
- rendering is idempotent
- cleanup of temp files is automatic
- long-running AI failures are observable

## Security and Tenant Isolation

Security must be built in from the beginning.

Core rules:

- every query is tenant-scoped
- service-role keys stay only on backend and workers
- public share pages expose only explicitly published outputs
- raw uploads remain private
- signed URLs are used where appropriate
- RLS protects user-owned records

## Observability

Recommended tools:

- PostHog
- Sentry
- internal event logs

Track:

- signup to project creation
- upload success and failure
- transcription success and failure
- script generation latency
- voice generation latency
- render queue time
- render failure rate
- export completion rate
- publish rate
- repeat project creation

## Cost Control at Scale

The largest scaling risks are not normal page views.
They are:

- AI cost
- rendering cost
- storage growth
- abandoned projects

To manage this:

- limit free export minutes
- limit recording duration in early plans
- clean old unused raw assets
- store lower-resolution editing proxies
- measure cost per exported minute
- regenerate only changed scenes
- meter high-cost premium features separately later

## Final Design Principle

Launchify should scale by keeping the product model clean:

- structured project data in the database
- large media in object storage
- heavy compute in workers
- stateless APIs
- deterministic rendering
- tenant-safe access control

If we preserve these principles, the system can start simple, ship quickly, and still grow into a high-traffic AI video and documentation platform without a destructive rewrite.
