-- Function to increment participant score
CREATE OR REPLACE FUNCTION increment_participant_score(participant_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE game_participants 
  SET score = score + points_to_add 
  WHERE id = participant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get game leaderboard
CREATE OR REPLACE FUNCTION get_game_leaderboard(session_id UUID)
RETURNS TABLE (
  participant_id UUID,
  nickname TEXT,
  score INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.id,
    gp.nickname,
    gp.score,
    ROW_NUMBER() OVER (ORDER BY gp.score DESC)::INTEGER as rank
  FROM game_participants gp
  WHERE gp.session_id = session_id
  ORDER BY gp.score DESC;
END;
$$ LANGUAGE plpgsql;
