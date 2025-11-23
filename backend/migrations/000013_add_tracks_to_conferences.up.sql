-- Add tracks column to conferences table
ALTER TABLE conferences ADD COLUMN tracks TEXT[] DEFAULT '{}';

-- Add comment to explain the column
COMMENT ON COLUMN conferences.tracks IS 'List of tracks/categories available in this conference';

