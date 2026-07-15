# Launchify MVP

## One-Month Build Goal

The one-month goal for Launchify is to ship a focused MVP that proves one core promise:

**Turn a rough SaaS screen recording into a polished product-launch video in minutes.**

This MVP is not the full Clueso-style platform. It is the smallest useful workflow that helps founders and product teams create professional launch videos, feature-announcement videos, and product walkthroughs from one rough recording.

## MVP Positioning

**One-line message**

Turn rough screen recordings into professional product videos with AI.

**Supporting message**

Record your product walkthrough. AI improves the script, adds a professional voice, captions, zooms, branding, and exports a launch-ready video.

## Initial Customer

The first version is a global B2B product for:

- SaaS founders
- indie hackers
- product marketers
- product managers
- customer-success teams
- small software agencies
- early-stage startups preparing for launch

Initial focus:

- English-speaking users
- software companies with 1-50 employees
- browser-based products
- teams launching on Product Hunt, LinkedIn, and X

## MVP Use Cases

The first version should serve three tightly related use cases:

- product-launch videos
- feature-announcement videos
- product walkthrough videos

These are close enough technically to share one workflow while being valuable enough to test willingness to pay.

## Core MVP Workflow

1. User creates an account
2. User creates a video project
3. User records a screen or uploads an existing recording
4. User enters product name, description, and target audience
5. Launchify transcribes the original narration
6. Launchify generates an improved AI script
7. User edits the script
8. Launchify generates a professional AI voiceover
9. Launchify creates captions
10. Launchify adds automatic zooms around important clicks
11. Launchify applies logo, colors, and branded background
12. User makes basic scene edits
13. User previews the final result
14. User exports a 1080p MP4
15. User gets a shareable video page

## MVP Features

### Accounts

- Google sign-up
- email sign-in
- single-user account model
- project list
- export allowance visibility
- delete account
- delete recordings

### Dashboard

Each project should show:

- project name
- thumbnail
- creation date
- duration
- last edited date
- processing status
- export status

Required statuses:

- Draft
- Uploading
- Transcribing
- Generating Script
- Generating Voice
- Processing Video
- Ready to Edit
- Rendering
- Completed
- Failed

### Input

Two input methods:

- Chrome extension recording
- video upload

Upload support:

- MP4
- WebM
- MOV

MVP limits:

- maximum 5 minutes
- maximum 1080p
- desktop browser recordings only
- one recording per project

### Transcription

- audio extraction
- English transcription
- sentence-level or word-level timestamps
- transcript display
- manual transcript correction

### AI Script Generation

Two modes:

- improve existing transcript
- generate a fresh script from product context

Initial tone options:

- Professional
- Friendly
- Energetic
- Simple
- Product launch

The script must always remain editable before voice generation.

### AI Voiceover

- 5-10 English voices
- voice preview
- speaking speed control
- regenerate after script changes
- restore original mic audio

Not in MVP:

- voice cloning

### Captions

- auto-generated captions
- based on script and timing
- 2-3 caption styles
- editable font, size, position, text color, and background

### Automatic Zooms

- detect important clicks from extension recordings
- add zoom before and during key clicks
- allow zoom removal per scene
- zoom intensity options:
  - No zoom
  - Subtle zoom
  - Strong zoom

### Branding

One brand kit per user:

- logo
- primary color
- secondary color
- product name
- website URL

Generated branded assets:

- background
- browser frame
- intro title
- outro CTA
- logo placement
- caption color styling

### Basic Editor

The first editor should be scene-based, not a full advanced timeline editor.

Users should be able to:

- play and pause preview
- seek through video
- edit script
- delete scene
- reorder scenes
- trim scene start or end
- change AI voice
- disable zoom
- edit captions
- change logo and colors
- update CTA
- regenerate one scene voiceover

### Export and Share

Required:

- 1080p MP4 export
- 16:9 landscape output
- watermarked free export
- watermark-free paid export
- shareable hosted video page

Beta option:

- simple 9:16 social version inside a vertical branded frame

### Payments

- international cards
- USD pricing
- monthly subscription
- one-time launch-video purchase
- payment confirmation
- subscription cancellation
- usage limits

## Launch Kit Angle

The MVP should be positioned as more than a single video generator.

One recording should eventually produce a lightweight launch kit:

- 60-90 second launch video
- 15-30 second vertical teaser
- LinkedIn launch copy
- X launch copy
- thumbnail
- product tagline
- shareable video page

This creates a stronger product message:

**Record your product once. Launch it everywhere.**

## Features Excluded From the MVP

The following must not be included in the first month build:

- AI avatars
- voice cloning
- autonomous browser agents
- PowerPoint-to-video
- PDF-to-video
- full article generation
- SOP generation
- translation
- multiple languages
- team collaboration
- multiple workspaces
- SSO
- advanced permissions
- complex keyframes
- AI motion graphics
- AI image generation
- advanced timeline editing
- custom templates
- 4K export
- analytics
- GitHub integration
- MCP integration
- mobile app
- desktop app

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query

### Backend

- Python
- FastAPI

### Auth and Database

- Supabase Authentication
- Supabase PostgreSQL
- Row Level Security
- database-backed job tracking

### Storage

- Cloudflare R2

### Video and Rendering

- FFmpeg
- Remotion
- Docker-based rendering worker

### AI Services

- speech-to-text provider
- LLM for script rewriting
- ElevenLabs or another TTS provider
- provider abstraction layer

### Hosting and Delivery

- Railway
- Cloudflare

### Monitoring and Analytics

- PostHog
- Sentry
- internal event tracking

### Payments

- Dodo Payments

## One-Month Build Priorities

The first month should focus on shipping the smallest complete workflow, not the largest feature set.

Priority order:

1. accounts, projects, uploads, and status tracking
2. transcription and transcript editing
3. AI script improvement and manual editing
4. AI voiceover generation
5. captions and automatic zooms
6. branding, intro, outro, and CTA
7. simple scene editor
8. 1080p rendering and shareable export page

## Success Criteria

The MVP is successful when a founder can:

1. create an account
2. upload or record a product walkthrough
3. receive a transcript
4. generate and edit a better script
5. select an AI voice
6. receive captions and zooms
7. add logo and brand colors
8. make basic edits
9. export a professional 1080p video
10. publish or share the result

## Final Operating Principle

The first month is not about building the complete Launchify platform.

It is about proving one thing:

**SaaS founders and product teams will pay to turn rough product recordings into professional launch and feature-update videos.**
