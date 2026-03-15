ALTER TABLE conferences
    DROP CONSTRAINT IF EXISTS check_conference_status;

ALTER TABLE conferences
    ADD CONSTRAINT check_conference_status
    CHECK (status IN ('open', 'reviewing', 'completed'));

COMMENT ON COLUMN conferences.status IS 'Conference status: open (accepting submissions), reviewing (submissions closed, under review), completed (conference finished)';
