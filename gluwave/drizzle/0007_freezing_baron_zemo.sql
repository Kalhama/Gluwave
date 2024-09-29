CREATE OR REPLACE FUNCTION calculate_cumulative_attributed(
    active BOOLEAN,
    cumulative_attributed DOUBLE PRECISION[],
	  timestamps TIMESTAMP[],
    amount DOUBLE PRECISION,
    min_rate DOUBLE PRECISION,
	total_min_rate DOUBLE PRECISION,
    observed DOUBLE PRECISION,
	lookback_period INTERVAL,
	ts TIMESTAMP
)
RETURNS DOUBLE PRECISION[] AS $$
DECLARE
	next_cumulative_attributed DOUBLE PRECISION;
	minimum_attribution DOUBLE PRECISION;
	insufficient_decay_speed BOOLEAN;
	observed_attribution DOUBLE PRECISION;
	cumulative_attributed_comparison_point DOUBLE PRECISION;
BEGIN
	IF NOT(active) THEN
		return cumulative_attributed;
	END IF;

	SELECT
		-- TODO RENAME INTO interpolate
		interpolate_glucose(
			t => ts - lookback_period,
			x1 => x1,
			x2 => x2,
			y1 => y1,
			y2 => y2
		) INTO cumulative_attributed_comparison_point
	FROM (
		SELECT
			x.timestamps AS x1,
			LEAD(x.timestamps) OVER (ORDER BY x.timestamps) AS x2,
			x.cumulative_attributed AS y1,
			LEAD(x.cumulative_attributed) OVER (ORDER BY x.timestamps) AS y2
		FROM
		unnest(timestamps, cumulative_attributed) as x(timestamps, cumulative_attributed)
	) AS x
	WHERE 
		x1 <= ts - lookback_period AND ts - lookback_period <= x2;

	-- check if recent attributions have been big enough
	insufficient_decay_speed := (cumulative_attributed[1] - cumulative_attributed[array_length(cumulative_attributed, 1)] < min_rate * (array_length(cumulative_attributed, 1)));
	
	-- When recent attribution has been too slow increase minimum attribution to min_rate
	observed_attribution := observed * min_rate / total_min_rate;

	minimum_attribution := GREATEST(
		CASE WHEN insufficient_decay_speed THEN min_rate ELSE null END, 
		observed_attribution
	);

	-- wer're calculating carbs on board, so cap the attributed to user reported carbs
	next_cumulative_attributed := LEAST(
	  amount,
	  GREATEST(
		cumulative_attributed[1] + minimum_attribution,
		0
	  )
	);

	-- prepend and return
    return (array_prepend(next_cumulative_attributed, cumulative_attributed))[1:20];
END;
$$ LANGUAGE plpgsql;

