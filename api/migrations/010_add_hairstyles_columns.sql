-- 010_add_hairstyles_columns.sql
-- Add hairstyles columns to images and barbers (jsonb)

BEGIN;

ALTER TABLE images
  ADD COLUMN IF NOT EXISTS hairstyles JSONB DEFAULT '[]'::jsonb;

ALTER TABLE barbers
  ADD COLUMN IF NOT EXISTS hairstyles JSONB DEFAULT '[]'::jsonb;

COMMIT;
