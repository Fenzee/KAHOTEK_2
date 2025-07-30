-- Add game_model column to game_sessions table to support different game modes
-- This allows games to be configured as 'default' (regular quiz) or 'submarine' mode

-- Add game_model column with default value 'default'
ALTER TABLE game_sessions 
ADD COLUMN IF NOT EXISTS game_model VARCHAR(50) DEFAULT 'default';

-- Add a check constraint to ensure only valid game models are used
ALTER TABLE game_sessions 
ADD CONSTRAINT check_game_model 
CHECK (game_model IN ('default', 'submarine'));

-- Create an index on game_model for better query performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_model 
ON game_sessions(game_model);

-- Update any existing sessions to have the default model
UPDATE game_sessions 
SET game_model = 'default' 
WHERE game_model IS NULL;

-- Add comment to the column for documentation
COMMENT ON COLUMN game_sessions.game_model IS 'Game mode: default (regular quiz) or submarine (submarine-themed quiz with special mechanics)';

-- Optional: Create a function to get games by model
CREATE OR REPLACE FUNCTION get_games_by_model(model_type VARCHAR(50))
RETURNS TABLE (
    id UUID,
    quiz_id UUID,
    status VARCHAR(20),
    game_pin VARCHAR(6),
    game_model VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gs.id,
        gs.quiz_id,
        gs.status,
        gs.game_pin,
        gs.game_model,
        gs.created_at
    FROM game_sessions gs
    WHERE gs.game_model = model_type
    ORDER BY gs.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION get_games_by_model(VARCHAR) TO authenticated;