-- migration: add hairstyles column to reviews

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS hairstyles JSONB;

CREATE INDEX IF NOT EXISTS idx_reviews_hairstyles ON reviews USING gin (hairstyles jsonb_path_ops);
