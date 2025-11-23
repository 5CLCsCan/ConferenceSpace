-- Add co_chairs field to support multiple co-chairs
-- Keep the main chair field as is for the primary chair
ALTER TABLE conferences ADD COLUMN co_chairs TEXT[] DEFAULT '{}';

-- Create GIN index for array containment queries on co_chairs
CREATE INDEX idx_conferences_co_chairs ON conferences USING GIN (co_chairs);

