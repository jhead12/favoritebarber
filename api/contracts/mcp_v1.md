# MCP API v1 Documentation

## Overview

The Model Context Protocol (MCP) API provides partner access to RateYourBarber's barber profiles, reviews, and discovery services. All endpoints require Bearer token authentication.

**Base URL**: `https://api.rateyourbarber.com/api/mcp` (production)  
**Base URL**: `http://localhost:3000/api/mcp` (development)

## Authentication

All MCP requests require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer ryb_live_abc123xyz456
```

API keys are prefixed:
- `ryb_test_` - Test/sandbox environment
- `ryb_live_` - Production environment

Contact admin@rateyourbarber.com to request API access.

## Rate Limits

| Tier | Requests/minute | Requests/day | Price |
|------|----------------|--------------|-------|
| Free | 60 | 10,000 | $0 |
| Partner | 300 | 50,000 | $299/mo |
| Enterprise | Custom | Custom | Contact us |

Rate limit headers are included in every response:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1702857600
```

## Scopes

API keys are granted specific scopes:

- `read:barbers` - Read barber profiles
- `read:reviews` - Read barber reviews
- `read:live_yelp` - Access live Yelp data proxy
- `write:discover` - Enqueue social discovery jobs
- `write:webhooks` - Manage webhook subscriptions

## Endpoints

### Health Check

**GET** `/health`

Check API status.

```bash
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.rateyourbarber.com/api/mcp/health
```

Response:
```json
{
  "ok": true,
  "time": "2025-12-16T10:30:00.000Z",
  "partner": 123
}
```

---

### List Barbers

**GET** `/barbers`

Retrieve a paginated list of barber profiles.

**Scope**: `read:barbers`

**Query Parameters**:
- `limit` (integer, max 100): Results per page (default: 50)
- `offset` (integer): Pagination offset (default: 0)

```bash
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://api.rateyourbarber.com/api/mcp/barbers?limit=10&offset=0"
```

Response:
```json
{
  "results": [
    {
      "id": 42,
      "name": "Mike's Barbershop",
      "trust_score": 87.5,
      "primary_location": "San Francisco, CA",
      "thumbnail_url": "https://...",
      "top_tags": ["fade", "beard trim"],
      "price": "$$"
    }
  ]
}
```

---

### Enqueue Discovery Job

**POST** `/discover`

Enqueue a background job to scrape social profiles for a shop/barber.

**Scope**: `write:discover`

**Body Parameters**:
- `shop_name` (string): Shop or barber name
- `location_text` (string, optional): Location hint
- `yelp_business_id` (string, optional): Yelp business ID

At least one of `shop_name` or `yelp_business_id` is required.

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "shop_name": "Mikes Barbershop",
    "location_text": "San Francisco, CA"
  }' \
  https://api.rateyourbarber.com/api/mcp/discover
```

Response (202 Accepted):
```json
{
  "job_id": 123,
  "status": "pending",
  "message": "Discovery job enqueued",
  "_links": {
    "status": "/api/mcp/discover/123"
  }
}
```

---

### Check Discovery Job Status

**GET** `/discover/:id`

Check the status of a discovery job.

**Scope**: `write:discover`

```bash
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.rateyourbarber.com/api/mcp/discover/123
```

Response:
```json
{
  "job_id": 123,
  "status": "completed",
  "shop_name": "Mikes Barbershop",
  "yelp_business_id": null,
  "attempts": 1,
  "result": {
    "business": {...},
    "external": ["https://instagram.com/..."],
    "results": [...]
  },
  "last_error": null,
  "created_at": "2025-12-16T10:00:00.000Z",
  "updated_at": "2025-12-16T10:05:00.000Z"
}
```

**Job statuses**: `pending`, `in_progress`, `completed`, `failed`

---

### Live Yelp Proxy

**GET** `/live_yelp/:id`

Fetch live business data directly from Yelp GraphQL.

**Scope**: `read:live_yelp`

**Note**: Requires `MCP_ENABLE_LIVE_YELP=true` environment flag.

```bash
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.rateyourbarber.com/api/mcp/live_yelp/mikes-barbershop-sf
```

Response:
```json
{
  "business": {
    "id": "mikes-barbershop-sf",
    "name": "Mike's Barbershop",
    "rating": 4.5,
    "photos": [...],
    "hours": [...]
  },
  "source": "yelp_graphql",
  "cached": false
}
```

---

### Enrich Reviews

**GET** `/enrich/reviews`

Run LLM enrichment on reviews (sentiment, name extraction, summarization).

**Scope**: `read:reviews`

**Query Parameters**:
- `barber_id` (integer): Barber ID
- `shop_id` (integer): Shop ID (alternative to barber_id)
- `limit` (integer, max 50): Number of reviews to enrich (default: 5)

```bash
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://api.rateyourbarber.com/api/mcp/enrich/reviews?barber_id=42&limit=10"
```

Response:
```json
{
  "count": 10,
  "results": [
    {
      "review_id": 789,
      "barber_id": 42,
      "created_at": "2025-12-10T12:00:00.000Z",
      "rating": 5,
      "names": ["Mike", "Tony"],
      "sentiment": 0.95,
      "summary": "Excellent fade and friendly service"
    }
  ]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable error description"
}
```

**Common error codes**:
- `missing_auth` - No Authorization header
- `invalid_key` - Invalid or revoked API key
- `insufficient_scope` - Key lacks required scope
- `rate_limit_exceeded` - Too many requests
- `quota_exceeded` - Daily quota exhausted
- `internal_error` - Server error

---

## Webhooks (Coming Soon)

Subscribe to events like `discovery.completed`, `review.created`, etc.

Contact support for early access.

---

## Support

- **Documentation**: https://docs.rateyourbarber.com/mcp
- **Email**: mcp-support@rateyourbarber.com
- **Status Page**: https://status.rateyourbarber.com
