# Rate Your Barber - Quick Start Guide

## 🚀 Get Started in 2 Minutes

### Start the API Server
```bash
cd /Volumes/PRO-BLADE/Github/RateYourBarber
npm install
node api/index.js
```

**Expected Output:**
```
[JOBS] Initializing background jobs...
[JOBS] Background jobs initialized
API server listening on port 3000
[JOBS] Running initial score computation...
```

---

## 🔐 User Registration & Login

### Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "username",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "username",
    "created_at": "2025-12-05T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

## ⭐ Manage Favorites

### Save Token & User ID
```bash
# From registration/login response
TOKEN="your-jwt-token-here"
USERID="your-user-id-here"
```

### Add to Favorites
```bash
curl -X POST http://localhost:3000/api/users/${USERID}/favorites \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": 1,
    "barberId": 1,
    "notes": "Amazing haircuts!"
  }'
```

### Get Favorites
```bash
curl http://localhost:3000/api/users/${USERID}/favorites \
  -H "Authorization: Bearer ${TOKEN}"
```

### Remove Favorite
```bash
curl -X DELETE http://localhost:3000/api/users/${USERID}/favorites/1 \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"barberId": 1}'
```

---

## 📝 Write & Share Reviews

### Submit a Review
```bash
curl -X POST http://localhost:3000/api/users/${USERID}/reviews \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": 1,
    "barberId": 1,
    "rating": 5,
    "hairstyleRequested": "fade",
    "pricePaid": 25.00,
    "wouldReturn": true,
    "title": "Absolutely fantastic!",
    "text": "John gave me the best fade Ive ever had. Professional, friendly, and efficient. Highly recommend!"
  }'
```

### Get Reviews for Barber
```bash
curl http://localhost:3000/api/users/1/user-reviews \
  -H "Authorization: Bearer ${TOKEN}"
```

### Get Reviews for Shop
```bash
curl http://localhost:3000/api/shops/1/user-reviews \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## 👍 Vote on Review Helpfulness

### Mark Review as Helpful
```bash
curl -X POST http://localhost:3000/api/reviews/1/helpful \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"isHelpful": true}'
```

### Mark Review as Not Helpful
```bash
curl -X POST http://localhost:3000/api/reviews/1/helpful \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"isHelpful": false}'
```

---

## 🎯 Frontend Components

### Import & Use in React
```typescript
import { FavoritesButton } from '@/components/FavoritesButton';
import { FavoritesList } from '@/components/FavoritesList';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewsList } from '@/components/ReviewsList';
import { ReviewHelpfulness } from '@/components/ReviewHelpfulness';

// Example usage
<FavoritesButton 
  userId={userId}
  shopId={1}
  barberId={1}
  token={token}
/>

<ReviewForm
  userId={userId}
  shopId={1}
  barberId={1}
  barberName="John"
  shopName="Budget Barbers"
  token={token}
/>

<ReviewsList
  barberId={1}
  userId={userId}
  token={token}
/>
```

---

## 📊 How Scores Work

### Review Score (0-100)
- **Helpfulness votes**: 30% weight
- **Detail** (length, hairstyle, price): 20% weight
- **Recency** (newer reviews score higher): 15% weight
- **Star rating**: 20% weight
- **User reputation**: 15% weight

### Barber Score (0-100)
- **User rating average**: 20% weight
- **Yelp rating**: 20% weight
- **Yelp sentiment**: 30% weight
- **Would return %**: scaled by 5
- **Trending boost**: +10 if 5+ recent reviews

---

## ⚙️ Background Jobs

Background jobs automatically run:
- **Review score recomputation**: Every 30 minutes
- **Barber score recomputation**: Every hour
- **Initial computation**: On API startup

Logs will show:
```
[JOBS] Recomputed X review scores
[JOBS] Recomputed Y barber scores
```

---

## 🔍 Common Tasks

### Check If User is Authenticated
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer ${TOKEN}"
```

### Search User Reviews (by Shop)
```bash
curl "http://localhost:3000/api/shops/1/reviews/search?term=fade&limit=10" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Create Multiple Test Users
```bash
for i in {1..5}; do
  curl -s -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"user$i@test.com\", \"username\": \"user$i\", \"password\": \"pass123\"}"
done
```

---

## 🚨 Troubleshooting

### "Invalid token" Error
- Token may be expired (7-day expiration)
- Re-login to get new token
- Check Authorization header format: `Bearer {token}`

### "Cannot access other users data"
- API enforces user isolation
- Can only access your own favorites/reviews
- User ID must match authenticated user

### "Missing authorization header"
- Add `-H "Authorization: Bearer ${TOKEN}"`
- Ensure TOKEN variable is set correctly

### Background jobs not running
- Check `/tmp/api.log` for errors
- Ensure PostgreSQL is running
- Restart API server to trigger initial computation

---

## 📚 Database Tables

**User System:**
- `users` - User accounts
- `user_favorites` - Bookmarked barbers/shops
- `user_reviews` - User-generated reviews
- `review_helpfulness` - Helpful votes

**Scoring:**
- `review_scores` - Individual review credibility
- `barber_scores` - Aggregated barber rankings

**Original Data:**
- `shops` - Barbershop listings
- `barbers` - Individual barbers
- `reviews` - Yelp reviews (enriched with LLM)
- `locations` - Address data

---

## 🎨 Component Styling

All components include built-in styling with:
- Responsive design
- Hover effects
- Loading states
- Error handling
- Mobile-friendly layouts

No external CSS required - components use CSS-in-JS (styled-jsx).

---

## 💡 Tips

1. **Save your token** after login - you'll need it for all user endpoints
2. **Review scores update** every 30 minutes - votes take effect automatically
3. **Barber scores update** every hour - popularity changes reflected quickly
4. **Star ratings** guide your review (5★ = highest score)
5. **Details matter** - including hairstyle + price boosts review credibility

---

## 📞 Support

Check logs:
```bash
tail -f /tmp/api.log
```

Verify PostgreSQL connection:
```bash
PGPASSWORD=password psql -h localhost -U postgres -d rateyourbarber -c "SELECT COUNT(*) FROM users;"
```

Reset test data:
```bash
# Delete all user data (keep schema)
PGPASSWORD=password psql -h localhost -U postgres -d rateyourbarber -c "DELETE FROM user_reviews; DELETE FROM user_favorites; DELETE FROM users;"
```

