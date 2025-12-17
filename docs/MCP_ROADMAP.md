# MCP Roadmap — Partner Strategy & Implementation Plan

**Last Updated**: December 2025  
**Status**: Planning phase (pre-implementation)  
**Prerequisites**: Complete Yelp GraphQL Phases 1-4, stabilize LLM enrichment

---

## Executive Summary

The Model Context Protocol (MCP) server will expose RateYourBarber's enriched barber data to external partners through a secure, rate-limited API. This document defines partner personas, revenue model, API surface, authentication strategy, and rollout plan.

---

## Partner Personas & Use Cases

### Persona 1: Independent Barber Apps
**Profile**: Small mobile apps (iOS/Android) helping users find nearby barbers

**Use Cases**:
- Search barbers by location and filter by ratings/price
- Display barber profiles with photos, reviews, hours
- Show trust scores and verified badges
- Embed review sentiment analysis

**API Needs**:
- `GET /mcp/v1/barbers/search` - Location-based search
- `GET /mcp/v1/barbers/:id` - Profile details
- `GET /mcp/v1/barbers/:id/reviews` - Review feed with sentiment
- `GET /mcp/v1/barbers/:id/images` - Portfolio photos

**Business Value**: Expand reach to mobile users, collect usage data, potential upsell to Premium

### Persona 2: Salon Management Software
**Profile**: B2B SaaS platforms (Vagaro, Booker, StyleSeat integrations)

**Use Cases**:
- Sync external reviews into barber dashboards
- Display competitor benchmarking (how barbershop ranks vs. nearby shops)
- Sentiment trend analysis for shop owners
- Export review data for marketing materials

**API Needs**:
- `GET /mcp/v1/shops/:id/analytics` - Aggregate metrics
- `GET /mcp/v1/shops/:id/competitors` - Nearby shop comparison
- `GET /mcp/v1/reviews/export` - Bulk review export (CSV/JSON)
- Webhook support for new review notifications

**Business Value**: High-value B2B partnerships, recurring revenue, data network effects

### Persona 3: Research & Analytics Platforms
**Profile**: Market research firms, data aggregators (Yelp competitors, local SEO tools)

**Use Cases**:
- Bulk data access for market trend analysis
- Historical review sentiment tracking
- Barbershop density mapping (geo-analytics)
- Competitor intelligence feeds

**API Needs**:
- `GET /mcp/v1/analytics/trends` - Aggregate sentiment/rating trends
- `GET /mcp/v1/analytics/geo` - Geographic barber density
- Bulk export APIs (paginated, rate-limited)
- Historical data access (time-series queries)

**Business Value**: High-margin data licensing, academic/research partnerships

### Persona 4: Internal Tools (First-party)
**Profile**: RateYourBarber's own web frontend, admin dashboard, mobile app

**Use Cases**:
- Consistent API for web/mobile clients
- Admin moderation tools (spam review flagging)
- Internal analytics dashboards
- A/B testing infrastructure

**API Needs**:
- Full API surface (no rate limits for internal)
- Admin-only endpoints (moderation, user management)
- Real-time data (bypass caching when needed)

**Business Value**: Unified API surface, easier frontend development, consistent data contracts

---

## API Surface Design

### Core Endpoints (All Partners)

#### Barber Search & Discovery
```
GET /mcp/v1/barbers/search?lat=40.7128&lon=-74.0060&radius=5000&limit=20
GET /mcp/v1/barbers/nearby?zip=10001&radius=5000
GET /mcp/v1/barbers/:id
GET /mcp/v1/barbers/:id/reviews?page=1&limit=50
GET /mcp/v1/barbers/:id/images?type=portfolio
```

#### Shop/Location Endpoints
```
GET /mcp/v1/shops/:id
GET /mcp/v1/shops/search?city=Brooklyn&state=NY
GET /mcp/v1/shops/:id/barbers
```

#### Analytics & Aggregates
```
GET /mcp/v1/analytics/trends?region=NYC&timeframe=30d
GET /mcp/v1/analytics/top-barbers?city=Brooklyn&limit=10
```

### Premium Endpoints (Partner Tier)

#### Live Yelp Data (Opt-in, extra audit required)
```
GET /mcp/v1/live/barbers/:yelp_id
GET /mcp/v1/live/businesses/:yelp_id/hours
```

#### Bulk Export (Research tier)
```
GET /mcp/v1/export/reviews?start_date=2025-01-01&end_date=2025-12-31
GET /mcp/v1/export/barbers?region=NYC
```

#### Webhooks (Partner tier)
```
POST /mcp/v1/webhooks/subscribe
DELETE /mcp/v1/webhooks/:id
```
Events: `review.created`, `barber.verified`, `trust_score.updated`

### Internal-Only Endpoints

#### Admin & Moderation
```
POST /mcp/v1/admin/reviews/:id/flag
PUT /mcp/v1/admin/barbers/:id/verify
GET /mcp/v1/admin/partners
POST /mcp/v1/admin/partners/:id/quota
```

---

## Authentication Model

### API Key-Based Auth (Primary)

**Implementation**:
- Partners receive API keys on approval: `ryb_live_abc123xyz456`
- Keys passed via header: `Authorization: Bearer ryb_live_abc123xyz456`
- Keys stored in `mcp_partners` table with scopes and quotas

**Key Scopes**:
```json
{
  "partner_id": "partner_xyz",
  "scopes": [
    "read:barbers",
    "read:reviews",
    "read:analytics",
    "read:live_yelp"  // Premium scope
  ],
  "tier": "partner",
  "quota": {
    "requests_per_minute": 300,
    "requests_per_day": 50000
  }
}
```

### OAuth 2.0 (Future, for user-facing integrations)

**Use Case**: When partners need to act on behalf of RateYourBarber users (e.g., barber claiming profile via partner app)

**Flow**:
1. Partner redirects user to RateYourBarber OAuth consent screen
2. User approves scopes (`profile:read`, `profile:manage`)
3. Partner receives access token with user context
4. Token used for user-scoped operations (claim profile, upload photos)

**Scopes**:
- `profile:read` - Read user's claimed barber profiles
- `profile:manage` - Edit barber profile (after claim approval)
- `reviews:read` - Read user's own review history
- `reviews:write` - Submit reviews on behalf of user

**Status**: Not implementing in Phase 1 (API key auth sufficient for initial partners)

---

## Rate Limits & Quotas

### Tier Structure

| Tier | Requests/Min | Requests/Day | Live Yelp Access | Webhooks | Price |
|------|--------------|--------------|------------------|----------|-------|
| **Free** | 60 | 10,000 | ❌ | ❌ | $0 |
| **Partner** | 300 | 50,000 | ✅ (audit required) | ✅ | $299/mo |
| **Enterprise** | 1,000 | 500,000 | ✅ | ✅ | Custom |
| **Internal** | Unlimited | Unlimited | ✅ | ✅ | N/A |

### Rate Limit Headers (Return on every response)
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1703001234
X-RateLimit-Quota-Day: 50000
X-RateLimit-Quota-Used: 12345
```

### Quota Enforcement
- **Soft limit** (90% quota): Log warning, send email to partner
- **Hard limit** (100% quota): Return `429 Too Many Requests` with `Retry-After` header
- **Burst protection**: Allow short bursts up to 2x rate for <10 seconds
- **Grace period**: 24-hour grace on first quota violation (notification only)

### Cost Tracking
- Track Yelp API costs per partner (live-Yelp endpoints only)
- Charge back high-cost partners if quota exceeded
- Log all Yelp GraphQL calls with `partner_id` for billing reconciliation

---

## Revenue Model

### Phase 1: Freemium → Paid Conversion
- **Free tier**: Attract developers, indie apps (10k req/day)
- **Partner tier**: $299/mo for production apps (50k req/day, webhooks)
- **Enterprise tier**: Custom pricing for high-volume partners (Vagaro, Booker)

### Phase 2: Data Licensing
- **Research tier**: Bulk historical data exports ($1,000+/dataset)
- **White-label API**: Full-database access for large aggregators ($5k+/mo)

### Phase 3: Revenue Sharing
- **Barber booking referrals**: Commission on appointments booked via partner apps
- **Premium profile upgrades**: Partners upsell verified badges, boost visibility

---

## Telemetry & Monitoring

### Metrics to Track (Per Partner)

**Request Metrics**:
- `mcp_requests_total{partner_id, endpoint, status_code}`
- `mcp_request_duration_ms{partner_id, endpoint, p50/p95/p99}`
- `mcp_quota_remaining{partner_id, tier}`

**Yelp Proxy Metrics** (Live-Yelp endpoints only):
- `mcp_yelp_calls_total{partner_id, yelp_endpoint}`
- `mcp_yelp_cost_usd{partner_id}` (estimated based on GraphQL query complexity)
- `mcp_yelp_errors_total{partner_id, error_type}`

**Business Metrics**:
- Daily Active Partners (DAP)
- Monthly Active Partners (MAP)
- Quota utilization % (partners hitting limits)
- Revenue per partner (Partner/Enterprise tiers)

### Alerting Thresholds
- Partner exceeds 90% of daily quota → Email notification
- Partner makes >100 Yelp live calls/hour → Alert ops team
- Partner hits rate limit >10x/day → Auto-review tier assignment
- MCP error rate >5% → Page on-call engineer

### Logging Strategy
- **Structured logs** (JSON) to stdout/CloudWatch/Datadog
- **Correlation IDs**: `X-Request-ID` header for tracing across services
- **PII redaction**: Never log user emails, API keys, or review content (log IDs only)

### Storage & Retention
- **Partner request logs**: Store in `mcp_request_logs` table (30-day retention)
- **Quota usage**: Aggregate daily, store in `mcp_quota_usage` (1-year retention)
- **Billing data**: Archive monthly reports to S3 (7-year retention)

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3) ✅ Prerequisites
- [x] Complete Yelp GraphQL Phases 1-4 (audit, client, worker integration)
- [x] Stabilize LLM enrichment (multi-provider support working)
- [ ] Database migration for MCP tables (`mcp_partners`, `mcp_api_keys`, `mcp_request_logs`)
- [ ] Create `docs/MCP_ROADMAP.md` (this document)

### Phase 2: Core MCP Server (Weeks 4-6)
- [ ] Implement MCP authentication middleware (`api/middleware/mcpAuth.js`)
- [ ] Implement MCP rate limiter with Redis (`api/lib/mcpRateLimiter.js`)
- [ ] Create core endpoints (`api/routes/mcp.js`):
  - Barber search, barber details, reviews
- [ ] Add telemetry hooks (`api/lib/mcpTelemetry.js`)
- [ ] Write API contract docs (`api/contracts/mcp_v1.md`)

### Phase 3: Partner Management (Weeks 7-8)
- [ ] Admin API for partner CRUD (`api/routes/admin/partners.js`)
- [ ] API key generation and rotation
- [ ] Quota management UI (web admin dashboard)
- [ ] Partner onboarding flow (self-service signup for Free tier)

### Phase 4: Advanced Features (Weeks 9-12)
- [ ] Live-Yelp proxy endpoints (`api/routes/mcp_live_yelp.js`)
- [ ] Webhook system (`api/lib/webhooks.js`)
- [ ] Bulk export endpoints for Research tier
- [ ] Partner analytics dashboard (usage graphs, quota trends)

### Phase 5: Scale & Optimize (Weeks 13+)
- [ ] Load testing (1000 concurrent partner requests)
- [ ] CDN caching for high-traffic endpoints (CloudFront/Fastly)
- [ ] GraphQL API option (alternative to REST)
- [ ] OAuth 2.0 implementation for user-scoped access

---

## Partner Onboarding Flow

### Self-Service (Free Tier)
1. Developer visits `https://rateyourbarber.com/developers`
2. Signs up with email, creates account
3. Clicks "Create API Key" → generates `ryb_test_...` key
4. Views quickstart guide with cURL examples
5. Makes first API call, sees data flowing
6. Upgrades to Partner tier when hitting 10k req/day limit

### Manual Approval (Partner/Enterprise Tiers)
1. Developer fills out partnership form:
   - Company name, use case, expected volume
   - Requests `read:live_yelp` scope (if needed)
2. RateYourBarber team reviews application (1-2 business days)
3. Approves and provisions Partner tier key
4. Sends onboarding email with:
   - Production API key (`ryb_live_...`)
   - Rate limits and quota allocation
   - Billing details (invoiced monthly)
   - Technical contact for support
5. Partner integrates, goes live

---

## Security & Compliance

### API Key Security
- Keys prefixed by environment: `ryb_test_...` (sandbox), `ryb_live_...` (production)
- Keys hashed before storage (bcrypt) — only show once on generation
- Support key rotation (generate new key, deprecate old key with 30-day overlap)
- Auto-revoke keys unused for >90 days (notify partner first)

### Scope Enforcement
- Middleware validates scopes before executing endpoint logic
- Return `403 Forbidden` if partner lacks required scope
- Log all scope violations for audit trail

### Attribution & Terms of Service
- All API responses include `data_sources: ["yelp", "rateyourbarber_enrichment"]`
- Partners must display Yelp attribution if using live-Yelp data
- Terms of Service agreement required before API access
- Prohibit reselling raw data to competitors

### Abuse Prevention
- Block known scraper IPs (rate-limited separately from partner quotas)
- Detect unusual patterns (same endpoint called 1000x/sec)
- Temporary ban (24h) for repeated quota violations
- Permanent ban for TOS violations (scraped data resale, PII leaks)

---

## Testing Strategy

### Unit Tests
```javascript
// tests/mcp/test_auth.js
describe('MCP Authentication', () => {
  test('should validate valid API key', async () => {
    const req = { headers: { authorization: 'Bearer ryb_test_valid' } };
    const result = await mcpAuth(req);
    expect(result.partner_id).toBe('test_partner');
  });

  test('should reject invalid API key', async () => {
    const req = { headers: { authorization: 'Bearer invalid' } };
    await expect(mcpAuth(req)).rejects.toThrow('Invalid API key');
  });
});

// tests/mcp/test_rate_limit.js
describe('MCP Rate Limiting', () => {
  test('should allow requests within quota', async () => {
    const result = await rateLimiter.check('partner_xyz', 'free');
    expect(result.allowed).toBe(true);
  });

  test('should block requests exceeding quota', async () => {
    // Make 61 requests (free tier = 60 req/min)
    for (let i = 0; i < 61; i++) {
      await rateLimiter.check('partner_xyz', 'free');
    }
    const result = await rateLimiter.check('partner_xyz', 'free');
    expect(result.allowed).toBe(false);
    expect(result.retry_after).toBeGreaterThan(0);
  });
});
```

### Integration Tests
```bash
# Test full MCP flow (auth → rate-limit → endpoint → response)
node tests/integration/test_mcp_flow.js

# Test Yelp proxy with recorded fixtures
node tests/integration/test_mcp_live_yelp.js
```

### Load Tests
```bash
# Simulate 100 concurrent partners making requests
k6 run tests/load/mcp_load_test.js

# Expected: <200ms p95 latency, 0% error rate
```

---

## Success Metrics (6-Month Goals)

### Adoption Metrics
- **50 Free tier partners** signed up
- **10 Partner tier partners** paying $299/mo
- **2 Enterprise partnerships** (Vagaro, Booker negotiations)

### Technical Metrics
- **99.9% API uptime** (excluding Yelp outages)
- **<100ms p95 latency** for DB-backed endpoints
- **<5% partner churn** (renewals >95%)

### Revenue Metrics
- **$3,000 MRR** from Partner tier ($299 x 10 partners)
- **$10,000** from Enterprise contracts (year 1)
- **$5,000** from data licensing (research tier)

---

## Risk Mitigation

### Risk 1: Yelp API Quota Exhaustion
**Scenario**: Partner makes excessive live-Yelp calls, exhausts daily quota

**Mitigation**:
- Track Yelp cost per partner, alert at 70% quota
- Auto-disable live-Yelp for partners exceeding budget
- Cache Yelp responses (24h TTL) to reduce repeat calls

### Risk 2: Partner Abuse (Data Scraping)
**Scenario**: Partner reverse-engineers API, scrapes entire database

**Mitigation**:
- Rate limit all endpoints aggressively (burst protection)
- Pagination limits (max 100 results per page)
- IP-based blocking for known scrapers
- TOS violation → immediate API key revocation

### Risk 3: Revenue Model Failure
**Scenario**: No partners willing to pay $299/mo

**Mitigation**:
- Start with generous Free tier to validate demand
- Conduct user interviews with first 10 Free partners
- Adjust pricing based on feedback (maybe $99/mo sweet spot)
- Offer annual discounts (20% off for yearly commit)

---

## Next Steps (Immediate Actions)

1. **Create database migration** for MCP tables:
   ```bash
   npm run migrate # Apply migration 029 (MCP schema)
   ```

2. **Implement core MCP routes**:
   ```bash
   # Create api/routes/mcp.js with barber search, details, reviews
   npm run dev:api
   ```

3. **Test with first partner** (internal):
   ```bash
   # Generate test API key, make sample requests
   curl -H "Authorization: Bearer ryb_test_..." \
     https://localhost:3000/mcp/v1/barbers/search?lat=40.7128&lon=-74.0060
   ```

4. **Write API documentation**:
   ```bash
   # Create api/contracts/mcp_v1.md with endpoint specs
   ```

5. **Deploy to staging**:
   ```bash
   # Monitor telemetry, verify rate limits work
   ```

---

## Questions for Product/Business Team

1. **Pricing validation**: Is $299/mo realistic for salon management software partners?
2. **Enterprise partnerships**: Should we proactively reach out to Vagaro, Booker, StyleSeat?
3. **Free tier abuse**: Should we require credit card for Free tier signup (prevent spam accounts)?
4. **Data licensing**: Are there legal/compliance concerns with selling bulk review data?
5. **Yelp terms**: Does proxying live-Yelp data violate Yelp TOS? (Legal review needed)

---

## Appendix: Example API Request/Response

### Search Barbers by Location

**Request**:
```bash
curl -X GET "https://api.rateyourbarber.com/mcp/v1/barbers/search?lat=40.7128&lon=-74.0060&radius=5000&limit=10" \
  -H "Authorization: Bearer ryb_live_abc123xyz456" \
  -H "Accept: application/json"
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 123,
      "name": "Marcus Johnson",
      "shop": {
        "id": 45,
        "name": "Crown Cuts Barbershop",
        "address": "123 Main St, Brooklyn, NY 11201"
      },
      "trust_score": 87.5,
      "verified": true,
      "rating_avg": 4.8,
      "review_count": 342,
      "specialties": ["fades", "designs", "beard_trim"],
      "distance_meters": 1200,
      "image_url": "https://cdn.rateyourbarber.com/barbers/123/profile.jpg"
    }
  ],
  "meta": {
    "total": 47,
    "page": 1,
    "limit": 10,
    "data_sources": ["rateyourbarber", "yelp_enriched"]
  },
  "rate_limit": {
    "limit": 300,
    "remaining": 287,
    "reset": 1703001234,
    "quota_day": 50000,
    "quota_used": 12345
  }
}
```

**Error Response** (429 Too Many Requests):
```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "You have exceeded your rate limit of 300 requests per minute.",
    "retry_after": 42,
    "quota_reset": "2025-12-17T00:00:00Z"
  }
}
```

---

**Document Version**: 1.0  
**Last Reviewed**: December 16, 2025  
**Next Review**: After Phase 2 completion (Week 6)
