Slide 1 — Favorite Barber (Cover)
- Title: Favorite Barber
- Subtitle: Find a barber you can trust — AI-powered, privacy-first
- One-line value prop: Barber-level attribution, verified photos, and trust signals for confident bookings

Slide 2 — Problem
- Directory sites show shop-level info; users can’t find the specific barber who does their style
- Reviews are noisy, photos irrelevant, and fake/farmed reviews cause mistrust
- Result: lost bookings and misattribution for individual barbers

Slide 3 — Solution
- Normalize listings, attribute reviews to barbers, enrich with LLM + Vision
- Local LLMs (Ollama) + vision models for privacy-first enrichment
- Outputs: barber profiles, hairstyle tags, review summaries, and trust scores

Slide 4 — Tech & MCP Integration
- Ingest: Yelp GraphQL + REST, Playwright workers
- Enrich: Ollama (local LLM) for sentiment, name-extraction, summarization; Google Vision for image relevance
- MCP Server: auth, rate-limits, telemetry, webhooks — exposes discover & enrichment endpoints to partners/agents
- Developer use-cases: ChatGPT plugin, Zapier automations, embedded widgets

Slide 5 — Trust Signals & Demo
- Trust signals: photo authenticity, review sentiment & attribution, verification, recency, spam penalty
- API demo snippets:
  - Search: curl "http://localhost:3000/api/search?q=fade&location=Brooklyn"
  - MCP discover: curl -H "Authorization: Bearer ryb_test_KEY" -X POST http://localhost:3000/api/mcp/discover -d '{"location":"Brooklyn","styles":["fade"]}'
- Visual: profile with `trust_score`, `hairstyles`, and `verified` badge
-
Slide 6 — Testing & QA
- Automated test suite: unit, integration, and end-to-end tests (vitest + Playwright)
- Deterministic mock providers for LLMs (`workers/llm/providers/mock.js`) enable CI stability
- Test helpers & fixtures: `tests/`, `tests/fixtures/`, and `scripts/setup_test_db.sh` for reproducible test DB
- Benchmarks & LLM accuracy harness: `workers/llm/benchmark_providers.js`, `workers/llm/TESTS_README.md`
- Key demo commands: `./scripts/setup_test_db.sh` then `npm run test` (API/workers)

Slide 7 — Growth & Ask
- Roadmap: Consumer MVP → MCP developer platform → Barber SaaS + marketplace
- Monetization: booking fees, premium listings, barber SaaS ($29/mo), MCP partner tiers ($299/mo)
- Ask: beta partners, design help, or $50k seed to accelerate onboarding and Yelp quota

Notes:
- Keep each slide 40–60s. Use the Trust Signals slide for a quick technical audience deep-dive.
