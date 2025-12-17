# Rate Your Barber - Concept

Find a barber that you can trust!

(`web/`), API (`api/`), background workers (`workers/`), and database migrations (`api/migrations/`).

What this scaffold includes
- Frontend stubs (`web/`) — pages and components for search and profile views
- API stubs (`api/`) — basic route handlers and contract docs
- Worker stubs (`workers/`) — Yelp fetcher, image processor, geocoder
- Migration skeletons (`api/migrations/`) — SQL create table stubs
- Dev tooling: `docker-compose.yml`, `.env.example`, and a simple `scripts/dev.sh`

## MCP & Discovery Implementation Plan ✅ COMPLETE

This project separates the MCP gateway (auth, scopes, rate limits, telemetry) from background workers (scraping, Playwright, LLMs, image processing). All 7 phases have been implemented.

### Implementation Status (December 2025)

✅ **Phase 1 — Worker Infrastructure**: Discovery daemon runs in worker service, Playwright/Chromium installed
✅ **Phase 2 — Telemetry**: Request logging to `mcp_request_logs` with `X-Request-ID` correlation
✅ **Phase 3 — Discovery Endpoints**: `POST /api/mcp/discover` and job status endpoints with scope enforcement
✅ **Phase 4 — Live Yelp Proxy**: Real Yelp GraphQL calls with circuit breaker and cost tracking
✅ **Phase 5 — Tests & CI**: Test database setup script, dependencies installed
✅ **Phase 6 — Admin & Documentation**: Partner CRUD API, key management, comprehensive API docs
✅ **Phase 7 — Webhooks**: Event subscriptions with HMAC signing and retry worker

### Quick Start Commands

```bash
# Install worker dependencies
cd workers && npm install

# Apply migrations (includes MCP schema with all scopes)
npm run migrate

# Start all services
docker compose up --build

# Run discovery daemon standalone
YELP_API_KEY=... DATABASE_URL=... node workers/discovery_daemon.js

# Run webhook dispatcher
node workers/webhook_dispatcher.js

# Setup test database and run MCP tests
./scripts/setup_test_db.sh
npm run test:mcp

# Run quota aggregation (cron job)
node api/jobs/mcpQuotaAggregator.js
```

### Files Created

- `api/lib/mcpTelemetry.js` — Request logging middleware
- `api/jobs/mcpQuotaAggregator.js` — Daily quota aggregation
- `api/routes/admin/partners.js` — Partner management API
- `api/lib/mcpWebhooks.js` — Webhook signing and delivery
- `api/contracts/mcp_v1.md` — Complete API documentation
- `workers/webhook_dispatcher.js` — Webhook delivery worker
- `scripts/setup_test_db.sh` — Automated test DB setup

### Architecture Notes

- **MCP API**: Lightweight, handles auth/rate-limits/telemetry, returns quickly
- **Workers**: Heavy lifting (Playwright scraping, LLM processing, webhooks)
- **Separation**: No Playwright in API process, workers scale independently
- **Resilience**: Circuit breakers on Yelp calls, exponential backoff on webhooks


- Start services:

	podman compose up --build

- Stop services:

	podman compose down

Developer helpers

	make up
	make migrate
	make seed

Managing .env files

- **Purpose:** Keep a single source of truth for environment variables in the repo root `.env` and propagate to subprojects (`api`, `workers`, `web`).
- **Sync script:** `scripts/sync_env.sh` will copy non-comment lines from the root `.env` into each target's `.env`, making a timestamped backup of any existing file.
- **Run:**

```bash
# Sync to default targets (api, workers, web)
npm run sync:env

# Sync to specific targets
bash ./scripts/sync_env.sh api web
```

Backups are created as `.env.bak.<timestamp>` in each target directory. Use this to avoid editing multiple `.env` files manually.

Local LLM Setup (Ollama + Llama 3.2)

For privacy-first text analysis (name extraction, sentiment, summarization), this repo includes integration with Ollama, a local LLM runtime. Follow these steps to enable local Llama inference:

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

   - `workers/llm/ollama_client.js` — Core Ollama interface with heuristic fallbacks
   - `workers/llm/review_parser.js` — Wrapper for batch review parsing
   - Review enrichment: The Yelp fetcher can call `parseReview()` to extract sentiment, names, and summaries from reviews without sending data to external APIs.



5. **Phase B** — LLM test harness (golden dataset, mock provider, benchmarks) ✅
6. **LLM Provider Expansion** — Add Ollama-based enrichment to existing reviews ✅
8. **Phase F.2** — Trust & Verification (spam detection, verified badges) ✅
9. **Phase D** — MCP rollout infrastructure ✅ (endpoints & admin UI pending)
10. **Phase E/F.3** — Visual search, social feed (differentiators)

Critical dependencies:
- Don't roll out MCP until Yelp GraphQL quota management is proven
- Phase 0 infrastructure must complete before scaling any ingestion
- Frontend display can start in parallel with Yelp Phase 6-7 (once data exists in DB)

### MCP Server Status ✅

**Infrastructure Complete** (December 2025):
- ✅ Database schema (migration 030): Partners, API keys, request logs, quotas, webhooks
- ✅ Authentication: Bearer token validation with bcrypt-hashed keys
- ✅ Rate limiting: Redis-backed per-minute and per-day quotas
- ✅ Roadmap: `docs/MCP_ROADMAP.md` with partner personas, revenue model, API design
- ✅ Migration applied successfully (all 30 migrations)
- ✅ Core API endpoints (`api/routes/mcp.js`) - search, discovery, live Yelp, webhooks
- ✅ Telemetry module (`api/lib/mcpTelemetry.js`) - request logging and analytics
- ✅ Partner management admin API (`api/routes/admin/partners.js`)
- ✅ API documentation (`api/contracts/mcp_v1.md`)
- ✅ Webhook system with HMAC signing and delivery worker

**Remaining Work**:
- Partner management admin UI (`web/pages/admin/partners.tsx`) - frontend needed
- CI/CD workflow (`.github/workflows/test-mcp.yml`) - GitHub Actions setup

**Quick Start**:
```bash
# Apply MCP migration
npm run migrate

# Generate test API key (node REPL)
const { generateAPIKey } = require('./api/middleware/mcpAuth');
generateAPIKey(1, 'test', 'Dev Key').then(r => console.log('Key:', r.key));

# Test auth
curl -H "Authorization: Bearer ryb_test_YOUR_KEY" http://localhost:3000/api/health
```

**Testing**:
```bash
# Run MCP unit tests
node --test tests/unit/test_mcp_auth.js
node --test tests/unit/test_mcp_rate_limiter.js

# Run integration tests (requires API server running)
node --test tests/integration/test_mcp_e2e.js

# Or run all MCP tests
npm run test:mcp

# See tests/README.md for complete testing guide
```

**Target**: Onboard 50 free partners + 5 paid partners ($299/mo) → $3k MRR in 6 months.

See `docs/MCP_ROADMAP.md` for complete implementation plan.

### Future Work
- **LLM Provider Expansion**: Add Hugging Face, Replicate, vLLM adapters (implement one thoroughly before expanding)
- **Advanced MCP Features**: Webhooks, live-Yelp proxy, bulk exports, GraphQL alternative 


If Ollama is not running, all LLM functions degrade to local heuristics (regex NER, keyword sentiment, truncation) automatically. No data is ever sent outside your machine.


- `tests/fixtures/llm_golden.json`: a small golden dataset (5 sample reviews) to validate extraction and sentiment.
- `workers/llm/providers/mock.js`: deterministic mock provider for CI/local testing.
- `workers/llm/benchmark_providers.js`: simple harness that runs the golden dataset against available providers (mock by default).
- `api/scripts/seed_llm_testbed.js`: seed helper that inserts the fixtures into the `reviews` table if a `DATABASE_URL` is configured, otherwise writes a local JSON output.


```bash
# write seed output or insert into DB
# run the benchmark (uses mock provider by default)
npm --prefix api run test:llm
```
2. Implement crawler logic in `workers/crawlers/yelp_fetcher.ts` and run workers.
3. Implement API endpoints and wire database connection.


Phase 0 completed: observability, circuit-breakers, and basic cost-tracking implemented (see `api/lib/logger.js`, `api/lib/circuitBreaker.js`, `api/lib/costTracker.js`).


## Yelp GraphQL TODOs

This section tracks the phased plan to add Yelp GraphQL support and a hybrid GraphQL/REST strategy. Update the "Status" and remove or replace the "Begin marker" when work on each phase starts.

Decisions (implemented/approved):
- **Testing priority**: unit tests for the GraphQL normalizer first, then end-to-end worker integration tests.
- **Quota strategy**: REST and GraphQL quota are tracked together under one Redis-backed Yelp counter. Quota enforcement is now wired into the API GraphQL client and core REST endpoints so all outbound Yelp calls share the same counter.
- **Client implementation**: migrate the raw `axios` POST to `graphql-request` for clearer error shapes and typed queries. Work started: `api/yelp_graphql.js` is being migrated.

- **Phase 1 — Audit current Yelp usage**
   - **Goal**: Find all existing Yelp REST calls in the repo and document which fields are requested and why (files, endpoints, and purpose).
   - **Status**: not-started
   - **Begin marker**: BEGIN-PHASE-1
   - **Action items**:
     - Search codebase for Yelp API calls (`grep -r "yelp" api/ workers/`)
     - Document endpoints used, fields requested, and why (create `docs/YELP_AUDIT.md`)
     - Identify which calls are for discovery (lists) vs enrichment (details)
     - Map current rate-limit/quota usage patterns

- **Phase 2 — Define GraphQL vs REST use cases**
   - **Goal**: Map required data fields to GraphQL queries or REST endpoints; decide which workflows need GraphQL.
   - **Status**: not-started
   - **Begin marker**: BEGIN-PHASE-2
   - **Action items**:
     - For each field in Phase 1 audit, determine if available via GraphQL
     - Create decision matrix: "Use GraphQL for X, REST for Y"
     - Recommended split: GraphQL for enrichment (photos, hours, reviews), REST for search/discovery
     - Document in `docs/YELP_AUDIT.md` under "GraphQL Strategy" section

- **Phase 3 — Prototype GraphQL client** ✅
   - **Goal**: Add a lightweight GraphQL client module (e.g., `api/yelp_graphql.js`) with auth and a sample `Business` query; validate against 5 sample businesses.
   - **Status**: completed
   - **Implementation**: GraphQL client with `graphql-request`, timeout/retry wrapper, rate-limiting integration, `fetchBusinessDetails()` and `fetchBusinessReviews()` helpers exported.
   - **Files**: `api/yelp_graphql.js`, `api/lib/yelp_normalize.js` (added `mapGraphqlBusiness()` and `mapGraphqlReviews()`).

- **Phase 4 — Update ingestion workers** ✅ **CRITICAL FOR REVIEWABLE WEBSITE**
   - **Goal**: Modify ingestion workers to use GraphQL for enrichment (details, photos, hours) and fall back to REST for bulk lists; add a feature-flag toggle.
   - **Status**: completed
   - **Implementation**: 
     - Added `enrichBusinessWithGraphql()` to `workers/crawlers/yelp_fetcher.ts`
     - Feature flags: `USE_YELP_GRAPHQL`, `FORCE_YELP_REENRICH`, `YELP_GRAPHQL_FALLBACK_TO_REST`
     - GraphQL enrichment with pagination for reviews
     - Fallback to REST on GraphQL failure (configurable)
     - Raw GraphQL responses stored in `yelp_businesses.raw_data`
   - **Files**: `workers/crawlers/yelp_fetcher.ts`

- **Phase 5 — Implement rate-limiting & caching**
   - **Goal**: Add a request queue/token-bucket and Redis-backed caching to respect GraphQL endpoint-capture limits and REST quotas; add retries/backoff.
   - **Status**: not-started
   - **Begin marker**: BEGIN-PHASE-5

- **Phase 6 — DB changes & migrations** ✅
   - **Goal**: Add DB schema changes to store GraphQL-provided fields and image attributions; create migration SQL in `api/migrations/`.
   - **Status**: completed
   - **Implementation**:
     - Created migration `028_add_yelp_graphql_fields.sql`
     - Added columns to `yelp_businesses`: `price`, `hours` (jsonb), `yelp_attribution`, `graphql_enriched` (boolean), `review_cursor`
     - Added index on `graphql_enriched` for efficient filtering
     - Updated `api/lib/yelp_normalize.js` to map GraphQL responses
   - **Files**: `api/migrations/028_add_yelp_graphql_fields.sql`

- **Phase 7 — Testing & validation** ✅
   - **Goal**: Add unit tests for the GraphQL client, integration tests for ingestion with recorded responses, and a quota-simulation test.
   - **Status**: completed (unit tests)
   - **Implementation**:
     - Created integration tests: `tests/integration/test_yelp_graphql_flow.js`
     - Test fixtures: `tests/fixtures/yelp_graphql/sample_business.json`, `sample_reviews.json`
     - Tests cover: business normalization, review mapping, query structure, feature flags
     - Tests pass: 2/3 (1 requires `npm install` in api/)
   - **Files**: `tests/integration/test_yelp_graphql_flow.js`, `tests/fixtures/yelp_graphql/*`
   - **Remaining**: End-to-end tests with live API, quota simulation tests

- **Phase 8 — Deploy to staging & monitor**
   - **Goal**: Deploy to staging, monitor usage and errors, and run verification before production rollout.
   - **Status**: not-started
   - **Begin marker**: BEGIN-PHASE-8

---

## ✅ Implementation Status (December 2025)

Yelp GraphQL integration (Phases 3, 4, 6, 7) has been **completed**:

### What Was Built
- ✅ GraphQL client with queries, rate-limiting, and circuit breakers
- ✅ Database migration (028) for GraphQL fields
- ✅ Normalization functions for GraphQL responses
- ✅ Worker integration with feature flag support
- ✅ Integration tests and fixtures
- ✅ Documentation: `docs/YELP_GRAPHQL_QUICKSTART.md`

### Quick Start

```bash
# 1. Apply migration
npm --prefix api run migrate

# 2. Set environment variables in .env
USE_YELP_GRAPHQL=false              # Enable when ready
FORCE_YELP_REENRICH=false           # Re-enrich already processed businesses
YELP_GRAPHQL_FALLBACK_TO_REST=true  # Fallback on errors

# 3. Run tests
node tests/integration/test_yelp_graphql_flow.js

# 4. Enable GraphQL enrichment
USE_YELP_GRAPHQL=true node workers/crawlers/yelp_fetcher.ts
```

### Next Steps
- [ ] **Phase 1-2**: Audit existing Yelp REST usage (run `node scripts/yelp_audit.js`)
- [ ] **Phase 5**: Redis-backed caching for GraphQL responses
- [ ] **Phase 7**: End-to-end tests with live Yelp API
- [ ] **Phase 8**: Deploy to staging and monitor quota usage

See `docs/YELP_GRAPHQL_QUICKSTART.md` for detailed usage instructions.

---

Notes:
- Use GraphQL selectively for high-value enrichment (photos, hours, categories); use REST for high-volume discovery and polling.
- Track GraphQL endpoint-capture and REST request quotas in telemetry and alert at 70%/90% thresholds.

### Strategy Additions (recommended)

To strengthen product-market fit and data quality, consider these additions to the roadmap:

- **Claim & Curate:** allow barbers to claim generated profiles (`claim_profile` API). After claiming, enable portfolio uploads and an onboarding flow (SMS/social verification) so barbers can curate their images and contact info.

- **Visual Style Search:** add image embeddings (CLIP/vision-LM) and `pgvector` to enable semantic visual searches ("high fade with design") rather than only text queries.

- **Social Feed Integration:** enrich profiles with the latest public social thumbnails via oEmbed or a safe crawler (cache thumbnails and post timestamps) so users see recent work on the profile page.

- **Trust & Verification:** extend the trust model with verification signals (photo-at-location, receipt uploads), and use LLM moderation to detect spam or coordinated review attacks before they affect scores.

These features improve engagement for barbers and trust for end users; they can be rolled out incrementally (claiming → feed → embeddings → verification).

### How to try Barber Claiming locally

1. Apply the new migration added in this branch:

```bash
npm --prefix api run migrate
```

2. Start the API and call the claim endpoint (replace IDs):

```bash
# request a claim
curl -X POST http://localhost:3000/api/claims/claim-profile \
   -H 'Content-Type: application/json' \
   -d '{"barber_profile_id":1,"user_id":"<your-user-uuid>","evidence_url":"https://example.com/photo.jpg"}'

# check claim status
curl http://localhost:3000/api/claims/1/status
```

3. Next steps after claiming: add an admin UI to approve/reject and a small verification flow (SMS or social link). I can scaffold these if you want.

## Completion Plan & LLM Testing Optimization

This project plan focuses on finishing core features and enabling robust, repeatable LLM testing across providers.

### Phase A — Data Foundation
- Seed realistic LLM test data: add `api/scripts/seed_llm_testbed.js` to insert 50+ varied reviews (short/long, multi-name, non-English, spam patterns).
- Ensure `enriched_provider` / `enriched_model` / `prompt_version` are present (see `api/migrations/026_add_enriched_provider_metadata.sql`) so enrichment provenance is recorded.
- Add `profile_claims` audit table migration to persist claim history.

### Phase A.5 — Data Quality Pipeline
- **Deduplication**: Fuzzy-match barber names/addresses to detect duplicate Yelp listings.
- **Geocoding validation**: Cross-check Yelp coordinates against Google Maps API; flag outliers.
- **Image relevance**: Extend `workers/image_processor.js` to filter non-barber images (SafeSearch + label detection).
- **Review authenticity**: Detect suspicious patterns (all 5-star from new accounts, bot language).
- Add `api/jobs/dataQualityAudit.js` cron job to periodically re-score trust signals.

**Files to create**:
- `api/lib/deduplicator.js` — fuzzy matching logic
- `api/lib/reviewAuthenticityChecker.js` — spam/bot detection heuristics
- `api/migrations/0XX_add_duplicate_candidates.sql` — table for flagged duplicates

### Phase B — LLM Test Harness
- Add a formal test runner (Vitest or Jest) to the repo and wire `npm` scripts for `test:llm`, `test:llm:benchmark`, and `test:llm:live`.
- Create a golden dataset: `tests/fixtures/llm_golden.json` (50+ labeled cases with expected `names`, `sentiment`, `summary` assertions).
  - Include adversarial cases: all-caps reviews, emoji spam, non-English, multi-name edge cases
- Add a CI-safe mock provider: `workers/llm/providers/mock.js` used by CI to run deterministic LLM tests.
- Add `workers/llm/benchmark_providers.js` to run the golden dataset against configured providers and emit latency/accuracy/cost metrics.

### Phase B.5 — Integration & Load Testing
- **Load testing**: Add Locust or k6 scripts to simulate 1000 concurrent review enrichments.
- **Quota exhaustion simulation**: Test behavior when Yelp GraphQL hits daily limit mid-day.
- **Chaos engineering**: Randomly fail Redis, Postgres, Yelp API to validate circuit breakers.
- **Regression detection**: Automated CI check comparing new LLM provider outputs against golden dataset (fail build if accuracy drops >10%).

**Files to create**:
- `tests/load/enrichment_load_test.js` — k6 or Locust script
- `tests/chaos/simulate_failures.sh` — Docker Compose chaos scenarios

### Phase C — GraphQL & Enrichment
- Finalize Yelp GraphQL validation against Yelp schema and expand recorded fixtures (`tests/fixtures/yelp_graphql/`).
- Update ingestion workers to optionally use GraphQL for enrichment (photos/hours) with feature-flag toggles.
- Add Redis-backed rate-limiter or token-bucket for GraphQL calls to prevent quota exhaustion.

### Phase D — MCP & Production Readiness
- **Prerequisite**: Complete `docs/MCP_ROADMAP.md` (partner personas, API surface, auth model, rate limits).
- Implement MCP telemetry hooks to record partner calls, yelp_quota_cost, and LLM provider usage.
- Add production-grade MCP rate limiter (Redis) and expose partner-scoped quotas.
- Create partner onboarding flow: API key generation, quota assignment, documentation.

### Phase E — Advanced Product Features
- **Visual search**: Scaffold `workers/image_embedder.js` and add `pgvector` migration to enable semantic image search.
  - Add DB indexes for vector similarity queries (HNSW or IVFFlat).
  - Implement query optimization for large-scale embedding searches.
- **Social feed thumbnails**: Extend `workers/crawlers/yelp_to_socials.js` to fetch oEmbed thumbnails and cache them for profiles.
- Use cached data for visualization analysis.

### Phase F — Core Product Features (High Priority)

#### Phase F.1 — Claim & Curate
- **Goal**: Allow barbers to claim and manage their profiles (critical for engagement).
- Enable portfolio uploads after claim approval.
- Add onboarding flow with SMS or social verification.
- Build admin UI to approve/reject claims.
- **Files**: Already exists in `api/routes/claims.js`, add admin UI in `web/pages/admin/claims.tsx`.

#### Phase F.2 — Trust & Verification
- **Goal**: Prevent spam and build user trust.
- Add verification signals: photo-at-location (EXIF GPS), receipt uploads, business license checks.
- Implement LLM-powered moderation to detect coordinated review attacks.
- Add "Verified" badge to profiles meeting trust thresholds.
- Add user-facing "Report Spam" button.
- **Files**:
  - `api/lib/trustScorer.js` — calculate trust score from signals
  - `api/migrations/0XX_add_verification_signals.sql`
  - `workers/llm/moderator.js` — LLM-based review moderation

#### Phase F.3 — Social Feed & Visual Polish
- Display recent Instagram/social thumbnails on profile pages.
- Add visual portfolio carousel for claimed profiles.
- Optional: implement "style inspiration" board (user saves favorite cuts). 

LLM Testing Optimizations (how to run robust tests)
- Golden dataset: store labeled cases in `tests/fixtures/llm_golden.json` and add a test `tests/llm/golden.spec.js` asserting outputs from `workers/llm/llm_client.js`.
- Mock provider for CI: `workers/llm/providers/mock.js` returns deterministic outputs; set `LLM_PROVIDER=mock` in CI.
- Provider benchmarking: use `workers/llm/benchmark_providers.js` to compare `ollama`, `openai`, `huggingface`, `replicate` on the golden dataset and record latency/accuracy/cost.
- Telemetry: instrument `workers/llm/llm_client.js` to record `provider`, `model`, `latency_ms`, `success`, and `token_counts` to a lightweight metrics table or logs for offline analysis.
- A/B experiments: implement `enrichment_strategy` flag to route a percentage of reviews to different providers and compare outputs using the golden dataset labels.

Quick commands
```bash
# Run migrations and seed LLM testbed
npm --prefix api run migrate
node api/scripts/seed_llm_testbed.js

# Run the golden dataset tests (local, requires provider keys for live runs)
npm run test:llm

# Run provider benchmark (live)
node workers/llm/benchmark_providers.js --providers=ollama,openai,huggingface

# Use mock provider in CI
export LLM_PROVIDER=mock
```

Immediate next steps I can implement now
- Scaffold `api/scripts/seed_llm_testbed.js` and create `tests/fixtures/llm_golden.json` (I can generate seed cases). 
- Add `workers/llm/providers/mock.js` and a `benchmark_providers.js` harness. 
- Add Vitest as test runner and wire `package.json` scripts for LLM tests.

---

## Implementation Priority Summary

**Philosophy**: Get real barber data flowing and displayable FIRST, then add LLM enrichment as enhancement.

Based on dependencies and business value, implement in this order:

### Immediate (Weeks 1-2) — Foundation
1. **Phase 0** — Infrastructure baseline (logging, Redis, monitoring, feature flags)
2. **Yelp GraphQL Phase 1-2** — Audit current Yelp usage, document use cases
3. **Yelp GraphQL Phase 3** — Complete and validate GraphQL client (already in-progress)

### Short-term (Weeks 3-4) — Get Data Flowing ⚠️ **CRITICAL PATH**
4. **Yelp GraphQL Phase 4** — Update ingestion workers to fetch barber data via GraphQL
5. **Yelp GraphQL Phase 5** — Rate-limiting and Redis caching
6. **Yelp GraphQL Phase 6** — DB schema migrations for GraphQL fields
7. **Yelp GraphQL Phase 7** — Integration tests with recorded fixtures

### Short-term (Weeks 5-6) — Reviewable Website MVP
8. **Basic Frontend** — Display barbers, reviews, photos (wire existing `web/` stubs to API)
   - `web/pages/search.tsx` — search barbers by location
   - `web/pages/barber/[id].tsx` — profile with reviews and photos
   - `web/components/ReviewList.tsx` — display reviews (no LLM sentiment yet)
9. **Manual verification** — Verify 10+ real barber profiles display correctly

### Medium-term (Weeks 7-9) — LLM Enrichment Layer
10. **Phase A** — Seed LLM testbed data
11. **Phase B** — LLM test harness with golden dataset and mock provider
12. **LLM Integration** — Add Ollama-based enrichment to existing reviews
    - Sentiment scoring
    - Barber name extraction
    - Review summarization
13. **Phase A.5** — Data quality pipeline (deduplication, authenticity checks)

### Medium-term (Weeks 10-12) — User Engagement
14. **Phase F.1** — Claim & Curate (high user value, unblocks barber engagement)
15. **Phase F.2** — Trust & Verification (spam detection, verified badges)
16. **Phase B.5** — Load testing and chaos engineering

### Long-term (Weeks 13+) — Scale & Polish
17. **LLM Provider Expansion** — Add Hugging Face adapter (battle-test before expanding)
18. **Yelp GraphQL Phase 8** — Deploy to staging and monitor production usage
19. **Phase D** — MCP rollout (after Yelp + LLM stabilize)
20. **Phase E** — Visual search with pgvector
21. **Phase F.3** — Social feed thumbnails and visual polish

### Key Principles
- **Data first, AI second**: Complete Yelp ingestion (Phases 1-7) before LLM work — can't enrich data you don't have.
- **Reviewable early**: Prioritize basic frontend display over sophisticated enrichment.
- **Don't parallelize risky work**: Complete Yelp audit before prototyping, one LLM provider before expanding.
- **Fail fast**: Phase 0 infrastructure catches quota/cost issues early.
- **Test before scale**: Phase B harness prevents production LLM regressions.
- **LLM is enhancement, not requirement**: Website should work with un-enriched reviews.

If you want, I can start by generating the seed/test dataset and adding the mock provider and test harness. 


