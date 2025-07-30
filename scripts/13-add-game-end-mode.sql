-- Migration: Add game_end_mode column to game_sessions table
-- This adds support for two game ending modes:
-- 1. 'first_finish' - Game ends when first player completes
-- 2. 'wait_timer' - Game ends when timer expires (default)

-- Add game_end_mode column to game_sessions table
ALTER TABLE public.game_sessions 
ADD COLUMN game_end_mode TEXT DEFAULT 'wait_timer' 
CHECK (game_end_mode IN ('first_finish', 'wait_timer'));

-- Add comment to document the column
COMMENT ON COLUMN public.game_sessions.game_end_mode IS 
'Determines when the game ends: first_finish (when first player completes) or wait_timer (when timer expires)';

-- Update existing sessions to have default value
UPDATE public.game_sessions 
SET game_end_mode = 'wait_timer' 
WHERE game_end_mode IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE public.game_sessions 
ALTER COLUMN game_end_mode SET NOT NULL;

-- Create index for better query performance
CREATE INDEX idx_game_sessions_game_end_mode ON public.game_sessions(game_end_mode);

-- Add total_time_minutes column if it doesn't exist (for timer functionality)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_sessions' 
        AND column_name = 'total_time_minutes'
    ) THEN
        ALTER TABLE public.game_sessions 
        ADD COLUMN total_time_minutes INTEGER;
        
        COMMENT ON COLUMN public.game_sessions.total_time_minutes IS 
        'Total time limit for the quiz in minutes';
    END IF;
END $$;

-- Add countdown_started_at column if it doesn't exist (for countdown functionality)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_sessions' 
        AND column_name = 'countdown_started_at'
    ) THEN
        ALTER TABLE public.game_sessions 
        ADD COLUMN countdown_started_at TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN public.game_sessions.countdown_started_at IS 
        'Timestamp when countdown before game start began';
    END IF;
END $$;
