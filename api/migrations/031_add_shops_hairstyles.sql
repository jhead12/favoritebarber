-- migration: add hairstyles column to shops

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS hairstyles JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_shops_hairstyles ON shops USING gin (hairstyles jsonb_path_ops);
