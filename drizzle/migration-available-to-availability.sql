-- Migration: Convert available (boolean) to availability (text)
-- Run this if you have existing data in the candidates table

-- Step 1: Add the new availability column
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS availability text DEFAULT 'looking';

-- Step 2: Migrate existing data from available to availability
UPDATE candidates
SET availability = CASE
  WHEN available = true THEN 'looking'
  WHEN available = false THEN 'not-looking'
  ELSE 'looking'
END
WHERE availability IS NULL OR availability = 'looking';

-- Step 3: Drop the old available column (only run after verifying migration)
-- ALTER TABLE candidates DROP COLUMN IF EXISTS available;

-- Step 4: Create new index (drop old one if exists)
DROP INDEX IF EXISTS candidates_available_idx;
CREATE INDEX IF NOT EXISTS candidates_availability_idx ON candidates(availability);
