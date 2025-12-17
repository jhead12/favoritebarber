-- Migration 028: Add Yelp GraphQL enrichment fields
-- Purpose: Store GraphQL-specific fields (hours, price, attribution, enrichment status)
-- for hybrid GraphQL/REST ingestion workflow

BEGIN;

-- Add GraphQL-enriched columns to yelp_businesses
ALTER TABLE yelp_businesses
  ADD COLUMN IF NOT EXISTS price TEXT,
  ADD COLUMN IF NOT EXISTS hours JSONB,
  ADD COLUMN IF NOT EXISTS yelp_attribution TEXT,
  ADD COLUMN IF NOT EXISTS graphql_enriched BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS review_cursor TEXT;

-- Create index for efficient filtering of unenriched businesses
CREATE INDEX IF NOT EXISTS idx_yelp_businesses_graphql_enriched 
  ON yelp_businesses(graphql_enriched) 
  WHERE graphql_enriched = FALSE;

-- Add comment for documentation
COMMENT ON COLUMN yelp_businesses.price IS 'Yelp price range (e.g., "$", "$$", "$$$")';
COMMENT ON COLUMN yelp_businesses.hours IS 'Structured opening hours from GraphQL (array of {day, start, end})';
COMMENT ON COLUMN yelp_businesses.yelp_attribution IS 'Required legal attribution text from Yelp';
COMMENT ON COLUMN yelp_businesses.graphql_enriched IS 'TRUE if business has been enriched via GraphQL';
COMMENT ON COLUMN yelp_businesses.review_cursor IS 'Pagination cursor for reviews (null if all fetched)';

COMMIT;

-- Rollback instructions (manual):
-- BEGIN;
-- DROP INDEX IF EXISTS idx_yelp_businesses_graphql_enriched;
-- ALTER TABLE yelp_businesses
--   DROP COLUMN IF EXISTS price,
--   DROP COLUMN IF EXISTS hours,
--   DROP COLUMN IF EXISTS yelp_attribution,
--   DROP COLUMN IF EXISTS graphql_enriched,
--   DROP COLUMN IF EXISTS review_cursor;
-- COMMIT;
