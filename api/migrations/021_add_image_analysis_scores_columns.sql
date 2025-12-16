-- Add expected columns to image_analyses used by image processor
ALTER TABLE IF EXISTS image_analyses
  ADD COLUMN IF NOT EXISTS relevance_score NUMERIC,
  ADD COLUMN IF NOT EXISTS authenticity_score NUMERIC,
  ADD COLUMN IF NOT EXISTS hairstyles TEXT[];
