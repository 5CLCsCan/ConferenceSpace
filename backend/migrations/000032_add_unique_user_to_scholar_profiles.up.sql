WITH ranked_profiles AS (
    SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, id DESC) AS rn
    FROM scholar_profiles
)
DELETE FROM scholar_profiles sp
USING ranked_profiles rp
WHERE sp.id = rp.id
  AND rp.rn > 1;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'scholar_profiles_user_id_unique'
    ) THEN
        ALTER TABLE scholar_profiles
            ADD CONSTRAINT scholar_profiles_user_id_unique UNIQUE (user_id);
    END IF;
END;
$$;
