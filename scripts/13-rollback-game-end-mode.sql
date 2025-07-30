-- Rollback: Remove game_end_mode column from game_sessions table
-- Use this script if you need to rollback the game end mode feature

-- Drop the index first
DROP INDEX IF EXISTS idx_game_sessions_game_end_mode;

-- Remove the game_end_mode column
ALTER TABLE public.game_sessions 
DROP COLUMN IF EXISTS game_end_mode;

-- Note: We don't remove total_time_minutes and countdown_started_at 
-- as they might be used by other features
