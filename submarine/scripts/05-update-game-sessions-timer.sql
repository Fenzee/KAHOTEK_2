-- Add timer columns to game_sessions table
ALTER TABLE game_sessions 
ADD COLUMN IF NOT EXISTS total_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;

-- Update existing sessions to have default values
UPDATE game_sessions 
SET started_at = created_at 
WHERE started_at IS NULL AND status = 'active';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_timer ON game_sessions(started_at, total_time_minutes);

-- Add constraint to ensure positive time values
ALTER TABLE game_sessions 
ADD CONSTRAINT check_positive_time 
CHECK (total_time_minutes IS NULL OR total_time_minutes > 0);
