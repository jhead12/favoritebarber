# MCP Design — Yelp + Enriched Data

This document describes the proposed Model Context Protocol (MCP) server design for mediating Yelp data and enriched Postgres records for both internal tools and external partners.

## Goals
- Serve consistent, well-documented data to internal services and external partners.
- Rely on normalized Postgres-enriched data where possible; proxy Yelp GraphQL selectively for fields not yet persisted.
- Enforce partner-facing auth and rate-limits at the MCP gateway; keep workers independent for ingestion workloads.

## Data Surfaces
- Postgres-enriched views (preferred):
  - `barber_detailed_info` — barber + shop + computed scores + recent enriched reviews
  - `review_scores` / `barber_scores`
  - Image metadata and attribution stored in `images` and `image_analyses`
- Yelp-live (proxied selectively):
  - High-value enrichment fields not yet stored (hours, extra photos, categories)
  - MCP should expose these via explicit endpoints flagged as `live_yelp` with required attribution

## Access Patterns
- Internal tools:
  - Prefer DB-backed endpoints for stability and performance.
  - Allowed to call MCP endpoints returning live-Yelp data for immediate validation or one-off requests.
- External partners:
  - Default to DB-backed endpoints only.
  - Live-Yelp endpoints are opt-in and rate-limited more strictly; requires explicit partner approval.

## Auth & Scopes
- Partner API keys (issued per-organization) with scopes:
  - `read:bars`, `read:barbers`, `read:reviews` (basic)
  - `read:live_yelp` (opt-in; extra audit)
- Tokens passed via `Authorization: Bearer <key>`; MCP validates and enforces scopes.

## Rate-Limiting Policy (MCP-only enforcement)
- MCP enforces partner-facing quotas and per-key rate limits using an MCP-local limiter (memory or dedicated MCP Redis).
- Suggested defaults:
  - Free tier: 60 req/min, 10k req/day
  - Partner tier: configurable, up to negotiated SLA
- Workers and ingestion jobs use their own rate-limiting strategy and do NOT share MCP counters.

## Telemetry & Tracing
- MCP emits structured telemetry for partner traffic only (request id, partner id, endpoint, latency, yelp_quota_cost).
- Workers keep independent logs/telemetry for ingestion operations and internal LLM work.

## Error Handling & Backoff
- MCP must translate Yelp errors into consistent HTTP responses:
  - 429 -> `429 Too Many Requests` with `Retry-After` header
  - 5xx -> `502 Bad Gateway` or `503 Service Unavailable` (with retry guidance)
- For live-Yelp proxied endpoints, MCP should apply client-facing backoff guidance and circuit-breaker when Yelp returns repeated errors.

## Implementation Tasks
1. Finish Yelp GraphQL Phases 1–4 (audit, use-case mapping, client prototype, worker updates).
2. Add new API contract docs for MCP endpoints under `api/contracts/`.
3. Implement MCP auth middleware and scoped keys (`api/middleware/mcpAuth.js`).
4. Implement MCP rate limiter module (`api/lib/mcpRateLimiter.js`) scoped to MCP only.
5. Create feature-flagged live-Yelp proxy endpoints (`api/routes/mcp_live_yelp.js`).
6. Add telemetry hooks in MCP (`api/lib/mcpTelemetry.js`) but keep worker telemetry separate.

## Files to Create / Modify
- Create: `docs/MCP_DESIGN.md` (this file)
- Modify: `README.md` (roadmap bullets) — done
- Modify: `docs/IMPLEMENTATION_STATUS.md` — done
- Create: `api/middleware/mcpAuth.js`
- Create: `api/lib/mcpRateLimiter.js`
- Create: `api/routes/mcp.js` (MCP public endpoints)
- Update: `api/yelp_graphql.js` (idempotent client, used by workers and MCP)

## Notes & Compliance
- Any cached Yelp content must include required Yelp attribution and adhere to Yelp Terms of Service. Live-Yelp endpoints must surface attribution metadata.
- External partners must sign a data use agreement before enabling `read:live_yelp` scope.

## Next Steps
- Owner: assign an engineer to complete Yelp GraphQL Phases 1–4 and then implement steps 2–5 above.
- Link this doc from `README.md` and `docs/IMPLEMENTATION_STATUS.md`.

