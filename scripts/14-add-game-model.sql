-- Migration: Add game_model column to game_sessions table
-- This adds support for different game models: normal and submarine

-- Add game_model column to game_sessions table
ALTER TABLE public.game_sessions 
ADD COLUMN game_model TEXT DEFAULT 'normal'
CHECK (game_model IN ('normal', 'submarine'));

-- Add comment to describe the column
COMMENT ON COLUMN public.game_sessions.game_model IS 
'Game model type: normal for standard quiz, submarine for flexible navigation quiz';

-- Update existing records to have default value
UPDATE public.game_sessions 
SET game_model = 'normal' 
WHERE game_model IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE public.game_sessions 
ALTER COLUMN game_model SET NOT NULL;

-- Create index for better performance
CREATE INDEX idx_game_sessions_game_model ON public.game_sessions(game_model);

-- Update the RLS policies if needed (they should work with the new column)
-- No additional RLS policies needed as the existing ones will handle the new column

-- Create a function to get game model statistics (optional)
CREATE OR REPLACE FUNCTION get_game_model_stats()
RETURNS TABLE(game_model TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT gs.game_model, COUNT(*)
    FROM public.game_sessions gs
    GROUP BY gs.game_model
    ORDER BY gs.game_model;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_game_model_stats() TO authenticated;