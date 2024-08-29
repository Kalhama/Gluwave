CREATE OR REPLACE FUNCTION minutes_between(start_time TIMESTAMP, end_time TIMESTAMP)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (EXTRACT(EPOCH FROM end_time) - EXTRACT(EPOCH FROM start_time)) / 60;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION total_insulin_absorbed(t TIMESTAMP, start TIMESTAMP, amount DOUBLE PRECISION)
RETURNS NUMERIC AS $$
DECLARE
  minutes_diff NUMERIC;
BEGIN
  minutes_diff := minutes_between(start, t);
  
  IF minutes_diff < 0 THEN
    RETURN 0;
  END IF;

  RETURN ((minutes_diff / 55 + 1) * exp(-minutes_diff / 55) - 1) * amount;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION total_carbs_absorbed(t TIMESTAMP, start TIMESTAMP, amount DOUBLE PRECISION, decay INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    minutes_diff NUMERIC;
    "end" TIMESTAMP;
BEGIN
    minutes_diff := minutes_between(start, t);
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

CREATE OR REPLACE FUNCTION interpolate(t TIMESTAMP, x1 TIMESTAMP, x2 TIMESTAMP, y1 DOUBLE PRECISION, y2 DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    IF (t < x1 OR t > x2) THEN
      RETURN null;
    END IF;

    return y1 + (y2 - y1) / EXTRACT(EPOCH FROM(x2 - x1)) * EXTRACT (EPOCH FROM (t - x1));
END;
$$ LANGUAGE plpgsql;
    

WITH timeframe AS (
  SELECT timestamp AS timestamp
  FROM carbs
  -- WHERE "userId" = '123'
  UNION
  SELECT timestamp + MAKE_INTERVAL(mins => decay) AS timestamp
  FROM carbs
  -- WHERE "userId" = '123'
  UNION SELECT timestamp AS timestamp
  FROM glucose
  -- WHERE "userId" = '123'
  ORDER BY timestamp DESC
  LIMIT 1
), interpolated_glucose AS (
  SELECT 
    timeframe.timestamp,
    ANY_VALUE(interpolate(
      t => timeframe.timestamp, 
      x1 => glucose.timestamp, 
      x2 => glucose.next_timestamp, 
      y1 => glucose.amount,
      y2 => glucose.next_amount
    )) AS glucose,
  FROM timeframe
  LEFT JOIN (
    SELECT 
      amount,
      LEAD(amount) OVER (ORDER BY timestamp) AS next_amount,
	    glucose.timestamp,
      LEAD(timestamp) OVER (order BY timestamp) as next_timestamp
    FROM glucose
  ) glucose
  ON glucose.timestamp < timeframe.timestamp AND glucose.next_timestamp >= timeframe.timestamp
  GROUP BY timeframe.timestamp
), aggregated_carbs AS (
  SELECT 
    timeframe.timestamp,
    /* cumulative carbs */
    COALESCE(SUM(total_carbs_absorbed(
      t => timeframe.timestamp, 
      start => carbs.timestamp, 
      amount => carbs.amount, 
      decay => carbs.decay
    )), 0) AS total_carbs_absorbed,
  FROM timeframe
  LEFT JOIN carbs 
    ON carbs.timestamp < timeframe.timestamp 
    -- AND carbs.userId = '123'
  GROUP BY timeframe.timestamp
), aggregated_insulin AS (
  SELECT 
    timeframe.timestamp,

    /* cumulative insulin */
    COALESCE(SUM(total_insulin_absorbed(
      t => timeframe.timestamp, 
      start => insulin.timestamp, 
      amount => insulin.amount
    )), 0) as total_insulin_absorbed
  FROM timeframe
  LEFT JOIN insulin
    ON insulin.timestamp < timeframe.timestamp
    -- AND insulin.userId = '123'
  GROUP BY timeframe.timestamp
)

SELECT 
  timeframe.timestamp,
  ANY_VALUE(total_insulin_absorbed) AS total_insulin_absorbed,
  ANY_VALUE(total_carbs_absorbed) AS total_carbs_absorbed,
  ANY_VALUE(glucose) AS glucose
FROM timeframe
LEFT JOIN ON timeframe.timestamp = aggregated_insulin.timestamp
LEFT JOIN ON timeframe.timestamp = aggregated_carbs.timestamp
LEFT JOIN ON timeframe.timestamp = interpolated_glucose.timestamp
GROUP BY timestamp
ORDER BY timestamp ASC
