-- Store the author's aggregated domains/topics alongside each external
-- invitation so the committee table can render the "Domain" column for
-- non-platform invitees. The array mirrors what Semantic Scholar returns via
-- papers.fieldsOfStudy / papers.s2FieldsOfStudy, deduplicated and sorted by
-- the SearchAuthors aggregator.
--
-- Using TEXT[] (not JSONB) because the payload is a flat, unordered set of
-- short category strings; a native array keeps the storage tight and gives
-- us cheap GIN-indexable filtering later if we ever need to search by topic.
ALTER TABLE external_invitations
    ADD COLUMN IF NOT EXISTS fields_of_study TEXT[] NOT NULL DEFAULT '{}';
