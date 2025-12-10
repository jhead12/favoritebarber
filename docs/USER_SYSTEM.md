# User System & Review Scoring

## Overview

The hybrid approach combines Yelp data with user-generated content, creating a comprehensive barber rating ecosystem:

```
Yelp Data (External)
├─ Shop info, photos, reviews
└─ Updated weekly via fetcher

User System (Local)
├─ Favorites / bookmarks
├─ User-generated reviews (scored)
├─ Review helpfulness voting
└─ Barber profiles (claimed)

Scoring Engine
├─ Individual review credibility scores
└─ Aggregate barber trust scores
```

---

## User Favorites

Users can bookmark their favorite barbers and shops for quick access.

### Add to Favorites

```bash
POST /api/users/{userId}/favorites

{
  "shopId": 123,
  "barberId": 456,        // optional
  "notes": "Great fades"  // optional
}

# Response
{
  "success": true,
  "favorite": {
    "id": 789,
    "user_id": "uuid",
    "shop_id": 123,
    "barber_id": 456,
    "saved_at": "2024-12-04T20:30:00Z"
  }
}
```

### Get Favorites

```bash
GET /api/users/{userId}/favorites

# Response
{
  "success": true,
  "favorites": [
    {
      "id": 789,
      "shop_id": 123,
      "shop_name": "Classic Cuts",
      "address": "123 Main St",
      "barber_id": 456,
      "barber_name": "Tony",
      "specialty": "Fades",
      "saved_at": "2024-12-04T20:30:00Z"
    }
  ]
}
```

### Remove from Favorites

```bash
DELETE /api/users/{userId}/favorites/{shopId}

{
  "barberId": 456  // optional - remove specific barber or all
}
```

---

## User-Generated Reviews

Users who found their favorite barber can write scored reviews.

### Create Review

```bash
POST /api/users/{userId}/reviews

{
  "shopId": 123,
  "barberId": 456,
  "title": "Amazing fade",
  "text": "Tony gave me the best fade I've ever had! Very clean and professional.",
  "rating": 5,
  "hairstyleRequested": "fade",
  "pricePaid": 25.00,
  "wouldReturn": true
}

# Response
{
  "success": true,
  "review": {
    "id": 999,
    "user_id": "uuid",
    "shop_id": 123,
    "barber_id": 456,
    "rating": 5,
    "created_at": "2024-12-04T20:35:00Z"
  }
}
```

### Get Reviews for Barber

```bash
GET /api/users/{barberId}/user-reviews?limit=20&offset=0

# Response
{
  "success": true,
  "reviews": [
    {
      "id": 999,
      "title": "Amazing fade",
      "text": "Tony gave me the best fade...",
      "rating": 5,
      "hairstyle_requested": "fade",
      "price_paid": 25.00,
      "would_return": true,
      "username": "john_doe",
      "review_score": 92,              // Credibility score
      "helpfulness_percent": 88.5,
      "created_at": "2024-12-04T20:35:00Z"
    }
  ]
}
```

### Get Reviews for Shop

```bash
GET /api/shops/{shopId}/user-reviews?limit=20&offset=0

# Response: same format, with barber_name included
```

---

## Review Scoring System

Each user review gets a **credibility score (0-100)** based on multiple factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Rating Quality** | 20 | Is rating consistent with review text? |
| **Helpfulness** | 30 | How many users found it helpful/unhelpful? |
| **Detail Level** | 20 | Length, hairstyle mentioned, price included? |
| **Recency** | 15 | Recent reviews weighted higher |
| **User Reputation** | 15 | User's history of helpful reviews |

### Scoring Formula

```
Review Score = (
  (helpful_votes / total_votes) * 30 +        // Helpfulness
  (detail_points) * 20 +                       // Detail level
  (recency_points) * 15 +                      // Recency
  (rating * 20) / 5 +                          // Rating weight
  (user_reputation) * 15                       // User credibility
)
```

### Example Scores

```
Review A: "Tony is amazing!" (5 stars)
├─ Short text (5 detail points)
├─ 2 helpful, 0 unhelpful (100 helpful %)
├─ Posted 1 day ago (20 recency points)
└─ Score: ~72/100 (Good, but lacks detail)

Review B: "Got a fade from Tony on 12/1. Great technique, very clean. Paid $25. Would definitely return!"
├─ Detailed text, hairstyle + price mentioned (20 detail points)
├─ 45 helpful, 2 unhelpful (95.7 helpful %)
├─ Posted 3 days ago (20 recency points)
└─ Score: ~94/100 (Excellent - detailed, helpful, recent)
```

---

## Helpfulness Voting

Users vote if reviews were helpful, influencing the review's credibility score.

### Vote Helpful

```bash
POST /api/reviews/{reviewId}/helpful

{
  "userId": "uuid",
  "isHelpful": true     // true = helpful, false = not helpful
}

# Response
{
  "success": true,
  "message": "Helpful vote recorded"
}
```

---

## Barber Aggregate Scores

System automatically computes **barber trust scores** from:
- Yelp reviews (rating, sentiment)
- User reviews (rating, helpfulness)
- Hairstyles completed
- Trending (recent activity)

### Barber Score Components

```sql
trust_score = (
  user_rating_avg * 20 +          -- User review ratings
  yelp_rating * 20 +              -- Yelp review ratings
  yelp_sentiment_avg * 30 +       -- Yelp review sentiment
  (would_return_percentage / 5) + -- Users would return
  (recent_reviews_count > 3 ? 15 : 0)  -- Trending boost
)
-- Score range: 0-100
```

### View Barber Detailed Info

```sql
SELECT * FROM barber_detailed_info WHERE id = 456;

-- Returns:
-- ├─ Basic info (name, shop, specialty, bio)
-- ├─ Trust score (0-100)
-- ├─ User rating average
-- ├─ Would return percentage
-- ├─ Yelp rating + count
-- ├─ Trending status
-- └─ Recent review count
```

---

## Search User Reviews by Hairstyle

Find reviews for specific hairstyles.

```bash
GET /api/shops/{shopId}/reviews/search?q=fade&limit=20

# Response
{
  "success": true,
  "results": [
    {
      "id": 999,
      "title": "Best fade in SF",
      "text": "Tony nailed my fade...",
      "hairstyle_requested": "fade",
      "barber_name": "Tony",
      "review_score": 92,
      "created_at": "2024-12-04..."
    }
  ]
}
```

---

## Database Schema

### Tables

```
users
├─ id (UUID)
├─ email (unique)
├─ username (unique)
├─ password_hash
├─ profile_image_url
├─ bio
└─ created_at

user_favorites
├─ id
├─ user_id (FK users)
├─ shop_id (FK shops)
├─ barber_id (FK barbers, nullable)
├─ notes
└─ saved_at

user_reviews
├─ id
├─ user_id (FK users)
├─ shop_id (FK shops)
├─ barber_id (FK barbers, nullable)
├─ title
├─ text
├─ rating (1-5)
├─ hairstyle_requested
├─ price_paid
├─ would_return
├─ helpful_count
├─ unhelpful_count
├─ published
├─ created_at
└─ updated_at

review_scores
├─ id
├─ review_id (FK user_reviews)
├─ rating_weight
├─ helpfulness_score
├─ detail_score
├─ recency_score
├─ user_reputation
├─ total_score (0-100)
└─ computed_at

barber_scores
├─ id
├─ barber_id (FK barbers)
├─ user_rating_avg
├─ user_review_count
├─ yelp_rating
├─ yelp_review_count
├─ yelp_sentiment_avg
├─ trust_score (0-100)
├─ would_return_percentage
├─ recent_reviews_count
├─ trending
└─ computed_at

review_helpfulness
├─ id
├─ user_id (FK users)
├─ review_id (FK user_reviews)
├─ is_helpful
└─ voted_at
```

### Views

```
user_reviews_with_scores
└─ Combines reviews + users + scores with helpfulness %

barber_detailed_info
└─ Full barber profile with all scores and stats
```

---

## Data Flow

```
User searches for barbers
  ↓
API returns shops + Yelp reviews + User reviews (scored)
  ↓
User clicks favorite barber
  ↓
User writes review + rating
  ↓
System computes review credibility score
  ↓
System updates barber aggregate trust score
  ↓
Other users see scored review + vote helpful/unhelpful
  ↓
Review score updates, barber score recalculated
  ↓
Next search shows improved barber ranking
```

---

## Next Steps

1. Run migrations `012_add_user_system.sql` and `013_add_review_scoring.sql`
2. Mount user routes in `api/index.js`
3. Implement user authentication (JWT tokens)
4. Create frontend UI for favorites and review submission
5. Add background job to recompute scores periodically

---

## Notes

- Review scores are computed automatically when review is created or votes change
- Barber scores are computed automatically or via cron job
- All timestamps in UTC (TIMESTAMPTZ)
- Scores update in real-time; no caching needed initially
- Sentiment from local LLM used in barber scoring for Yelp reviews
