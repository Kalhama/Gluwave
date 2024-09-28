 DROP TABLE IF EXISTS temp_base;

CREATE TEMPORARY TABLE temp_base AS

WITH glucose_rate AS (
	SELECT
		id as glucose_id,
		user_id,
		timestamp,
		"amount" as glucose,
		LEAD(amount) OVER (PARTITION BY "user_id" ORDER BY timestamp ) - "amount" AS glucose_change,
		LEAD(timestamp) OVER (PARTITION BY "user_id" ORDER BY timestamp ) - "timestamp" AS step
	FROM 
		glucose
), insulin_rate AS (
	SELECT
		glucose_id,
		total_insulin_absorbed,
		LEAD(total_insulin_absorbed) OVER (PARTITION BY "user_id" ORDER BY timestamp ) - "total_insulin_absorbed" AS insulin_absorbed
	FROM (
		SELECT
			glucose.user_id,
			glucose.timestamp,
			glucose.id as glucose_id,
			COALESCE(SUM(total_insulin_absorbed(
				t => glucose.timestamp,
				start => insulin.timestamp,
				amount => insulin.amount
			)), 0) as total_insulin_absorbed
		FROM glucose
		LEFT JOIN insulin 
			ON glucose.user_id = insulin.user_id 
			AND insulin.timestamp <= glucose.timestamp 
		GROUP BY glucose.id
	)
), metrics AS (
	SELECT 
		glucose_rate.glucose_id,
		LEAD(glucose_rate.glucose_id) OVER (PARTITION BY user_id ORDER BY timestamp) AS next_glucose_id,
		user_id,
		timestamp,
		glucose,
		glucose_change,
		step,
		total_insulin_absorbed,
		glucose_change / "user"."correctionRatio" * "user"."carbohydrateRatio" + insulin_absorbed * "user"."carbohydrateRatio" AS observed_carbs
	FROM glucose_rate 
	LEFT JOIN insulin_rate 
	ON insulin_rate.glucose_id = glucose_rate.glucose_id
	LEFT JOIN "user"
	ON "user"."id" = glucose_rate.user_id
	ORDER BY timestamp
), base AS (
	SELECT
		metrics.glucose_id,
	metrics.next_glucose_id,
		metrics.user_id,
		metrics.timestamp,
		glucose,
		glucose_change,
		step,
		total_insulin_absorbed,
		observed_carbs as observed,
		carbs.id as id,
		carbs.timestamp as start,
		amount,
		decay,
		LEAST(
			carbs.timestamp + MAKE_INTERVAL(mins => (carbs.decay * 1.5)::integer),
			metrics.timestamp + metrics.step
		) - GREATEST(carbs.timestamp, metrics.timestamp) AS active_time, -- todo broken
		(carbs.decay * 1.5)::integer as extended_decay,
		amount / decay as rate,
		amount / decay / 1.5 as min_rate
	FROM metrics
	LEFT JOIN carbs
		ON carbs.user_id = metrics.user_id
)

SELECT * FROM base ORDER BY glucose_id;

CREATE INDEX idx_temp_base_glucose_id ON temp_base(glucose_id);
CREATE INDEX idx_temp_base_next_glucose_id ON temp_base(next_glucose_id);
CREATE INDEX idx_temp_base_id ON temp_base(id);
CREATE INDEX idx_temp_base_glucose_id_id ON temp_base(glucose_id, id);

WITH RECURSIVE attributed_carbs as MATERIALIZED (
	SELECT 
		glucose_id, 
		next_glucose_id,
		id
	FROM temp_base
	WHERE glucose_id = 2014
	
	
	UNION ALL
	
	SELECT 
		c.glucose_id, 
		c.next_glucose_id,
		c.id
	FROM attributed_carbs p
	INNER JOIN temp_base c ON p.next_glucose_id = c.glucose_id AND p.id = c.id
)
SELECT * FROM attributed_carbs ORDER BY glucose_id LIMIT 999999;



