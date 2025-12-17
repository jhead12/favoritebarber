-- 024_fix_image_analyses_image_id.sql
-- Safely convert image_analyses.image_id (TEXT) -> INTEGER referencing images(id)
-- Strategy:
-- 1) Add new integer column `image_id_new`
-- 2) Copy values where text is numeric
-- 3) Remove old foreign key (if present) and old column
-- 4) Rename new column and add FK + index

BEGIN;

-- Add new integer column
ALTER TABLE IF EXISTS image_analyses
  ADD COLUMN IF NOT EXISTS image_id_new INTEGER;

-- Copy numeric ids into new column (safe cast where text contains only digits)
UPDATE image_analyses
  SET image_id_new = (image_id::integer)
  WHERE (image_id::text) ~ '^[0-9]+$';

-- If an FK constraint exists on the old column, drop it (common default name)
ALTER TABLE IF EXISTS image_analyses
  DROP CONSTRAINT IF EXISTS image_analyses_image_id_fkey;

-- Drop old column (keep safe: only drop if it exists)
ALTER TABLE IF EXISTS image_analyses
  DROP COLUMN IF EXISTS image_id;

-- Rename new column into place
ALTER TABLE IF EXISTS image_analyses
  RENAME COLUMN image_id_new TO image_id;

-- Ensure column is NOT NULL if every row has a value (guarded)
-- If there are rows with NULL, leave as nullable to avoid data loss; we only set NOT NULL when safe
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM image_analyses WHERE image_id IS NULL) = 0 THEN
    ALTER TABLE image_analyses ALTER COLUMN image_id SET NOT NULL;
  END IF;
END$$;

-- Add foreign key constraint to images.id
ALTER TABLE IF EXISTS image_analyses
  ADD CONSTRAINT image_analyses_image_id_fkey FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE;

-- Add index to speed joins
CREATE INDEX IF NOT EXISTS idx_image_analyses_image_id_int ON image_analyses(image_id);

COMMIT;
