-- Custom SQL migration file, put you code below! --
DROP VIEW metrics;

CREATE OR REPLACE FUNCTION metrics(
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    input_user_id TEXT
)
RETURNS TABLE (
    glucose_id INTEGER,
    user_id TEXT,
    "timestamp" TIMESTAMP,
    glucose DOUBLE PRECISION,
    step INTERVAL,
    glucose_change DOUBLE PRECISION,
    timestamp_next TIMESTAMP,
    insulin_change DOUBLE PRECISION,
    observed_carbs DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    WITH glucose_change AS (
        SELECT 
            glucose.id as glucose_id,
            glucose.user_id,
            glucose.timestamp,
            glucose.amount AS glucose,
            LEAD(glucose.timestamp) OVER (PARTITION BY glucose.user_id ORDER BY glucose.timestamp) - glucose.timestamp AS step,
            LEAD(glucose.amount) OVER (PARTITION BY glucose.user_id ORDER BY glucose.timestamp) - glucose.amount AS glucose_change,
            LEAD(glucose.timestamp) OVER (PARTITION BY glucose.user_id ORDER BY glucose.timestamp) AS timestamp_next
        FROM glucose
        WHERE start_time <= glucose.timestamp AND glucose.timestamp <= end_time
        AND glucose.user_id = input_user_id
    ), insulin_change AS (
        SELECT
            glucose_change.glucose_id,
            SUM(COALESCE(total_insulin_absorbed(
                t => glucose_change.timestamp_next,
                start => insulin.timestamp,
                amount => insulin.amount
            ), 0) - COALESCE(total_insulin_absorbed(
                t => glucose_change.timestamp,
                start => insulin.timestamp,
                amount => insulin.amount
            ), 0))::DOUBLE PRECISION as insulin_change
        FROM glucose_change
        LEFT JOIN insulin
        ON glucose_change.user_id = insulin.user_id
        AND insulin.timestamp <= glucose_change.timestamp_next AND glucose_change.timestamp <= insulin.timestamp + interval '6 hours'
        GROUP BY glucose_change.glucose_id
        ORDER BY glucose_change.glucose_id
    )
    SELECT 
        glucose_change.glucose_id,
        glucose_change.user_id,
        glucose_change.timestamp,
        glucose_change.glucose,
        glucose_change.step,
        glucose_change.glucose_change,
        glucose_change.timestamp_next,
        insulin_change.insulin_change,
        glucose_change.glucose_change / "user"."correctionRatio" * "user"."carbohydrateRatio" + insulin_change.insulin_change * "user"."carbohydrateRatio" AS observed_carbs
    FROM glucose_change
    INNER JOIN insulin_change
    ON glucose_change.glucose_id = insulin_change.glucose_id
    INNER JOIN "user"
    ON "user".id = glucose_change.user_id
    ORDER BY glucose_change.glucose_id;
END;
$$ LANGUAGE plpgsql;