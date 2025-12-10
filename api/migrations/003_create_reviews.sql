-- migration: create reviews table (skeleton)
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER REFERENCES barbers(id),
  source TEXT,
  source_id TEXT,
  user_display TEXT,
  text TEXT,
  rating INTEGER,
  sentiment_score NUMERIC,
  created_at TIMESTAMPTZ,
  raw_json JSONB
);
