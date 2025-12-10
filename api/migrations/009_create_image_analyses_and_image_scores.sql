-- 009_create_image_analyses_and_image_scores.sql
-- Create image_analyses table and add relevance/authenticity columns to images

BEGIN;

CREATE TABLE IF NOT EXISTS image_analyses (
  id BIGSERIAL PRIMARY KEY,
  image_id TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  analysis JSONB NOT NULL,
  relevance_score NUMERIC(5,3) NOT NULL DEFAULT 0,
  authenticity_score NUMERIC(5,3) NOT NULL DEFAULT 0,
  model_version TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_image_analyses_image_id ON image_analyses(image_id);

-- Add score columns to images table if they don't already exist
ALTER TABLE images
  ADD COLUMN IF NOT EXISTS relevance_score NUMERIC(5,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS authenticity_score NUMERIC(5,3) DEFAULT 0;

COMMIT;
