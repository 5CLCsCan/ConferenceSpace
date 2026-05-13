-- ConferenceSpace user behavior analytics queries.
-- Replace bind placeholders with your SQL client's parameter syntax as needed.

-- 1) Steps and elapsed time until a target event within each flow.
-- Parameters:
--   :flow_name    e.g. 'reviewer_review'
--   :target_event e.g. 'review_submitted' or 'submission_published'
WITH target_events AS (
    SELECT
        flow_id,
        MIN(occurred_at) AS target_at
    FROM user_events
    WHERE flow_name = :flow_name
      AND event_name = :target_event
      AND flow_id IS NOT NULL
    GROUP BY flow_id
),
flow_starts AS (
    SELECT
        flow_id,
        MIN(occurred_at) AS started_at
    FROM user_events
    WHERE flow_name = :flow_name
      AND flow_id IS NOT NULL
    GROUP BY flow_id
)
SELECT
    t.flow_id,
    COUNT(e.event_id) FILTER (WHERE e.occurred_at <= t.target_at) AS steps_to_target,
    t.target_at - s.started_at AS time_to_target
FROM target_events t
JOIN flow_starts s ON s.flow_id = t.flow_id
JOIN user_events e ON e.flow_id = t.flow_id
GROUP BY t.flow_id, t.target_at, s.started_at
ORDER BY t.target_at;

-- 2) Drop-off by latest reached step for flows that did not complete.
-- Parameters:
--   :flow_name        e.g. 'chair_assignment'
--   :completion_event e.g. 'assignments_confirmed'
WITH completed AS (
    SELECT DISTINCT flow_id
    FROM user_events
    WHERE flow_name = :flow_name
      AND event_name = :completion_event
      AND flow_id IS NOT NULL
),
latest_steps AS (
    SELECT DISTINCT ON (flow_id)
        flow_id,
        step_name,
        step_index,
        occurred_at
    FROM user_events
    WHERE flow_name = :flow_name
      AND event_type = 'flow_step'
      AND flow_id IS NOT NULL
    ORDER BY flow_id, step_index DESC, occurred_at DESC
)
SELECT
    step_name,
    step_index,
    COUNT(*) AS abandoned_flows
FROM latest_steps
WHERE flow_id NOT IN (SELECT flow_id FROM completed)
GROUP BY step_name, step_index
ORDER BY step_index;

-- 3) Feature usage by role and event.
SELECT
    role,
    feature,
    event_name,
    COUNT(*) AS event_count,
    COUNT(DISTINCT user_id) AS unique_users
FROM user_events
WHERE occurred_at >= :started_at
  AND occurred_at < :ended_at
  AND feature IS NOT NULL
GROUP BY role, feature, event_name
ORDER BY event_count DESC;

-- 4) Average active time by route template/feature.
SELECT
    feature,
    route,
    AVG(active_ms) AS avg_active_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY active_ms) AS median_active_ms,
    COUNT(*) AS samples
FROM user_events
WHERE event_name = 'page_active_time'
  AND active_ms IS NOT NULL
GROUP BY feature, route
ORDER BY avg_active_ms DESC;

-- 5) Most common ordered paths for a flow.
-- Parameters:
--   :flow_name e.g. 'author_submission'
SELECT
    path,
    COUNT(*) AS flow_count
FROM (
    SELECT
        flow_id,
        STRING_AGG(step_name, ' -> ' ORDER BY step_index, occurred_at) AS path
    FROM user_events
    WHERE flow_name = :flow_name
      AND event_type = 'flow_step'
      AND flow_id IS NOT NULL
    GROUP BY flow_id
) paths
GROUP BY path
ORDER BY flow_count DESC;

-- 6) Raw CSV-friendly export for thesis analysis.
SELECT
    e.event_id,
    e.session_id,
    e.user_id,
    e.role,
    e.route,
    e.feature,
    e.event_name,
    e.event_type,
    e.flow_id,
    e.flow_name,
    e.step_name,
    e.step_index,
    e.active_ms,
    e.metadata,
    e.occurred_at
FROM user_events e
WHERE e.occurred_at >= :started_at
  AND e.occurred_at < :ended_at
ORDER BY e.user_id, e.session_id, e.occurred_at;
