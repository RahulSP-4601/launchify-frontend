# Clueso Parity Checklist

This document defines the practical parity target for Launchify against Clueso-style product-video output.

It is intentionally based on publicly observable behavior and public product messaging, not on any assumed proprietary internal algorithm.

Reference sources used on July 16, 2026:

- Clueso homepage: https://www.clueso.io/
- Clueso company overview: https://en.wikipedia.org/wiki/Clueso_%28Company%29

Publicly stated Clueso behaviors relevant to Launchify parity:

- AI rewrites scripts more clearly and concisely
- AI voiceovers sound professional
- automatic zooms focus key actions
- captions are visually polished
- branded intros, outros, and templates are supported
- documentation and SOP generation are part of the broader workflow

## What "Parity" Means

For Launchify, parity does **not** mean we copied Clueso internals.

It means that for the same rough screen recording, Launchify should produce an output that is competitive on:

1. clarity
2. pacing
3. zoom accuracy
4. caption quality
5. highlight usefulness
6. brand polish
7. export readiness
8. end-to-end speed

## Parity Gate

Launchify can be considered Clueso-parity-ready only if all of the following are true on a benchmark set of at least 10 representative product walkthrough recordings:

1. At least 8 of 10 outputs are judged "production-ready" without mandatory manual fixes.
2. Average generation time stays within the target operating window for the selected mode.
3. No benchmark video fails due to FFmpeg, OCR, or render-worker hangs.
4. Zooms and highlights are judged helpful, not distracting, in at least 90% of scenes.
5. Captions remain readable and well-timed in at least 95% of scenes.
6. Side-by-side reviewer preference is at least tied with Clueso on average, or wins in a clearly defined subset such as launch videos.

## Scoring Rubric

Each category is scored from 1 to 5 for every benchmark video.

Target average score:

- `4.2+` overall average
- no category below `3.8`

### 1. Script Polish

Target:

- removes filler language
- preserves factual meaning
- sharpens the value proposition
- sounds concise and launch-ready

Pass checks:

- no obvious filler phrases remain
- scenes flow logically
- script is shorter and clearer than raw transcript
- no invented product claims

Current Launchify signals:

- transcript rewrite
- scene-based launch script generation

Gap examples:

- weak hook
- repetitive wording
- generic CTA

### 2. Voiceover Professionalism

Target:

- stable pace
- natural pronunciation
- no jarring pauses
- voice fits a product-demo tone

Pass checks:

- scene transitions do not sound abrupt
- pronunciation errors are rare
- no major mismatch between voice timing and scene pacing

Gap examples:

- robotic cadence
- poor proper-noun pronunciation
- timing drift

### 3. Scene Segmentation And Pacing

Target:

- scenes feel intentional
- each scene covers one clear user action or idea
- total runtime feels tight, not rushed

Pass checks:

- no scene feels bloated
- no important step is skipped
- transitions happen near real action boundaries

Gap examples:

- overlong scenes
- too many scenes for a short recording
- awkward scene boundaries

### 4. Smart Auto-Zooms

Target:

- zoom lands on the right product action
- zoom timing matches click or focus moment
- zoom intensity feels premium, not aggressive

Pass checks:

- zoom appears only when useful
- zoom box is centered on meaningful UI
- no distracting oscillation or unnecessary motion

Gap examples:

- zooming on the wrong region
- zooming too often
- zoom scale too strong

### 5. Highlights, Spotlights, And Callouts

Target:

- highlights guide attention
- labels are relevant and short
- overlays avoid covering important UI

Pass checks:

- highlight appears on the right control or action
- label matches spoken context
- visual treatment is subtle and premium

Gap examples:

- highlight blocks UI
- irrelevant highlight
- noisy label wording

### 6. Caption Quality

Target:

- captions are readable
- line breaks feel natural
- emphasis is tasteful
- timing is aligned with speech

Pass checks:

- no overcrowded caption pills
- no lines that are too long
- no obvious timing lag

Gap examples:

- dense caption blocks
- awkward line splitting
- captions persist too long

### 7. Visual Branding And Premium Feel

Target:

- intro and outro look intentional
- typography and spacing feel polished
- theme feels suitable for launch content

Pass checks:

- title card reads clearly
- CTA feels professional
- gradients, overlays, and caption styling feel consistent

Gap examples:

- generic look
- weak hierarchy
- inconsistent visual language

### 8. Render Reliability

Target:

- no failed exports on healthy input
- no hanging subprocesses
- preview and final outputs are valid

Pass checks:

- preview generated successfully
- final render generated successfully
- no zero-byte output
- no retry loop caused by grayscale-frame extraction issues

### 9. Speed

Target modes:

- quality-first fast mode: `3 to 4 minutes`
- premium mode: may exceed `4 minutes` if quality meaningfully improves

Pass checks for quality-first fast mode:

- average total runtime `<= 240s`
- p95 total runtime `<= 300s`
- no single healthy benchmark run exceeds `360s`

Important:

- speed cannot be treated as parity if output quality regresses

## Benchmark Suite

Use at least these input classes:

1. clean screen recording with clear narration
2. fast click-heavy SaaS demo
3. dashboard walkthrough with dense UI
4. feature launch video with marketing tone
5. onboarding flow with forms and menus
6. short recording under 60 seconds
7. medium recording between 60 and 180 seconds
8. recording with weaker narration but clean visuals
9. recording with OCR-heavy UI labels
10. recording with multiple modal or panel changes

For every benchmark video capture:

- source duration
- upload size
- transcription time
- script generation time
- planning time
- preview render time
- preview review time
- refined preview rerender time if any
- final render time
- total runtime
- reviewer score by category
- whether manual edits were needed

## Reviewer Checklist

For each output, answer:

1. Would I publish this externally without embarrassment?
2. Does the script sound sharper than the raw narration?
3. Did the zooms help me follow the demo?
4. Were any highlights distracting or misplaced?
5. Were captions readable the whole time?
6. Did the video feel premium enough for a launch or onboarding asset?
7. Was anything obviously worse than Clueso on the same input?

## Launchify Current Strengths

- script-led scene planning exists
- visual analysis exists
- OCR-assisted focus inference exists
- review-based refinement exists
- preview rerender is now skipped when unnecessary
- render bundle caching exists
- fail-fast subprocess timeouts exist
- stage timing instrumentation exists

## Launchify Current Likely Gaps To Close

- side-by-side benchmark evidence vs Clueso is missing
- typography and template polish may still feel less premium
- voice quality and pronunciation controls may still lag
- highlight behavior may need more subtle styling
- scene pacing may need stronger action-boundary detection
- final render time may still dominate the runtime budget

## Implementation Priorities To Reach Parity

Priority 1:

- benchmark Launchify against real sample recordings
- collect stage timings and reviewer scores

Priority 2:

- tune zoom and highlight heuristics using benchmark failures
- improve caption segmentation and pacing

Priority 3:

- improve visual template quality to feel more premium
- tighten CTA, intro, and outro polish

Priority 4:

- reduce final render cost without lowering visible quality
- reuse more intermediate artifacts where possible

## Non-Goals

This checklist does not claim:

- access to Clueso proprietary internals
- legal or technical cloning of Clueso
- guaranteed exact feature parity from public marketing claims alone

The goal is competitive parity in output quality and workflow experience based on publicly observable behavior.
