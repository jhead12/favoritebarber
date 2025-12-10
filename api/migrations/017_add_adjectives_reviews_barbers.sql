-- migration: add adjectives to reviews and barbers

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS adjectives JSONB;

ALTER TABLE barbers
ADD COLUMN IF NOT EXISTS adjectives JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_reviews_adjectives ON reviews USING gin (adjectives jsonb_path_ops);
