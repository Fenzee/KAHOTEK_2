-- Fungsi untuk menghitung rata-rata waktu pengerjaan soal (semua soal, baik benar maupun salah)
CREATE OR REPLACE FUNCTION average_response_time(
  session_id_input uuid,
  participant_id_input uuid
)
RETURNS FLOAT AS $$
DECLARE
  avg_time FLOAT;
BEGIN
  SELECT AVG(calculate_response_time(r.started_at, r.ended_at))
  INTO avg_time
  FROM game_responses r
  WHERE r.session_id = session_id_input
    AND r.participant_id = participant_id_input
    AND r.started_at IS NOT NULL
    AND r.ended_at IS NOT NULL;
  
  RETURN COALESCE(avg_time, 0);
END;
$$ LANGUAGE plpgsql;

-- Fungsi untuk mendapatkan ranking dengan tiebreaker menggunakan rata-rata waktu dari semua soal
CREATE OR REPLACE FUNCTION get_leaderboard_with_tiebreaker(session_id_input uuid)
RETURNS TABLE (
  participant_id uuid,
  nickname text,
  score integer,
  avg_time float,
  rank integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as participant_id,
    p.nickname,
    p.score,
    average_response_time(session_id_input, p.id) as avg_time,
    RANK() OVER (
      ORDER BY p.score DESC, 
      average_response_time(session_id_input, p.id) ASC
    )::integer as rank
  FROM game_participants p
  WHERE p.session_id = session_id_input
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql; 