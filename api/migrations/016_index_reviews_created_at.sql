-- migration: ensure index on reviews.created_at for age-based scoring and queries

CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at DESC);
