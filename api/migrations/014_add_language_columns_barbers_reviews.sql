-- migration: add language columns to reviews and barbers

-- Add language metadata to reviews
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS language_confidence NUMERIC;

-- Add languages aggregate to barbers (jsonb array of {lang,count})
ALTER TABLE barbers
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_reviews_language ON reviews(language);
