-- Custom SQL migration file, put you code below! --

CREATE OR REPLACE FUNCTION calculate_cumulative_attributed(
    active BOOLEAN,
    cumulative_attributed DOUBLE PRECISION[],
    amount DOUBLE PRECISION,
    min_rate DOUBLE PRECISION,
	total_min_rate DOUBLE PRECISION,
    observed DOUBLE PRECISION,
	lookback_period INTEGER
)
RETURNS DOUBLE PRECISION[] AS $$
DECLARE
	next_cumulative_attributed DOUBLE PRECISION;
	minimum_attribution DOUBLE PRECISION;
	insufficient_decay_speed BOOLEAN;
	observed_attribution DOUBLE PRECISION;
BEGIN
	IF NOT(active) THEN
		return cumulative_attributed;
	END IF;

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

