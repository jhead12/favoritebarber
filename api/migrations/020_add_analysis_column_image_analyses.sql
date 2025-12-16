-- Add missing analysis column to image_analyses for worker compatibility
ALTER TABLE IF EXISTS image_analyses
  ADD COLUMN IF NOT EXISTS analysis JSONB;
