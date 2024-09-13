-- Custom SQL migration file, put you code below! --

CREATE OR REPLACE FUNCTION minutes_between(t1 TIMESTAMP, t2 TIMESTAMP)
RETURNS NUMERIC AS $$
BEGIN
  RETURN EXTRACT(EPOCH FROM t1)) - (EXTRACT(EPOCH FROM t2) / 60;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION total_insulin_absorbed(t TIMESTAMP, start TIMESTAMP, amount DOUBLE PRECISION)
RETURNS NUMERIC AS $$
DECLARE
  minutes_diff NUMERIC;
BEGIN
  minutes_diff := minutes_between(t, start);
  
  IF minutes_diff < 0 THEN
    RETURN 0;
  END IF;

  IF minutes_diff > 300 THEN
    RETURN amount;
  END IF;

  RETURN (1 - (minutes_diff / 55 + 1) * exp(-minutes_diff / 55)) * amount;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION total_carbs_absorbed(t TIMESTAMP, start TIMESTAMP, amount DOUBLE PRECISION, decay INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    minutes_diff NUMERIC;
    "end" TIMESTAMP;
BEGIN
    minutes_diff := minutes_between(t, start);
    "end" := start + MAKE_INTERVAL(mins => decay);
    
    IF minutes_diff < 0 THEN
      RETURN 0;
    END IF;

    IF (t >= start AND t < "end") THEN 
      RETURN amount * minutes_diff / decay;
    END IF;
	
	IF (t >= "end") THEN
		RETURN amount;
	END IF;

	RETURN 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION interpolate_glucose(t TIMESTAMP, x1 TIMESTAMP, x2 TIMESTAMP, y1 DOUBLE PRECISION, y2 DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    IF (t < x1 OR t > x2) THEN
      RETURN null;
    END IF;

    -- If interpolated range is too long just use last known value
    IF (minutes_between(x1, x2) > 15) THEN
      RETURN y1;
    END IF;

    return y1 + (y2 - y1) / EXTRACT(EPOCH FROM(x2 - x1)) * EXTRACT (EPOCH FROM (t - x1));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION observed_carbs(
  glucose_chnage DOUBLE PRECISION, 
  insulin_change DOUBLE PRECISION, 
  ISF DOUBLE PRECISION,
  ICR DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN COALESCE(glucose_chnage * (ICR / ISF) + insulin_change * ICR, 0);
END;
$$ LANGUAGE plpgsql;