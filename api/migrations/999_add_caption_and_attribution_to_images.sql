-- Migration: add caption and attribution_metadata to images
BEGIN;
ALTER TABLE images ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE images ADD COLUMN IF NOT EXISTS attribution_metadata JSONB;
COMMIT;
