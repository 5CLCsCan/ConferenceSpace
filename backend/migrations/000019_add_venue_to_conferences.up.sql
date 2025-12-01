-- Add venue column to conferences table
ALTER TABLE conferences
    ADD COLUMN IF NOT EXISTS venue VARCHAR(500) DEFAULT '';

