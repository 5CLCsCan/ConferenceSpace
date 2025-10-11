-- Drop indexes
DROP INDEX IF EXISTS idx_conferences_acronym;
DROP INDEX IF EXISTS idx_conferences_area_chair;
DROP INDEX IF EXISTS idx_conferences_primary_contact;
DROP INDEX IF EXISTS idx_conferences_chair;

-- Drop constraints
ALTER TABLE conferences DROP CONSTRAINT IF EXISTS unique_conferences_acronym;

-- Drop columns
ALTER TABLE conferences
    DROP COLUMN IF EXISTS area_chair,
    DROP COLUMN IF EXISTS primary_contact,
    DROP COLUMN IF EXISTS description,
    DROP COLUMN IF EXISTS acronym,
    DROP COLUMN IF EXISTS title;
