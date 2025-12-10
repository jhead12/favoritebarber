-- migration: add prefilter columns to reviews

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS prefilter_flags JSONB,
ADD COLUMN IF NOT EXISTS prefilter_details JSONB;

CREATE INDEX IF NOT EXISTS idx_reviews_prefilter_flags ON reviews USING gin (prefilter_flags jsonb_path_ops);
