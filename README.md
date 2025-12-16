# Rate Your Barber — Scaffold

This repository contains a scaffold for the Rate Your Barber app. It is an initial layout with placeholders for the frontend (`web/`), API (`api/`), background workers (`workers/`), and database migrations (`api/migrations/`).

What this scaffold includes
- Frontend stubs (`web/`) — pages and components for search and profile views
- API stubs (`api/`) — basic route handlers and contract docs
- Worker stubs (`workers/`) — Yelp fetcher, image processor, geocoder
- Migration skeletons (`api/migrations/`) — SQL create table stubs
- Dev tooling: `docker-compose.yml`, `.env.example`, and a simple `scripts/dev.sh`

Next steps

1. Provide API keys in `.env` and run the development environment using Podman.

Podman quickstart
- Start services:

	podman compose up --build

- Stop services:

	podman compose down

Developer helpers
- Use the included Makefile for convenience (requires Podman):

	make up
	make migrate
	make seed

Local LLM Setup (Ollama + Llama 3.2)

For privacy-first text analysis (name extraction, sentiment, summarization), this repo includes integration with Ollama, a local LLM runtime. Follow these steps to enable local Llama inference:

1. **Install Ollama** (macOS/Linux/Windows):
   - Download from https://ollama.ai
   - macOS: `brew install ollama` (or use the DMG installer)
   - Verify: `ollama --version`

2. **Pull the Llama 3.2 (3B) model**:

	ollama pull llama3.2:3b

   This downloads the 3B parameter model (~2GB), optimized for CPU-only inference.

3. **Run Ollama server** (keep running in a separate terminal during dev):

	ollama serve

   This starts the Ollama API on `http://localhost:11434` by default.

4. **Set environment variables** in `.env`:

	OLLAMA_ENDPOINT=http://localhost:11434
	OLLAMA_MODEL=llama3.2:3b

   These are already in `.env.example`; copy to `.env` if not present.

5. **Test the integration**:

	cd /path/to/RateYourBarber
	node workers/llm/test_ollama.js

   Expected output:
   - ✓ Ollama is reachable at http://localhost:11434
   - Sentiment scores (0.0–1.0) and extracted names from sample reviews
   - If Ollama is unavailable, functions gracefully fall back to heuristics

6. **How it's used** in the pipeline:
   - `workers/llm/ollama_client.js` — Core Ollama interface with heuristic fallbacks
   - `workers/llm/review_parser.js` — Wrapper for batch review parsing
   - Review enrichment: The Yelp fetcher can call `parseReview()` to extract sentiment, names, and summaries from reviews without sending data to external APIs.

    ### Todo
    - Set up other LLM Providers
    - Atropic
    - MCP servers
       - Define MCP roadmap for both internal tools and external partners
       - Complete Yelp GraphQL Phases 1–4 (audit, use-case split, prototype client, worker updates) before full MCP rollout
       - Clarify partner onboarding, auth scopes, and rate-limiting ownership (MCP enforces partner quotas; workers remain independent)
       - Link to `docs/MCP_DESIGN.md` for detailed design and next steps

      ### LLM Provider Expansion TODO
      - Goal: support a broad open-source LLM ecosystem while keeping Ollama for local/dev.
      - Adapters to add (priority): `huggingface` (Inference API/TGI), `vllm`/`tgi` (self-hosted), `replicate`, `gpt4all`/`llama.cpp`, plus existing `openai`/`anthropic` adapters.
      - Implementation notes:
         - Add `workers/llm/llm_client.js` facade and `workers/llm/providers/*` adapters (one file per provider).
         - Support env vars: `LLM_PROVIDER`, `LLM_PROVIDER_FALLBACK` (comma-separated), `LLM_TIMEOUT_MS`, `LLM_MAX_RETRIES`, and provider keys like `HF_API_KEY`, `REPLICATE_API_KEY`.
         - Add a provider capability registry (streaming, embeddings, function-calling) to choose appropriate model calls.
         - Persist enrichment metadata: add migration to store `enriched_provider` and `enriched_model` on `reviews`.
         - Enforce license/commercial checks before enabling community models (document onboarding in `docs/`).
      - Safety & ops:
         - Add pre-send moderation/masking for PII, telemetry (latency, token counts, errors), and per-provider quotas with canary rollout.
      - Files to create/edit:
         - `workers/llm/llm_client.js` (facade)
         - `workers/llm/providers/huggingface.js`, `vllm.js`, `replicate.js`, `gpt4all.js`
         - migration: `api/migrations/0XX_add_llm_provider_metadata.sql`
         - docs: `docs/LLM_PROVIDER_ONBOARDING.md`
      - Next step: scaffold `workers/llm/providers/huggingface.js` (recommended first open-source adapter). 


If Ollama is not running, all LLM functions degrade to local heuristics (regex NER, keyword sentiment, truncation) automatically. No data is ever sent outside your machine.

2. Implement crawler logic in `workers/crawlers/yelp_fetcher.ts` and run workers.
3. Implement API endpoints and wire database connection.



## Yelp GraphQL TODOs

This section tracks the phased plan to add Yelp GraphQL support and a hybrid GraphQL/REST strategy. Update the "Status" and remove or replace the "Begin marker" when work on each phase starts.

- **Phase 1 — Audit current Yelp usage**
   - **Goal**: Find all existing Yelp REST calls in the repo and document which fields are requested and why (files, endpoints, and purpose).
   - **Status**: not-started
   - **Begin marker**: BEGIN-PHASE-1

- **Phase 2 — Define GraphQL vs REST use cases**
   - **Goal**: Map required data fields to GraphQL queries or REST endpoints; decide which workflows need GraphQL.
   - **Status**: not-started
   - **Begin marker**: BEGIN-PHASE-2

- **Phase 3 — Prototype GraphQL client**
   - **Goal**: Add a lightweight GraphQL client module (e.g., `api/yelp_graphql.js`) with auth and a sample `Business` query; validate against 5 sample businesses.
   - **Status**: in-progress
   - **Begin marker**: BEGIN-PHASE-3 (in-progress)

- **Phase 4 — Update ingestion workers**
   - **Goal**: Modify ingestion workers to use GraphQL for enrichment (details, photos, hours) and fall back to REST for bulk lists; add a feature-flag toggle.
   - **Status**: not-started
   - **Begin marker**: BEGIN-PHASE-4

- **Phase 5 — Implement rate-limiting & caching**
   - **Goal**: Add a request queue/token-bucket and Redis-backed caching to respect GraphQL endpoint-capture limits and REST quotas; add retries/backoff.
   - **Status**: not-started
   - **Begin marker**: BEGIN-PHASE-5

- **Phase 6 — DB changes & migrations**
   - **Goal**: Add DB schema changes to store GraphQL-provided fields and image attributions; create migration SQL in `api/migrations/`.
   - **Status**: not-started
   - **Begin marker**: BEGIN-PHASE-6

- **Phase 7 — Testing & validation**
   - **Goal**: Add unit tests for the GraphQL client, integration tests for ingestion with recorded responses, and a quota-simulation test.
   - **Status**: not-started
   - **Begin marker**: BEGIN-PHASE-7

- **Phase 8 — Deploy to staging & monitor**
   - **Goal**: Deploy to staging, monitor usage and errors, and run verification before production rollout.
   - **Status**: not-started
   - **Begin marker**: BEGIN-PHASE-8

---

Notes:
- Use GraphQL selectively for high-value enrichment (photos, hours, categories); use REST for high-volume discovery and polling.
- Track GraphQL endpoint-capture and REST request quotas in telemetry and alert at 70%/90% thresholds.


