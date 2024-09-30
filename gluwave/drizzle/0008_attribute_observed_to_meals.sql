

CREATE OR REPLACE FUNCTION is_active(ts TIMESTAMP, end_time TIMESTAMP, extended_end_time TIMESTAMP, attributed_carbs FLOAT, carbs FLOAT) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (ts < end_time) OR (ts < extended_end_time AND attributed_carbs < carbs);
END;
$$ LANGUAGE plpgsql;

-- could refactor into sql
CREATE OR REPLACE FUNCTION find_comparison_step(datetimes TIMESTAMP[], attributed_carbs FLOAT[], lookback_len INT) 
RETURNS RECORD AS $$
DECLARE
    now TIMESTAMP := datetimes[1];
    i INT;
	len INT;
BEGIN
		len := GREATEST(array_length(attributed_carbs, 1), array_length(datetimes, 1));
    FOR i IN 1 .. len LOOP
        IF now - datetimes[i] > MAKE_INTERVAL(mins => lookback_len) THEN
            RETURN (datetimes[i], attributed_carbs[i]);
        END IF;
    END LOOP;

    -- if no matches, return last
    RETURN (datetimes[len], attributed_carbs[len]);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION attribute_observed_to_meals(filter_user_id TEXT, start_time timestamp, end_time timestamp)
RETURNS TABLE(
			carb_id integer,
			"timestamp" timestamp,
			"start" timestamp,
			carbs integer,
			decay integer,
			extended_decay integer,
			attributed_carbs double precision
		) AS $$
DECLARE
	total_rate FLOAT;
 	observation RECORD;
	meal RECORD;
	observed_attributed_carbs FLOAT;
	comparison_timestamp TIMESTAMP;
	comparison_attributed FLOAT;
	min_attributed_carbs FLOAT;
	new_attributed_carbs FLOAT;
	rate FLOAT;
BEGIN
	-- results table where we collect the active meals and their attributed carbs over time
	CREATE TEMPORARY TABLE IF NOT EXISTS results(
		carb_id integer,
		"timestamp" timestamp,
		"start" timestamp,
		carbs integer,
		decay integer,
		extended_decay integer,
		attributed_carbs double precision
	);
	
	-- table where we hold currently active meals
	CREATE TEMPORARY TABLE IF NOT EXISTS active_meals(
		carb_id integer PRIMARY KEY,
		"start" timestamp,
		carbs integer,
		decay integer,
		extended_decay integer,
		attributed_carbs double precision[]
	);


	DELETE FROM active_meals;
	DELETE FROM results;


    FOR observation IN 
		WITH base as (
			SELECT 
				glucose_id,
				observed_carbs,
				ARRAY_AGG(metrics.timestamp) OVER (ORDER BY metrics.timestamp DESC ROWS BETWEEN CURRENT ROW AND 20 FOLLOWING) as "timestamp",
				COALESCE(ARRAY_AGG(
			        JSONB_BUILD_OBJECT(
						'carb_id', carbs.id,
						'start', carbs.timestamp,
						'carbs', carbs.amount,
						'decay', carbs.decay,
						'extended_decay', (carbs.decay * 1.5)::int,
						'attributed_carbs', ARRAY[CAST(0 AS DOUBLE PRECISION)]
					)
			    ) FILTER (WHERE carbs.user_id IS NOT NULL), ARRAY[]::jsonb[])
				AS new_meals
			FROM 
			(
				SELECT 
					*, 
					LEAD(metrics.timestamp) OVER (PARTITION BY user_id ORDER BY metrics.timestamp) AS next_timestamp 
				FROM metrics
			) AS metrics
			LEFT JOIN carbs
			ON metrics.user_id = carbs.user_id
			AND metrics.timestamp <= carbs.timestamp AND carbs.timestamp < next_timestamp
			WHERE metrics.user_id = filter_user_id
			AND start_time <= metrics.timestamp AND metrics.timestamp <= end_time
			GROUP BY glucose_id, observed_carbs, metrics.timestamp, metrics.user_id
			ORDER BY metrics.timestamp ASC
		)
		SELECT * FROM base
	 AS observation LOOP
		-- RAISE NOTICE 'new_meals %.', observation.new_meals;
		-- filter active meals on current timestamp
		DELETE FROM active_meals WHERE NOT is_active(
			observation.timestamp[1], 
			active_meals.start + MAKE_INTERVAL(mins => active_meals.decay), 
			active_meals.start + MAKE_INTERVAL(mins => active_meals.extended_decay), 
			active_meals.attributed_carbs[1], 
			active_meals.carbs
		);

		-- calculate total rate
		total_rate := (SELECT SUM(1.0 * active_meals.carbs / active_meals.decay) FROM active_meals);

		-- attribute carbs to each meal
		FOR meal IN SELECT * FROM active_meals AS meal LOOP
			rate := 1.0 * meal.carbs / meal.decay;

			observed_attributed_carbs := rate / total_rate * observation.observed_carbs + meal.attributed_carbs[1];


			SELECT * INTO comparison_timestamp, comparison_attributed FROM find_comparison_step(observation.timestamp, meal.attributed_carbs, 15) AS result(datetimes TIMESTAMP, attributed_carbs FLOAT);
			min_attributed_carbs := comparison_attributed + minutes_between(observation.timestamp[1], comparison_timestamp) * rate / 1.5;

			new_attributed_carbs := LEAST(
				GREATEST(
					observed_attributed_carbs, 
					min_attributed_carbs
				), 
				meal.carbs
			);
			
			UPDATE active_meals
			SET attributed_carbs = (ARRAY_PREPEND(new_attributed_carbs, active_meals.attributed_carbs))[1:20]
			WHERE active_meals.carb_id = meal.carb_id;        
		END LOOP;

		-- append new meals from this observation step to be analyzed in next round
		INSERT INTO active_meals (carb_id, "start", carbs, decay, extended_decay, attributed_carbs)
		SELECT
			(a->>'carb_id')::integer AS carb_id, 
			(a->>'start')::timestamp AS "start", 
			(a->>'carbs')::integer AS "carbs", 
			(a->>'decay')::integer AS "decay", 
			(a->>'extended_decay')::integer AS "extended_decay", 
			ARRAY(SELECT (v::text)::double precision
				FROM jsonb_array_elements(a->'attributed_carbs') AS v) AS attributed_carbs
		FROM unnest(observation.new_meals) AS a;

		-- push current active_meals to result set
		INSERT INTO results (carb_id, "timestamp", "start", carbs, decay, extended_decay, attributed_carbs)
		SELECT 
			active_meals.carb_id,
			observation.timestamp[1] as timestamp,
			active_meals."start",
			active_meals.carbs,
			active_meals.decay,
			active_meals.extended_decay,
			active_meals.attributed_carbs[1] as attributed_carbs
		from active_meals;
	END LOOP;

	-- return
	RETURN QUERY SELECT * FROM results;
END;
$$ LANGUAGE plpgsql;

