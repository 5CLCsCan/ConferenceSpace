-- Add new columns to conferences table
ALTER TABLE conferences
    ADD COLUMN IF NOT EXISTS title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS acronym VARCHAR(50),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS primary_contact INTEGER,
    ADD COLUMN IF NOT EXISTS area_chair INTEGER;

-- Add unique constraint on acronym
ALTER TABLE conferences
    ADD CONSTRAINT unique_conferences_acronym UNIQUE (acronym);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_conferences_chair ON conferences(chair);
CREATE INDEX IF NOT EXISTS idx_conferences_primary_contact ON conferences(primary_contact);
CREATE INDEX IF NOT EXISTS idx_conferences_area_chair ON conferences(area_chair);
CREATE INDEX IF NOT EXISTS idx_conferences_acronym ON conferences(acronym);
