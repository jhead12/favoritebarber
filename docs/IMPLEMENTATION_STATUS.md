# Rate Your Barber - Implementation Status

## ✅ Completed

### Database Layer (Migrations 001-013)
- **Migration 001-011**: ✅ Applied (base schema + enrichment)
- **Migration 012**: ✅ Applied - User System Tables
  - `users` (email, username, password_hash, bio, profile_image_url)
  - `user_favorites` (user_id, shop_id, barber_id, notes)
  - `user_reviews` (user_id, shop_id, barber_id, rating, hairstyle_requested, price_paid, would_return)
  - `review_helpfulness` (user_id, review_id, is_helpful)
  - `barber_profiles` (barber_id, user_id, bio, specialty, years_experience, verified)
  - `search_history` (user_id, search_term, search_location, result_count)

- **Migration 013**: ✅ Applied - Review Scoring System
  - `review_scores` (review_id, rating_weight, helpfulness_score, detail_score, recency_score, user_reputation, total_score)
  - `barber_scores` (barber_id, user_rating_avg, user_review_count, yelp_rating, yelp_sentiment_avg, trust_score, would_return_percentage, trending)
  - View: `barber_detailed_info` (barber + shop info + scores + recent reviews)

### API Layer
- **User Model** (`api/models/user.js`): ✅ Implemented
  - `createUser(email, username, passwordHash)` 
  - `getUserById(userId)`, `getUserByEmail(email)`
  - `addFavorite(userId, shopId, barberId, notes)` - idempotent
  - `removeFavorite(userId, shopId, barberId)`
  - `getUserFavorites(userId)` - returns all favorites with shop/barber details
  - `createUserReview(userId, shopId, barberId, reviewData)` - creates review + computes score
  - `getBarberUserReviews(barberId, limit, offset)` - fetches reviews with scores
  - `getShopUserReviews(shopId, limit, offset)` - fetches shop reviews with scores
  - `markReviewHelpful(userId, reviewId, isHelpful)` - vote + update counts
  - `computeReviewScore(reviewId)` - multi-factor credibility score (0-100)
  - `computeBarberScore(barberId)` - aggregate barber scores
  - `searchUserReviews(shopId, searchTerm, limit)` - search reviews by hairstyle/keyword

- **User Routes** (`api/routes/users.js`): ✅ Implemented & Mounted
  - `GET /api/users/:userId/favorites` - Get user's bookmarks
  - `POST /api/users/:userId/favorites` - Add to favorites
  - `DELETE /api/users/:userId/favorites/:shopId` - Remove favorite
  - `POST /api/users/:userId/reviews` - Submit review (auto-triggers scoring)
  - `GET /api/users/:barberId/user-reviews` - Barber's reviews with scores
  - `GET /api/shops/:shopId/user-reviews` - Shop's reviews with scores
  - `POST /api/reviews/:reviewId/helpful` - Vote helpful/unhelpful
  - `GET /api/shops/:shopId/reviews/search` - Search reviews by keyword

### LLM Integration
- **Enrichment Worker**: ✅ Enhanced with shop name fallback
  - Fetches reviews with shop names (LEFT JOIN shops)
  - Falls back to shop name when barber name not extracted
  - Tested with 4 reviews (Budget Barbers, Downtown Barbershop)

### Documentation
- **USER_SYSTEM.md**: ✅ Comprehensive guide with scoring formulas, API examples, schema

---

## 🧪 Testing Summary

### Verified Endpoints (with test user `debbc985-7ec0-47ef-8e52-e6b1cfdde33f`)

1. **Add Favorite**
   ```bash
   POST /api/users/{userId}/favorites
   Body: {"shopId": 1, "barberId": 1, "notes": "Great cuts!"}
   Response: ✅ Saved favorite with ID 2
   ```

2. **Get Favorites**
   ```bash
   GET /api/users/{userId}/favorites
   Response: ✅ [{ id: 2, shop_id: 1, shop_name: "Budget Barbers", barber_id: 1, barber_name: "John" }]
   ```

3. **Create Review**
   ```bash
   POST /api/users/{userId}/reviews
   Body: { rating: 5, hairstyleRequested: "fade", pricePaid: 25, wouldReturn: true, ... }
   Response: ✅ Review created with auto-computed score (100.00)
   ```

4. **Get Barber Reviews**
   ```bash
   GET /api/users/1/user-reviews
   Response: ✅ [{ id: 1, rating: 5, text: "...", review_score: "100.00", helpful_count: 0 }]
   ```

---

## ⚙️ Technical Specs

### Review Credibility Scoring Formula
```
total_score = (
  helpfulness_score * 0.30 +      // % of "helpful" votes from users
  detail_score * 0.20 +           // Length + hairstyle + price info
  recency_score * 0.15 +          // Newer reviews score higher
  rating_weight * 0.20 +          // Star rating (1-5 normalized)
  user_reputation * 0.15          // User's history of helpful reviews
) / 100
```

### Barber Aggregate Score
```
trust_score = (
  user_rating_avg * 0.20 +
  yelp_rating * 0.20 +
  yelp_sentiment_avg * 0.30 +
  would_return_percentage / 5 +
  trending_boost
) / 100
```

### Database Relationships
```
users (1) ──→ (many) user_favorites ──→ (1) shops
             ├→ (1) barbers
             └→ (many) user_reviews ──→ (1) shops
                      ├→ (1) barbers
                      └→ (many) review_helpfulness

barbers (1) ──→ (many) shop_barbers ──→ (1) shops
         ├→ (1) barber_profiles
         └→ (many) user_reviews
         └→ (1) barber_scores
```

---

## 📋 Next Steps (Priority Order)

### Phase 1: Authentication (MVP)
- [ ] Password hashing (bcrypt)
- [ ] JWT token generation/verification
- [ ] Auth middleware for protected routes
- [ ] Login endpoint (`POST /api/auth/login`)
- [ ] Register endpoint (`POST /api/auth/register`)

### Phase 2: Frontend Integration
- [ ] Create favorites UI (add/remove buttons)
- [ ] Review submission form (rating, hairstyle, price, notes)
- [ ] Review list with helpfulness voting
- [ ] Barber profile page with aggregate scores
- [ ] Search results with user reviews

### Phase 3: Background Jobs
- [ ] Periodic review score recomputation
- [ ] Periodic barber score aggregation
- [ ] Trending calculation (30-day review velocity)
- [ ] Email notifications for new reviews

### Phase 4: Advanced Features
- [ ] Barber profile claiming/verification flow
- [ ] Image upload for reviews
- [ ] Photo moderation (Google Vision API)
- [ ] Booking system integration
- [ ] Messaging system between users and barbers

---

## 🚀 How to Run

### Start API Server
```bash
cd /Volumes/PRO-BLADE/Github/RateYourBarber
node api/index.js
# API listening on http://localhost:3000
```

### Test User Endpoints
```bash
# Create user (done manually for now, no registration endpoint yet)
PGPASSWORD=password psql -h localhost -U postgres -d rateyourbarber \
  -c "INSERT INTO users (email, username, password_hash) 
      VALUES ('user@example.com', 'testuser', 'hash') RETURNING id;"

# Get user's favorites
curl http://localhost:3000/api/users/{userId}/favorites

# Add favorite
curl -X POST http://localhost:3000/api/users/{userId}/favorites \
  -H "Content-Type: application/json" \
  -d '{"shopId": 1, "barberId": 1, "notes": "Great!"}'

# Submit review
curl -X POST http://localhost:3000/api/users/{userId}/reviews \
  -H "Content-Type: application/json" \
  -d '{"shopId": 1, "barberId": 1, "rating": 5, "hairstyleRequested": "fade", "pricePaid": 25, "wouldReturn": true, "title": "Great cut!", "text": "Highly recommended"}'

# Get barber's reviews
curl http://localhost:3000/api/users/{barberId}/user-reviews
```

---

## 📊 Data Example

### Sample Favorite
```json
{
  "id": 2,
  "shop_id": 1,
  "shop_name": "Budget Barbers",
  "barber_id": 1,
  "barber_name": "John",
  "notes": "Great cuts!",
  "saved_at": "2025-12-05T07:00:26.423Z"
}
```

### Sample Review with Score
```json
{
  "id": 1,
  "title": "Amazing barber!",
  "text": "John gave me the best fade I've ever had.",
  "rating": 5,
  "hairstyle_requested": "fade",
  "price_paid": "25.00",
  "would_return": true,
  "helpful_count": 0,
  "unhelpful_count": 0,
  "username": "testuser",
  "review_score": "100.00",
  "created_at": "2025-12-05T07:00:58.109Z"
}
```

---

## 🔧 Files Modified/Created

### New Files
- `api/migrations/012_add_user_system.sql` (140 lines)
- `api/migrations/013_add_review_scoring.sql` (100 lines)
- `api/models/user.js` (409 lines)
- `api/routes/users.js` (200 lines)
- `docs/USER_SYSTEM.md` (300 lines)

### Modified Files
- `api/index.js` - Added user routes mount
- `workers/enrichment_worker.js` - Added shop name fallback
- `workers/llm/review_parser.js` - Added shopName parameter

---

## 🐛 Known Issues / Design Notes

1. **No User Authentication Yet**: Registration/login endpoints not implemented. Users created manually via SQL for now.
2. **Password Hashing**: Currently storing plain `password_hash` - needs bcrypt implementation
3. **JWT Tokens**: Need to implement token generation and auth middleware
4. **Review Score Cache**: Scores computed on-demand, could benefit from materialized view or background job
5. **No Rate Limiting**: API endpoints could use rate limiting middleware
6. **No Pagination**: Review endpoints support limit/offset but frontend not yet implemented
7. **Foreign Key Relationship**: barbers connected to shops via `shop_barbers` join table (not direct shop_id)

---

## MCP Roadmap Decision

- **Prerequisite sequencing:** Complete Yelp GraphQL Phases 1–4 (audit, define GraphQL vs REST use-cases, prototype GraphQL client, update ingestion workers) before implementing the full MCP server. This ensures MCP exposes consistent, normalized data to both internal tools and external partners.
- **Rate-limit & telemetry ownership:** MCP will enforce partner-facing quotas and rate-limits only. Workers will remain independent for their ingestion traffic and internal telemetry; there is no shared Redis/OpenTelemetry infra between MCP and workers.
- **Design doc:** See `docs/MCP_DESIGN.md` for the MCP design overview, data-surface mapping (raw Yelp vs Postgres-enriched), auth scopes, and next technical tasks.


