-- Custom SQL migration file, put you code below! --

CREATE OR REPLACE FUNCTION total_insulin_absorbed(t TIMESTAMP, start TIMESTAMP, amount DOUBLE PRECISION)
RETURNS NUMERIC AS $$
DECLARE
  minutes_diff NUMERIC;
BEGIN
  minutes_diff := minutes_between(t, start);
  
  IF minutes_diff < 0 THEN
    RETURN 0;
  END IF;

  IF minutes_diff > 450 THEN
    RETURN amount;
  END IF;

  RETURN (1 - (minutes_diff / 55 + 1) * exp(-minutes_diff / 55)) * amount;
END;
$$ LANGUAGE plpgsql;
