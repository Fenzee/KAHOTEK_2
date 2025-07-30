-- Memperbaiki fungsi calculate_score untuk menghitung skor berdasarkan jumlah soal yang dijawab dengan benar
CREATE OR REPLACE FUNCTION calculate_score(
  session_id_input uuid,
  participant_id_input uuid
) RETURNS void AS $$
DECLARE
  total_score int := 0;
BEGIN
  -- Hitung total skor dari semua jawaban yang benar
  -- Untuk setiap soal, jika jawaban benar, tambahkan poin soal tersebut ke total
  SELECT COALESCE(SUM(q.points), 0) INTO total_score
  FROM game_responses r
  JOIN answers a ON a.id = r.answer_id
  JOIN questions q ON q.id = r.question_id
  WHERE r.session_id = session_id_input
    AND r.participant_id = participant_id_input
    AND a.is_correct = true;

  -- Update skor peserta
  UPDATE game_participants
  SET score = total_score
  WHERE id = participant_id_input
    AND session_id = session_id_input;
  
  -- Log untuk debugging
  RAISE NOTICE 'Participant %: updated score to %', 
    participant_id_input, total_score;
END;
$$ LANGUAGE plpgsql; 