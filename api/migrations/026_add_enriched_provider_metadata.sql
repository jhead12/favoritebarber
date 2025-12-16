-- Add provider metadata for LLM enrichments
BEGIN;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS enriched_provider TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS enriched_model TEXT;
CREATE INDEX IF NOT EXISTS idx_reviews_enriched_provider ON reviews (enriched_provider);
COMMIT;
