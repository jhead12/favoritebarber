# Tests README — RateYourBarber (LLM & Vision)

This README documents the available test scripts for the `workers/llm` and related vision tests, how to run them, prerequisites, and troubleshooting tips.

Files and purpose

- `workers/llm/test_language_detection.js`
  - Unit tests for the lightweight language detection utility `language_utils.js`.
  - Fast, no external dependencies.

- `workers/test_hairstyle_vision.js`
  - Unit tests for hairstyle detection logic in `workers/image_processor.js` (keyword/OCR mapping to canonical styles).
  - Can run standalone (simulated data) or against the database with `--db`.

- `workers/test_e2e_hairstyle_workflow.js`
  - End-to-end workflow helper for fetching from Yelp (requires Yelp API key / TypeScript runner), processing images, and summarizing results.
  - Useful for manual integration testing.

Quick prerequisites

- Node.js (v16+ recommended; repo has been tested with Node 23.x locally in this workspace).
- For DB-backed tests: a running Postgres instance and connection configured via `api/db` (check `.env` or local Postgres settings).
- For fetching from Yelp: set `YELP_API_KEY` in environment or root `.env` file.
- For Google Vision image processing: set `GOOGLE_APPLICATION_CREDENTIALS` or `GCLOUD_PROJECT` and install `@google-cloud/vision` if needed.
- To run TypeScript fetcher directly: install `ts-node` (optional) or compile `workers/crawlers/yelp_fetcher.ts` to JavaScript.
 - Optional: Presidio PII analyzer service for higher-quality PII detection. If you run Presidio, set `PRESIDIO_URL` to its base URL (e.g., `http://localhost:3000`). The review pre-filter will call `POST ${PRESIDIO_URL}/analyze` to detect spans to mask. If not set, a built-in regex pre-filter is used.

How to run the tests

1) Language detection unit tests (no DB required):

```bash
node workers/llm/test_language_detection.js
```

Expected output: a short report of passed/failed cases. Exit code `0` on success.

2) Hairstyle detection unit tests (simulated cases):

```bash
node workers/test_hairstyle_vision.js
```

- To run the hairstyle tests against the database (requires DB and analyzed images):

```bash
node workers/test_hairstyle_vision.js --db
```

Note on dates: Reviews ingested from sources (like Yelp) will have their original post timestamp stored in `reviews.created_at` when available; otherwise the ingestion sets a fallback timestamp. Tests that rely on age/scoring should ensure `created_at` is present or set synthetic timestamps in fixtures.

The `--db` run will attempt to connect to the DB using `api/db`'s pool and will print images and barber/shop associations.

3) End-to-end workflow helper (dry-run):

```bash
node workers/test_e2e_hairstyle_workflow.js --dry-run
```

4) End-to-end fetch from Yelp (requires `YELP_API_KEY` and either compiling the TypeScript fetcher or running it with `ts-node`):

```bash
# If you have ts-node installed
node -r ts-node/register workers/crawlers/yelp_fetcher.ts "San Francisco, CA"

# Or use the simple probe (JS) to inspect Yelp fields
YELP_API_KEY=your_key node api/yelp_probe.js
```

Notes and troubleshooting

- If `node -r ts-node/register` fails with `Cannot find module 'ts-node/register'`, either install `ts-node` (`npm i -D ts-node`) or compile the `.ts` to `.js` and run the .js file directly.
- DB connection errors: ensure Postgres is running and the connection details in `api/db.js` match your environment. Check `.env` files if used.
- Google Vision: if you don't have credentials or the SDK installed, the worker falls back to a heuristic analyzer (safe for dev). To enable the Cloud Vision client, install `@google-cloud/vision` and set `GOOGLE_APPLICATION_CREDENTIALS` to your service account JSON.
- When running tests that interact with the DB, be aware they will read data but do not perform destructive migrations.

Extending tests

- Add more labeled examples to `workers/llm/test_language_detection.js` and `workers/test_hairstyle_vision.js` to improve coverage.
- Consider adding `workers/llm/test_comment_quality.js` for the comment-quality guideline examples (I can scaffold this for you).

Contact/Next steps

If you want, I can:
- Add `npm` test scripts to `package.json` for convenience (e.g., `npm run test:lang`, `npm run test:vision`).
- Scaffold `workers/llm/test_comment_quality.js` with the examples from `docs/COMMENT_QUALITY_GUIDELINES.md` and unit tests for the LLM prompt outputs (rule-based simulation).

---
Generated: 2025-12-09
