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
    ANY_VALUE(glucose) AS glucose
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
      ISF => 2,
      ICR => 10
    ) AS carbs_absorbed_observed,
	LEAD(timestamp) OVER (ORDER BY timestamp) - timestamp AS interval
  FROM basic_metrics
), observed_carbs_per_meal_per_timestamp AS (
  /* 
  TODO we can attribute carbs to only meals that are decaying. 
  
  I think we should be able to dynamically adjust the decay time. If observed absorption has been low for lets say 15-45 mins lets close the meal.
  Vice versa if observed absorption has been high lets push the decay further back. 

  We could also adjust decay based on carbs remaining: 
    - ie its not viable to assume that 200g of remaining carbs could be absorbed within 45 mins. Thus we should push decay even further
    - if carbs remaining is very low we shouldn't use long decay time in predictions

  There might me need for two decays 1) for making predictions 2) for attributing observed carbs to meals. However it might be possible to combine these two.

  Update:
  I just realized that if we do this dynamic attribution time we need to see the observed absorption every 15 mins to be able to make the decision.

  For example like this:
  1. We get new gcm reading
  2. Calculate observed carbs
  3. Split the carbs between meals based on observed_decay_rate (= carbs / observed_decay)
  4. If attributed carbs are close on ending, move observed_decay closer conservatively, and vice versa.
    - Basically do a linear fit to the historical observed to make the prediction about future
  5. Exception is that if the attributed carbs are very low for several rounds. Then instead of moving the decay_time further and further we should close the meal early.


  On critical note
  1. What is the benefit for the program to know when meal is "closed" and when not? 
    For predictions there is no benefit. We never really know when the carbs are gonna end. Best we can guess is latest trend and extrapolate it based on remaining carbs.
  2. For attributing carbs to two meals at the same time we can probably do that just with absorption rate. 
  3. Only case for closing meal is useful when previous meal is clearly ended (latest values for observed_carbs are 0) and user is adding next meal. In this case we dont want the previous meal to affect our new meal. I think we can just prompt user to close the previous meal. Anyway editing decay time should be possible by user and could be useful.

  I think I like this more and this fixes some issues I had with Loop (trying to predict something that cannot be known)
  */
  SELECT
    metrics.*,
  	carbs.*,
  	amount / decay as minimium_absorption_rate,
    SUM(amount / decay) OVER (PARTITION BY metrics.timestamp) AS total_minimium_absorption_rate, /*if there are multiple meal entries for one timestamp, sum all of their minimum_absorption_rates */
    carbs_absorbed_observed * ((amount / decay) / SUM(amount / decay) OVER (PARTITION BY metrics.timestamp)) AS observed_carbs_for_this_meal_at_this_time -- to hell with these names
  FROM metrics
  LEFT JOIN carbs
    ON metrics.timestamp >= carbs.timestamp 
    AND metrics.timestamp < carbs.timestamp + MAKE_INTERVAL(mins => carbs.decay) * 1.5 -- TODO 1.5 or 1 or something dynamical?
    -- AND carbs."userId" = '123'
)

SELECT * FROM observed_carbs_per_meal_per_timestamp