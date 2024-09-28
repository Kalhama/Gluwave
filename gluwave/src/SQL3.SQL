DROP TABLE IF EXISTS temp_base;
SET SESSION enable_seqscan=true;

CREATE TEMPORARY TABLE temp_base AS (
    WITH glucose_rate AS (
	-- TODO limit amount of values we get if they are really dense. 5 mins should suffice.
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
), base as (
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
	ORDER BY glucose_id, carbs.id
)

	SELECT * FROM base
);

CREATE INDEX idx_temp_base_glucose_id_id ON temp_base (glucose_id, id);

-- Then use temp_base instead of base in your main query

 -- EXPLAIN ANALYZE

WITH recursive attributed_carbs as (
	SELECT 
	  timestamp, 
	  glucose_id,
	  user_id,
	  next_glucose_id,
	  id, 
	  start, 
	  min_rate, 
	  amount, 
	  observed,
	  ARRAY[CAST(0 AS DOUBLE PRECISION)] AS cumulative_attributed,
	  active
	FROM temp_base base,
	LATERAL (
	  SELECT timestamp > base.start AND timestamp < base.start + MAKE_INTERVAL(mins => base.decay) as active
	)
	WHERE timestamp = '2024-09-24 02:23:26' -- TODO 
	
	UNION ALL
	
	SELECT 
	  c.timestamp,
	  c.glucose_id,
	  c.user_id,
	  c.next_glucose_id,
	  c.id,
	  c.start,
	  c.min_rate,
	  c.amount,
	  c.observed,
	  -- store previous values in array, so we can check if they are absorbing too slow
	  calculate_cumulative_attributed(
		active => p.active, -- use previous active se that we start observing at t=1, not t=0
		cumulative_attributed => p.cumulative_attributed,
		amount => p.amount,
		min_rate => p.min_rate,
		total_min_rate => SUM (p.active::int * p.min_rate) OVER (),
		observed => p.observed,
		lookback_period => 20
	  ) AS cumulative_attributed,
	  l.active
	FROM attributed_carbs p
	INNER JOIN temp_base c ON p.next_glucose_id = c.glucose_id AND p.id = c.id,
	LATERAL (
	  SELECT c.timestamp > c.start AND (c.timestamp < c.start + MAKE_INTERVAL(mins => c.decay) OR (p.cumulative_attributed[1] < c.amount AND c.timestamp < c.start + MAKE_INTERVAL(mins => c.extended_decay))) AS active
	) as l
)

SELECT * FROM attributed_carbs;