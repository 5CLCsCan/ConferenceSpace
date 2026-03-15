ALTER TABLE conferences
    DROP CONSTRAINT IF EXISTS check_conference_status;

ALTER TABLE conferences
    ADD CONSTRAINT check_conference_status
    CHECK (status IN ('draft', 'open', 'reviewing', 'completed', 'archived'));

COMMENT ON COLUMN conferences.status IS 'Conference status: draft (not yet published), open (accepting submissions), reviewing (submissions closed, under review), completed (conference finished), archived (hidden from active lists)';
