# Workers — RateYourBarber

Quick reference for running and testing the background workers used by RateYourBarber.

Prerequisites
- Node.js (v16+ recommended)
- Postgres available (or run the full stack via the repo's compose scripts)
- Optional: Google Cloud Vision credentials if you want real image analysis
- Optional: Ollama (or another local LLM endpoint) for LLM-based tests

Install

```bash
cd workers
npm install
```

Running worker (development)

```bash
# from repo root
npm --prefix workers run dev
```

Image processor
- `workers/image_processor.js` supports a `--sample` / `--simulate` mode to run against local fixtures when a DB or GCloud credentials are unavailable.

Test scripts
- The repository includes a set of test scripts that can be run directly with `node`. They are lightweight and often use heuristics when external services are missing.

Examples

```bash
# Hairstyle vision unit tests
node workers/test_hairstyle_vision.js

# End-to-end hairstyle workflow (has flags; see help)
node workers/test_e2e_hairstyle_workflow.js --dry-run

# Local LLM / AI accuracy tests (requires Ollama or will fallback)
node workers/llm/test_ai_accuracy.js
```

Notes
- Tests may exit nonzero if required services (Postgres, Ollama) are not reachable — this is expected for some environments. Review output for suggestions.
- If you plan to run many worker processes locally, consider using the repo's compose tool to start Postgres/Redis.

Where to look
- Worker entry point: `workers/index.js`
- Image analysis: `workers/image_processor.js`
- LLM helper + tests: `workers/llm/`

If you'd like, I can add a `Makefile` or npm `test` script to run the typical test set for convenience.
# Workers — Image Processor Setup

This document explains how to enable the real Vision API integration for the Node `image_processor` worker and how to run it.

Prerequisites
- Node 18+ installed.
- A running Postgres instance and the app `DATABASE_URL` environment variable set.
- Google Cloud Vision credentials (recommended) or equivalent vision provider.

Install dependencies (from repository root):

```bash
cd /Volumes/PRO-BLADE/Github/RateYourBarber
npm install --workspace=workers
# or from the workers folder
cd workers && npm install
```

Environment
- `DATABASE_URL` — connection string for Postgres (used by `api/db.js`).
- `GOOGLE_APPLICATION_CREDENTIALS` — path to a Google Cloud service account JSON key (if using Google Vision).
- `GCLOUD_PROJECT` — optional project id.

Running the worker
- Offline/sample mode (no DB or Vision credentials required):

```bash
node workers/image_processor.js --sample
```

- Process pending images from DB (requires database and migrations applied):

```bash
node workers/image_processor.js --pending 100
```

Notes
- The worker will use Google Vision if `GOOGLE_APPLICATION_CREDENTIALS` or `GCLOUD_PROJECT` is present and the `@google-cloud/vision` package is installed.
- The worker persists analysis to `image_analyses` and updates `images.relevance_score`, `images.authenticity_score`, and `images.hairstyles`.
- The repository contains migrations `api/migrations/009_create_image_analyses_and_image_scores.sql` and `010_add_hairstyles_columns.sql` which must be applied before running against your DB.

Security and cost
- Vision API calls incur cost — batch requests where possible and use caching.
- Do not commit service account JSON to source control; use environment/secret management.
