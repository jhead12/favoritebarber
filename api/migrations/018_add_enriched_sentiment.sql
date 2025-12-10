-- migration: add enriched sentiment column to reviews
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS enriched_sentiment INTEGER;

-- keep sentiment_score numeric (exists); enriched_sentiment will store discrete -1/0/1 from LLM

-- Index for quick aggregations
CREATE INDEX IF NOT EXISTS idx_reviews_enriched_sentiment ON reviews(enriched_sentiment);