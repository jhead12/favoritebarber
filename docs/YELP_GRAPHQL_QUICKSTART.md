# Yelp GraphQL Integration — Quick Start

## What Was Implemented

Complete Yelp GraphQL enrichment pipeline (Phases 3, 4, & 6):

### 1. Database Migration
- **File**: `api/migrations/028_add_yelp_graphql_fields.sql`
- **Columns added**: `price`, `hours`, `yelp_attribution`, `graphql_enriched`, `review_cursor`
- **Run**: `npm --prefix api run migrate`

### 2. GraphQL Client
- **File**: `api/yelp_graphql.js`
- **Exports**: 
  - `fetchBusinessDetails(yelpId)` — fetch business with hours/photos/categories
  - `fetchBusinessReviews(yelpId, opts)` — paginated reviews
- **Features**: Rate-limiting, circuit breaker, retry logic

### 3. Normalization
- **File**: `api/lib/yelp_normalize.js`
- **Functions**:
  - `mapGraphqlBusiness(business)` — normalize business data + hours/price
  - `mapGraphqlReviews(reviews)` — flatten reviews with user data

### 4. Worker Integration
- **File**: `workers/crawlers/yelp_fetcher.ts`
- **Function**: `enrichBusinessWithGraphql(yelpId)`
- **Features**: 
  - Feature flag controlled (`USE_YELP_GRAPHQL`)
  - Fallback to REST (`YELP_GRAPHQL_FALLBACK_TO_REST`)
  - Skip re-enrichment unless forced (`FORCE_YELP_REENRICH`)

### 5. Tests
- **File**: `tests/integration/test_yelp_graphql_flow.js`
- **Fixtures**: `tests/fixtures/yelp_graphql/`
- **Run**: `node tests/integration/test_yelp_graphql_flow.js`

## Environment Variables

Add to `.env`:

```bash
# GraphQL Feature Flags
USE_YELP_GRAPHQL=false              # Set to 'true' to enable GraphQL enrichment
FORCE_YELP_REENRICH=false           # Set to 'true' to re-enrich already enriched businesses
YELP_GRAPHQL_FALLBACK_TO_REST=true  # Fallback to REST if GraphQL fails

# GraphQL Client Config (optional, has defaults)
YELP_GRAPHQL_ENDPOINT=https://api.yelp.com/v3/graphql
YELP_GRAPHQL_TIMEOUT_MS=8000
YELP_GRAPHQL_RETRIES=2
```

## Usage

### Step 1: Apply Migration

```bash
npm --prefix api run migrate
```

### Step 2: Enable GraphQL (gradual rollout recommended)

```bash
# Start with GraphQL disabled (default)
USE_YELP_GRAPHQL=false npm --prefix workers start

# Enable for testing (small batch)
USE_YELP_GRAPHQL=true FORCE_YELP_REENRICH=false npm --prefix workers start
```

### Step 3: Test a Single Business

```javascript
const { enrichBusinessWithGraphql } = require('./workers/crawlers/yelp_fetcher');

// Enrich a specific business
await enrichBusinessWithGraphql('yelp-business-id-here');
```

### Step 4: Verify Data

```sql
-- Check enriched businesses
SELECT yelp_id, name, price, hours, graphql_enriched, review_cursor 
FROM yelp_businesses 
WHERE graphql_enriched = true;

-- Check reviews with user data
SELECT source_id, user_display, rating, text, raw_json->'user'->>'name' as external_user
FROM reviews 
WHERE source = 'yelp' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Rollout Plan

1. **Deploy with flag OFF** (`USE_YELP_GRAPHQL=false`) — verify no regressions
2. **Enable for 10-50 businesses** — validate data quality, check quotas
3. **Monitor telemetry** — check cost tracker logs for GraphQL vs REST usage
4. **Gradual increase** — expand to more businesses
5. **Enable pagination** — fetch all reviews for high-volume businesses

## Troubleshooting

### GraphQL query fails
- Check `YELP_API_KEY` is valid
- Verify GraphQL endpoint is reachable
- Check circuit breaker status in logs
- Enable fallback: `YELP_GRAPHQL_FALLBACK_TO_REST=true`

### Quota exhaustion
- Review cost tracker logs: `api/lib/costTracker.js`
- Check Redis quota counter: `yelp:quota:*`
- GraphQL and REST share the same quota pool

### Missing fields
- Verify GraphQL query includes required fields
- Check normalizer handles null/undefined fields
- Review raw_data column in yelp_businesses table

## Next Steps

- [ ] Complete Yelp GraphQL Phase 7 (end-to-end integration tests with real API)
- [ ] Add monitoring/alerts for GraphQL quota usage
- [ ] Implement review pagination cursor logic
- [ ] Add retry logic for partial failures
- [ ] Create admin dashboard to view enrichment status
