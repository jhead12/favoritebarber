-- migration: add review scoring and ranking
-- Computes credibility scores for user reviews and barber rankings

-- Review credibility score factors
CREATE TABLE IF NOT EXISTS review_scores (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES user_reviews(id) ON DELETE CASCADE,
  
  -- Scoring components (0-100 each)
  rating_weight NUMERIC(5, 2) DEFAULT 20,           -- Star rating consistency
  helpfulness_score NUMERIC(5, 2) DEFAULT 0,        -- Votes from other users
  detail_score NUMERIC(5, 2) DEFAULT 0,             -- Length + hairstyle + price info
  recency_score NUMERIC(5, 2) DEFAULT 0,            -- How recent the review
  user_reputation NUMERIC(5, 2) DEFAULT 50,         -- User's history of helpful reviews
  
  -- Final composite score
  total_score NUMERIC(5, 2) DEFAULT 0,              -- 0-100, used for ranking
  
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_scores_review_id ON review_scores(review_id);
CREATE INDEX IF NOT EXISTS idx_review_scores_total_score ON review_scores(total_score DESC);

-- Barber aggregate scores (for barber profiles / rankings)
CREATE TABLE IF NOT EXISTS barber_scores (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  
  -- Aggregated from Yelp reviews
  yelp_rating NUMERIC(3, 2),
  yelp_review_count INTEGER DEFAULT 0,
  yelp_sentiment_avg NUMERIC(3, 2),
  
  -- Aggregated from our users
  user_rating_avg NUMERIC(3, 2),
  user_review_count INTEGER DEFAULT 0,
  user_helpfulness_avg NUMERIC(5, 2),
  
  -- Composite trust score (used in search results)
  trust_score NUMERIC(5, 2) DEFAULT 0,              -- 0-100
  would_return_percentage NUMERIC(5, 2),            -- % who said they'd return
  
  -- Trending data
  recent_reviews_count INTEGER DEFAULT 0,           -- Reviews in last 30 days
  trending BOOLEAN DEFAULT FALSE,                   -- Is this barber trending?
  
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barber_id)
);

CREATE INDEX IF NOT EXISTS idx_barber_scores_barber_id ON barber_scores(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_scores_trust_score ON barber_scores(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_barber_scores_trending ON barber_scores(trending);

-- View: combined barber info + scores
CREATE OR REPLACE VIEW barber_detailed_info AS
SELECT 
  b.id,
  b.name,
  sb.shop_id,
  s.name as shop_name,
  bp.bio,
  bp.years_experience,
  bp.verified,
  
  -- Scores
  COALESCE(bs.trust_score, 0) as trust_score,
  COALESCE(bs.user_rating_avg, 0) as user_rating_avg,
  COALESCE(bs.user_review_count, 0) as user_review_count,
  COALESCE(bs.would_return_percentage, 0) as would_return_percentage,
  COALESCE(bs.yelp_rating, 0) as yelp_rating,
  COALESCE(bs.yelp_review_count, 0) as yelp_review_count,
  COALESCE(bs.trending, FALSE) as trending,
  
  -- Counts
  COUNT(DISTINCT ur.id) as recent_user_reviews,
  COUNT(DISTINCT ur.hairstyle_requested) FILTER (WHERE ur.hairstyle_requested IS NOT NULL) as hairstyles_done
  
FROM barbers b
LEFT JOIN shop_barbers sb ON b.id = sb.barber_id AND sb.is_current = TRUE
LEFT JOIN shops s ON sb.shop_id = s.id
LEFT JOIN barber_profiles bp ON b.id = bp.barber_id
LEFT JOIN barber_scores bs ON b.id = bs.barber_id
LEFT JOIN user_reviews ur ON b.id = ur.barber_id AND ur.created_at > NOW() - INTERVAL '30 days'
GROUP BY b.id, b.name, sb.shop_id, s.name, bp.bio, bp.years_experience, bp.verified,
         bs.trust_score, bs.user_rating_avg, bs.user_review_count, bs.would_return_percentage,
         bs.yelp_rating, bs.yelp_review_count, bs.trending;
