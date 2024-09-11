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

CREATE OR REPLACE FUNCTION interpolate_glucose(t TIMESTAMP, x1 TIMESTAMP, x2 TIMESTAMP, y1 DOUBLE PRECISION, y2 DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    IF (t < x1 OR t > x2) THEN
      RETURN null;
    END IF;

    -- If interpolated range is too long just use last known value
    IF (minutes_between(x2, x1) > 15) THEN
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
    RETURN glucose_chnage * (ICR / ISF) + insulin_change * ICR;
END;
$$ LANGUAGE plpgsql;

WITH timeframe AS (
  SELECT timestamp AS timestamp
  FROM carbs
  -- WHERE "userId" = '123'
  -- AND timestamp > '1970-01-01'::timestamp
  -- AND timestamp < '2020-01-01'::timestamp
  UNION
  SELECT timestamp + MAKE_INTERVAL(mins => decay) AS timestamp
  FROM carbs
  -- WHERE "userId" = '123'
  -- AND timestamp > '1970-01-01'::timestamp
  -- AND timestamp < '2020-01-01'::timestamp
  -- UNION SELECT timestamp AS timestamp
  -- FROM glucose
  -- WHERE "userId" = '123'
  -- AND timestamp > '1970-01-01'::timestamp
  -- AND timestamp < '2020-01-01'::timestamp
  -- ORDER BY timestamp DESC
  -- LIMIT 1 -- TODO fix this limits all results to 1
  -- UNION SELECT '1970-01-01'::timestamp as timestamp -- add "from" to series
), interpolated_glucose AS (
  SELECT 
    timeframe.timestamp,
    ANY_VALUE(interpolate_glucose(
      t => timeframe.timestamp, 
      x1 => glucose.timestamp, 
      x2 => glucose.next_timestamp, 
      y1 => glucose.amount,
      y2 => glucose.next_amount
    )) AS glucose
  FROM timeframe
  LEFT JOIN (
    SELECT 
      amount,
      LEAD(amount) OVER (ORDER BY timestamp) AS next_amount,
	    glucose.timestamp,
      LEAD(timestamp) OVER (order BY timestamp) as next_timestamp
    FROM glucose
    -- WHERE "userId" = '123'
  ) AS glucose
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
    )), 0) AS total_carbs_absorbed
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
), basic_metrics AS (
  SELECT 
    timeframe.timestamp,
    ANY_VALUE(total_insulin_absorbed) - FIRST_VALUE(ANY_VALUE(total_insulin_absorbed)) OVER (ORDER BY timeframe.timestamp) AS insulin_absorbed,
    ANY_VALUE(total_carbs_absorbed) - FIRST_VALUE(ANY_VALUE(total_carbs_absorbed)) OVER (ORDER BY timeframe.timestamp) AS carbs_absorbed_predicted,
    ANY_VALUE(glucose) AS glucose,
    LEAD(timeframe.timestamp) OVER (ORDER BY timeframe.timestamp) - timeframe.timestamp AS interval
  FROM timeframe
  LEFT JOIN aggregated_insulin ON timeframe.timestamp = aggregated_insulin.timestamp
  LEFT JOIN aggregated_carbs ON timeframe.timestamp = aggregated_carbs.timestamp
  LEFT JOIN interpolated_glucose ON timeframe.timestamp = interpolated_glucose.timestamp
  GROUP BY timeframe.timestamp
  ORDER BY timeframe.timestamp ASC
), metrics AS (
  SELECT
    *,
    observed_carbs(
      glucose_chnage => LEAD(glucose) OVER (ORDER BY timestamp) - glucose,
      insulin_change => insulin_absorbed - LEAD(insulin_absorbed) OVER (ORDER BY timestamp),
      ISF => 2, -- TODO
      ICR => 10 --TODO
    ) AS carbs_absorbed_observed
  FROM basic_metrics
), attribute_observed_carbs_to_meals AS (
  SELECT
  metrics.timestamp AS timestamp,
  -- insulin_absorbed,
  -- carbs_absorbed_predicted,
  -- glucose,
  carbs_absorbed_observed,
  COALESCE(active_carbs.id, overtime_carbs.id, -1) AS carbs_id,
  COALESCE(active_carbs.amount, overtime_carbs.amount) AS amount,
  COALESCE(active_carbs.amount / active_carbs.decay, overtime_carbs.amount / overtime_carbs.decay) AS rate,
  SUM(COALESCE(active_carbs.amount / active_carbs.decay, overtime_carbs.amount / overtime_carbs.decay)) OVER (PARTITION BY metrics.timestamp) AS total_rate,
  COALESCE((
	  COALESCE(active_carbs.amount / active_carbs.decay, overtime_carbs.amount / overtime_carbs.decay) -- rate
  ) / (
	  SUM(COALESCE(active_carbs.amount / active_carbs.decay, overtime_carbs.amount / overtime_carbs.decay)) OVER (PARTITION BY metrics.timestamp) -- total_rate
  ) * carbs_absorbed_observed, 0) AS attributed_carbs
FROM metrics
LEFT JOIN carbs AS active_carbs
  ON active_carbs.timestamp <= metrics.timestamp
  AND active_carbs.timestamp + MAKE_INTERVAL(mins => active_carbs.decay) >= metrics.timestamp
  -- AND active_carbs.userId = '123'
LEFT JOIN carbs AS overtime_carbs
  ON overtime_carbs.timestamp + MAKE_INTERVAL(mins => overtime_carbs.decay) <= metrics.timestamp
  AND overtime_carbs.timestamp + MAKE_INTERVAL(mins => (overtime_carbs.decay * 1.5)::integer) >= metrics.timestamp
  AND active_carbs.id IS NULL
  -- AND carbs.userId = '123'
ORDER BY metrics.timestamp, carbs_id ASC
), observed_carbs_by_meal AS (
  SELECT 
    carbs_id AS id,
    SUM(attributed_carbs) AS attributed_carbs,
    ANY_VALUE(COALESCE(amount, 0)) AS amount
  FROM attribute_observed_carbs_to_meals
  GROUP BY carbs_id
  ORDER BY carbs_id ASC
)

SELECT * FROM observed_carbs_by_meal