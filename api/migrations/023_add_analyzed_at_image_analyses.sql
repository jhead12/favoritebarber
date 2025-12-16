-- Add analyzed_at timestamp column for image analyses
ALTER TABLE IF EXISTS image_analyses
  ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;
