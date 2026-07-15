# Launchify

Launchify is an AI-native product video and documentation platform built to turn rough product knowledge into polished, reusable content.

The product vision is simple:
record or upload content once, then use AI to transform it into professional walkthrough videos, launch videos, onboarding flows, training content, help articles, SOPs, and translated versions from a single structured workflow.

## Vision

Launchify exists to become the operating system for product education.

Modern teams should not need separate tools for recording, scripting, voiceovers, editing, documentation, translation, publishing, and analytics. Launchify brings all of that into one platform built around a semantic project model instead of disconnected media files.

## Mission

Our mission is to help companies create clear, high-quality product education at scale without requiring a studio workflow, multiple specialists, or a stack of disconnected tools.

Launchify should make it possible for a team to:

- record or upload rough source material
- generate a transcript, script, voiceover, and step-by-step documentation
- edit timing, visuals, captions, and overlays in one place
- publish videos and docs faster
- localize content for multiple languages
- keep content easier to update as the product evolves

## Product Thesis

Launchify is not just a screen recorder or a video editor.

It is a structured content engine built around a semantic project that connects:

- recording
- transcript and script editing
- AI voice generation
- sync points between narration and visuals
- timeline and overlay editing
- documentation generation
- translation and localization
- publishing and analytics

The core belief is that the strongest product is not any single AI model. The real value comes from integrating the full workflow into one consistent system.

## Core Workflow

Launchify follows this end-to-end flow:

1. Record a screen or upload video, slides, PDF, images, or other source assets.
2. Normalize the source into reusable project assets.
3. Generate transcript, script, scenes, screenshots, and documentation drafts.
4. Edit the structured project instead of destructively editing raw media.
5. Generate voiceovers, captions, zooms, highlights, and branded visuals.
6. Export, publish, translate, review, and analyze the final outputs.

## What Launchify Will Create

Launchify is being designed to produce:

- product walkthrough videos
- launch and feature announcement videos
- customer onboarding videos
- employee training videos
- help center articles
- SOPs and step-by-step guides
- translated video and documentation variants

## Core Capabilities

The final product direction includes:

- screen recording and source uploads
- transcript editing and AI script rewriting
- AI voiceovers with provider abstraction
- script-to-video synchronization through structured sync points
- non-destructive timeline editing
- automatic zooms, click highlights, callouts, spotlights, and blur tools
- captions, subtitles, and translation workflows
- documentation and screenshot generation
- version history, comments, collaboration, and publishing
- analytics, usage tracking, and multi-workspace support

## Product Principles

- Rough input should be enough. Users should not need a perfect first recording.
- Editing should be non-destructive. Source media remains immutable.
- Scripts, docs, timing, and visuals should stay linked through structured data.
- Re-exports and updates should be fast because the system understands the project semantically.
- The platform should scale from solo creators to teams with workspaces, roles, governance, and usage controls.

## Frontend Tech Stack

This frontend is built with:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query

## Platform Stack

Launchify is being architected with:

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Zustand, TanStack Query
- Backend: Python with FastAPI
- Auth and Database: Supabase Auth, Supabase PostgreSQL, Row Level Security
- Storage: Cloudflare R2 or Supabase S3
- Rendering and Video Processing: FFmpeg, Remotion, Docker-based rendering workers
- Hosting: Railway or Vercel
- Delivery and DNS: Cloudflare
- AI Services: speech-to-text provider, LLM-based script rewriting, TTS provider abstraction
- Monitoring and Analytics: PostHog, Sentry
- Payments: Dodo Payments

## Strategic Direction

Launchify is being built as a complete AI-powered content production platform for software companies.

The long-term ambition is to unify:

- product recording
- structured editing
- narration and synchronization
- docs generation
- localization
- review and collaboration
- publishing and measurement

into one product that helps teams create and maintain product education faster and at higher quality.
