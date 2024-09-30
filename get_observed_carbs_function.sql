

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
BEGIN
    FOR i IN 1 .. array_length(datetimes, 1) LOOP
        IF now - datetimes[i] > MAKE_INTERVAL(mins => lookback_len) THEN
            RETURN (datetimes[i], attributed_carbs[i]);
        END IF;
    END LOOP;

    -- if no matches, return last
    RETURN (datetimes[array_length(datetimes, 1)], attributed_carbs[array_length(attributed_carbs, 1)]);
END;
$$ LANGUAGE plpgsql;

-- results table where we collect the active meals and their attributed carbs over time
-- todo add user_id for safety
DROP TABLE IF EXISTS results CASCADE;
CREATE TEMPORARY TABLE results(
	carb_id integer,
	"timestamp" timestamp,
	"start" timestamp,
	carbs integer,
	decay integer,
	extended_decay integer,
	attributed_carbs double precision
	-- table_constraints todo
);

-- table where we hold currently active meals
-- todo add user_id for safety
DROP TABLE IF EXISTS active_meals CASCADE;
CREATE TEMPORARY TABLE active_meals(
	carb_id integer,
	"start" timestamp,
	carbs integer,
	decay integer,
	extended_decay integer,
	attributed_carbs double precision[]
	-- table_constraints todo
);

-- TODO add more filters
CREATE OR REPLACE FUNCTION calculate_carbs_on_board(filter_user_id TEXT)
RETURNS SETOF results AS $$
DECLARE
	total_rate FLOAT;
 	observation RECORD;
	meal RECORD;
observed_attributed_carbs FLOAT;
BEGIN
    FOR observation IN 
		WITH base as (
			SELECT 
				glucose_id,
				observed_carbs,
				metrics.timestamp,
				COALESCE(ARRAY_AGG(
			        carbs.carbs
			    ) FILTER (WHERE carbs.user_id IS NOT NULL), ARRAY[]::jsonb[])
				AS new_meals
			FROM 
			(
				SELECT *, LEAD(timestamp) OVER (PARTITION BY user_id ORDER BY timestamp) AS next_timestamp FROM metrics
			) AS metrics
			LEFT JOIN (
				SELECT
				id,
				user_id,
				carbs.timestamp,
				JSON_BUILD_OBJECT(
					'carb_id', carbs.id,
					'start', carbs.timestamp,
					'carbs', carbs.amount,
					'decay', carbs.decay,
					'extended_decay', (carbs.decay * 1.5)::int,
					'attributed_carbs', ARRAY[CAST(0 AS DOUBLE PRECISION)]
				)::jsonb as carbs
				FROM carbs
			) as carbs
			ON metrics.user_id = carbs.user_id
			AND metrics.timestamp <= carbs.timestamp AND carbs.timestamp < next_timestamp
			WHERE metrics.user_id = filter_user_id
			GROUP BY glucose_id, observed_carbs, metrics.timestamp, metrics.user_id
		)
		SELECT * FROM base
	 AS observation LOOP
		-- RAISE NOTICE 'new_meals %.', observation.new_meals;
		-- filter active meals on current timestamp
		DELETE FROM active_meals WHERE NOT is_active(
			observation.timestamp, 
			active_meals.start + MAKE_INTERVAL(mins => active_meals.decay), 
			active_meals.start + MAKE_INTERVAL(mins => active_meals.extended_decay), 
			active_meals.attributed_carbs[1], 
			active_meals.carbs
		);

		-- calculate total rate
		total_rate := (SELECT SUM(1.0 * carbs / decay) FROM active_meals);

		-- attribute carbs to each meal
		FOR meal IN SELECT * FROM active_meals AS meal LOOP
            observed_attributed_carbs := 1.0 * meal.carbs / meal.decay / total_rate * observation.observed_carbs + meal.attributed_carbs[1];

			-- TODO
            -- Get comparison data for attributed carbs over the last 30 minutes
            -- comparison := find_comparison_step(observation->'timestamps', meal->'attributed_carbs', 30);
            -- min_attributed_carbs := (comparison.attributed + minutes_between(comparison.dt, (observation->>'timestamp')::TIMESTAMP)) * (meal->>'rate')::FLOAT / 1.5;
            
			-- Update active meals with new calculations
			UPDATE active_meals
			SET attributed_carbs = (ARRAY_PREPEND(observed_attributed_carbs, attributed_carbs))[1:20]
			WHERE carb_id = meal.carb_id;        END LOOP;

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
			carb_id,
			observation.timestamp as timestamp,
			start,
			carbs,
			decay,
			extended_decay,
			attributed_carbs[1]
		from active_meals;
	END LOOP;

	-- return
	RETURN QUERY SELECT * FROM results;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM calculate_carbs_on_board('kf53skkawasqfuti');



