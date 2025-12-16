# Yelp GraphQL / REST Audit — Phase 1

Summary
-------
This document collects all current usages of Yelp APIs in the codebase (REST + GraphQL), the fields requested, where they are used, and recommended Phase 1 actions to complete the audit.

Discovered Yelp usages (files)
- `api/index.js` — REST search (`/api/yelp-search`), REST business (`/api/yelp-business/:id`), GraphQL business proxy (`/api/yelp-graphql/business/:id`), cached search (`/api/yelp-cached-search`).
  - REST search maps: `businesses[].id`, `name`, `rating`, `review_count`, `distance`, `location.display_address` (joined), `image_url`, `url`, `display_phone`, `categories[].title`, `coordinates`.
  - REST business (`/businesses/{id}`) fields used: `id`, `name`, `url`, `display_phone`, `rating`, `review_count`, `location.display_address`, `coordinates`, `photos`.
  - GraphQL proxy query (current): `id, name, alias, rating, url, photos, categories { title }, location { address1 address2 address3 city state postal_code country }, hours { open { day start end is_overnight } }` — response mapped into `images`, `address` (concatenated parts), `categories`, `hours`.

- `api/yelp_graphql.js` — GraphQL client wrapper (simple axios POST to `https://api.yelp.com/v3/graphql`).

- `api/yelp_probe.js` — Developer probe that calls REST endpoints: `/businesses/search`, `/businesses/{id}`, `/businesses/{id}/reviews`; prints `photos`, `reviews.reviews[].text`, `user.name`, `display_phone`, `location.display_address`, `coordinates`.

- `api/test_yelp_graphql.js` — Small test harness to exercise `queryYelpGraphql`.

- `workers/*` and `api/jobs/*` references
  - `workers/discovery_daemon.js`, `workers/crawlers/*` and `workers/barber_reconciler.js` reference `yelp_business_id` and discovery job flows (use yelp id for discovery and enrichment). They rely on persisted fields such as `yelp_businesses.raw`, `yelp_businesses.images`, and `shops.yelp_business_id`.

- DB / migrations
  - `api/migrations/012_add_yelp_businesses.sql` defines `yelp_businesses` table storing cached raw JSON, latitude/longitude, images, categories and indexes.
  - `api/migrations/007_create_shops_and_associations.sql` and `001_create_barbers.sql` include `yelp_business_id` columns.

Notes about field naming mismatches found
- The GraphQL mapping in `api/index.js` pulls `postal_code` from `b.location` but maps `b.location.zip_code` when building `address` (legacy variable name). Ensure consistent field names (`postal_code` vs `zip_code` or `zip_code` not present in GraphQL schema).
- REST responses use `location.display_address` (array) while GraphQL provides `location { address1 address2 address3 city state postal_code }`. Be explicit in mapping and normalization.

Phase 1 action items
1. Validate GraphQL query fields against Yelp GraphQL schema.
   - Run `node api/test_yelp_graphql.js` with `YELP_API_KEY` and verify the current GraphQL query (see `api/index.js`) returns the expected `location` fields. Update any invalid names (e.g., `zip_code` → `postal_code`) and adjust mapping logic.

2. Centralize GraphQL client improvements.
   - Enhance `api/yelp_graphql.js` to add timeout, retries with exponential backoff, error parsing (capture `errors[]`), and request/response logging (redact keys).

3. Document canonical field mapping.
   - Create a small reference table in this doc linking GraphQL field names → normalized Postgres columns (e.g., `location.address1` → `locations.address1`, `photos[]` → `yelp_businesses.images`).

4. Create test fixtures and automated checks.
   - Add `tests/fixtures/yelp_business_example.json` (recorded REST/GraphQL response) and a unit test `tests/yelp_graphql.spec.js` that asserts the mapping logic used in `api/index.js`.
   - Expand `api/test_yelp_graphql.js` to iterate a small seed list of Yelp ids (configurable via ENV) and write recordings to `tests/fixtures/` when `YELP_RECORD=true`.

5. Audit all callers and consumers.
   - Find code that expects `display_address` vs `address1` shapes and add normalization helpers in `api/lib/yelp_normalize.js` used by both REST and GraphQL proxies.

6. Ownership & telemetry.
   - Assign an owner to complete the Phase 1 audit (update `docs/IMPLEMENTATION_STATUS.md` with owner and ETA).
   - Add telemetry counters for GraphQL calls (latency, error counts, quota usage) in `api/yelp_graphql.js` so MCP can later surface quota cost to partners.

Deliverables for Phase 1 (done by end of Phase 1)
- `docs/YELP_AUDIT.md` (this file) — locations + field list + action items
- Updated `api/yelp_graphql.js` with retries/timeouts and robust error handling
- `api/lib/yelp_normalize.js` (new) — canonical mapping utilities
- Tests and fixtures under `tests/fixtures/` and `tests/yelp_graphql.spec.js`

Recommended immediate next steps (I can implement these):
1. Run `node api/test_yelp_graphql.js` locally to validate current query against Yelp and capture responses (requires `YELP_API_KEY`).
2. Patch `api/yelp_graphql.js` to add timeout and retry logic and a small logging wrapper.
3. Add `api/lib/yelp_normalize.js` and switch `api/index.js` to use it when mapping GraphQL/REST responses.

If you want, I can start with step 2 (add retries/timeouts to `api/yelp_graphql.js`) and step 3 (add `api/lib/yelp_normalize.js`) now — confirm and I'll apply the changes and run the test harness if you permit running HTTP calls from this environment.
