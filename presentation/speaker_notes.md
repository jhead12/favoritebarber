Overview & timing
- Total: 5 minutes. Aim: 45–50s per slide, 20s for cover.

Slide 1 — Cover (0:00–0:20)
- Say: "Hi — Favorite Barber helps you find a barber you can actually trust, not just a shop with stars."

Slide 2 — Problem (0:20–1:00)
- Emphasize: shop-level data, noisy photos, fake reviews, and misattribution.
- Quick stat: "Users often book the shop but get a different barber — trust breaks down."

Slide 3 — Solution (1:00–1:40)
- Explain normalization, enrichment, and outputs: barber profiles, hairstyle tags, review summaries, trust scores.
- Call out privacy: "We run LLM enrichment locally (Ollama) to keep sensitive data in-house."

Slide 4 — Tech & MCP (1:40–2:20)
- Walk through data flow: Yelp → workers → enrichment (Ollama + Vision) → DB → MCP
- Explain MCP value: "Developer gateway for AI agents — auth, quotas, telemetry, webhooks."

Slide 5 — Trust Signals & Demo (2:20–3:20)
- Show trust signal components (photo_score, review_quality, verification, recency, spam_penalty).
- Run two quick commands live or show screenshots of results. Use these ready commands:

  curl "http://localhost:3000/api/search?q=fade&location=Brooklyn"

  curl -H "Authorization: Bearer ryb_test_KEY" -X POST http://localhost:3000/api/mcp/discover \
    -d '{"location":"Brooklyn","styles":["fade"]}'

- Talk through a sample profile: on-location photo + 10 positive, attributed reviews → TrustScore ~85 (Trusted)

Slide 6 — Testing & QA (2:20–3:10)
- Say: "We have a comprehensive testing suite to keep our AI pipelines reliable."
- Describe: unit tests for core logic, integration tests for API endpoints, Playwright end-to-end flows for worker-driven enrichment.
- Highlight: Mock LLM provider (`workers/llm/providers/mock.js`) for deterministic CI runs and `workers/llm/TESTS_README.md` for LLM benchmarking.
- Show how to run tests locally: `./scripts/setup_test_db.sh` then `npm test` (or `npm run test:ui` for Playwright).
- Note: Trust score computations are covered by offline evaluation harness and synthetic datasets in `tests/fixtures/`.

Slide 7 — Growth & Ask (3:10–5:00)
- Roadmap and revenue model (booking fees, barber SaaS, MCP tiers)
- Ask: beta partners, design help, $50k seed

Extra: Trust Signals deep-dive (for technical audience)
- Provide formula & components (see `docs/TRUST_SCORE.md`)
- Mention auditability: `barbers.trust_components` persists component values for explainability

Delivery tips
- Keep it conversational and demo-focused
- If asked about privacy, emphasize Ollama local inference and data retention policies
