-- Migration: Add unique index on (conference_id, author) to enforce one submission per author per conference
--
-- This migration ensures that each author can only have ONE submission per conference.
-- It handles existing duplicates by keeping the earliest submission (MIN(submission_id)).
--
-- IMPORTANT: Run this migration during off-peak hours or maintenance window.
-- Ensure you have a database backup before running.

-- ============================================================================
-- STEP 1: Delete duplicate submissions (keep earliest)
-- ============================================================================
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete duplicates, keeping only the earliest submission_id for each (conference_id, author)
    WITH duplicates AS (
        SELECT 
            submission_id,
            conference_id,
            LOWER(author) as author_lower,
            ROW_NUMBER() OVER (
                PARTITION BY conference_id, LOWER(author) 
                ORDER BY submission_id ASC  -- Keep earliest submission_id
            ) as rn
        FROM conference_submissions
    )
    DELETE FROM conference_submissions
    WHERE submission_id IN (
        SELECT submission_id 
        FROM duplicates 
        WHERE rn > 1  -- Delete all but the first (earliest) submission
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the number of deleted duplicates
    RAISE NOTICE 'Deleted % duplicate submission(s)', deleted_count;
    
    -- If duplicates were found, log a warning
    IF deleted_count > 0 THEN
        RAISE WARNING 'Found and deleted % duplicate submissions. Review logs to ensure correct submissions were kept.', deleted_count;
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Add unique index
-- ============================================================================
-- Create unique index on (conference_id, LOWER(author))
-- Note: We cannot add a named constraint on a functional index in PostgreSQL
-- The unique index itself provides the enforcement we need
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_author_per_conference 
    ON conference_submissions (conference_id, LOWER(author));
