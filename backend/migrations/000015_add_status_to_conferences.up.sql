-- Add status column to conferences table
ALTER TABLE conferences
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'open';

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_conferences_status ON conferences(status);

-- Add check constraint to ensure valid status values
ALTER TABLE conferences
    ADD CONSTRAINT check_conference_status 
    CHECK (status IN ('open', 'reviewing', 'completed'));

-- Add comment
COMMENT ON COLUMN conferences.status IS 'Conference status: open (accepting submissions), reviewing (submissions closed, under review), completed (conference finished)';

