-- Custom SQL migration file, put you code below! --

CREATE OR REPLACE FUNCTION observed_carbs(
  glucose_chnage DOUBLE PRECISION, 
  insulin_change DOUBLE PRECISION, 
  ISF DOUBLE PRECISION,
  ICR DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN COALESCE(glucose_chnage / ICR * ISF + insulin_change * ISF, 0);
END;
$$ LANGUAGE plpgsql;