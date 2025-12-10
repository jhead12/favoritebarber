-- migration: add user and review system
-- Supports: user accounts, favorites, user-generated reviews with scoring

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_image_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- User favorites: bookmarked barber shops or individual barbers
CREATE TABLE IF NOT EXISTS user_favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
  barber_id INTEGER REFERENCES barbers(id) ON DELETE SET NULL,
  notes TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, shop_id, barber_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_shop_id ON user_favorites(shop_id);

-- User-generated reviews (not from Yelp, but from our users)
CREATE TABLE IF NOT EXISTS user_reviews (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
  barber_id INTEGER REFERENCES barbers(id) ON DELETE SET NULL,
  title VARCHAR(255),
  text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  hairstyle_requested VARCHAR(100),
  price_paid NUMERIC(8, 2),
  would_return BOOLEAN,
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id ON user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_shop_id ON user_reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_barber_id ON user_reviews(barber_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_created_at ON user_reviews(created_at DESC);

-- Review helpfulness votes (users vote if review was helpful)
CREATE TABLE IF NOT EXISTS review_helpfulness (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id INTEGER NOT NULL REFERENCES user_reviews(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpfulness_review_id ON review_helpfulness(review_id);

-- Barber profiles (when a barber claims their profile)
CREATE TABLE IF NOT EXISTS barber_profiles (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER REFERENCES barbers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  specialty VARCHAR(255),
  years_experience INTEGER,
  availability JSON,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_code VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barber_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_barber_profiles_barber_id ON barber_profiles(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_user_id ON barber_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_verified ON barber_profiles(verified);

-- Search history for analytics
CREATE TABLE IF NOT EXISTS search_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  search_term VARCHAR(255),
  search_location VARCHAR(255),
  result_count INTEGER,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);

-- View: aggregate user reviews with scoring
CREATE OR REPLACE VIEW user_reviews_with_scores AS
SELECT 
  ur.id,
  ur.user_id,
  ur.shop_id,
  ur.barber_id,
  ur.title,
  ur.text,
  ur.rating,
  ur.hairstyle_requested,
  ur.price_paid,
  ur.would_return,
  ur.helpful_count,
  ur.unhelpful_count,
  CASE 
    WHEN (ur.helpful_count + ur.unhelpful_count) = 0 THEN 0
    ELSE ROUND(ur.helpful_count::NUMERIC / (ur.helpful_count + ur.unhelpful_count) * 100, 2)
  END as helpfulness_score,
  ur.created_at,
  ur.updated_at,
  u.username,
  u.profile_image_url
FROM user_reviews ur
JOIN users u ON ur.user_id = u.id
WHERE ur.published = TRUE;
