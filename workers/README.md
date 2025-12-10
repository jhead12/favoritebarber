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
