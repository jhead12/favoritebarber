-- migration: create barbers table (skeleton)
CREATE TABLE IF NOT EXISTS barbers (
  id SERIAL PRIMARY KEY,
  name TEXT,
  primary_location_id INTEGER,
  yelp_business_id TEXT,
  claimed_by_user_id INTEGER,
  trust_score NUMERIC DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
