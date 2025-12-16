-- Add model_version column expected by image processor
ALTER TABLE IF EXISTS image_analyses
  ADD COLUMN IF NOT EXISTS model_version TEXT;
