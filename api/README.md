API notes

Podman notes

If you're using Podman locally you can run the full stack with:

	podman compose up --build

This repo requires Podman for local compose-based development. Use the Makefile helpers (which expect Podman):

	make up
	make migrate
	make seed

Run migrations: `node migrate.js` (requires `DATABASE_URL` in env)
Seed sample data: `node seed.js`
Start dev server: `npm run dev`

## Environment Variables

The API expects the following environment variables (see `.env.example`):

- `DATABASE_URL` — Postgres connection string
- `YELP_API_KEY` — Yelp API access token
- `LOG_LEVEL` — Logger verbosity (debug, info, warn, error)
- `SENTRY_DSN` — Optional error tracking DSN
- Feature flags:
	- `USE_YELP_GRAPHQL` — Toggle GraphQL enrichment path
	- `ENABLE_COST_TRACKING` — Emit cost/quota logs

## Observability baseline
- Structured logs with correlation IDs via `api/lib/logger.js`
- Circuit breaker for external calls in `api/lib/circuitBreaker.js`
- Cost/quota tracking in `api/lib/costTracker.js`
