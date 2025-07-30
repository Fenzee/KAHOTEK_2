-- Function to generate unique game PIN
CREATE OR REPLACE FUNCTION generate_game_pin()
RETURNS TEXT AS $$
DECLARE
  pin TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    pin := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM game_sessions WHERE game_pin = pin AND status != 'finished') INTO exists;
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN pin;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate points based on response time
CREATE OR REPLACE FUNCTION calculate_points(base_points INTEGER, response_time INTEGER, time_limit INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Points decrease based on how long it took to answer
  -- Minimum 50% of base points, maximum 100% of base points
  RETURN GREATEST(
    FLOOR(base_points * 0.5),
    FLOOR(base_points * (1 - (response_time::FLOAT / (time_limit * 1000) * 0.5)))
  );
END;
$$ LANGUAGE plpgsql;
