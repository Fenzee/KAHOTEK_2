-- Comprehensive Setup Script for Submarine Integration
-- This script sets up all necessary database configurations for submarine game integration
-- Run this script in your Supabase SQL editor

-- First, ensure all base tables exist (run 01-create-tables.sql if not already done)

-- Add game_model column to game_sessions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_sessions' 
        AND column_name = 'game_model'
    ) THEN
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
    END IF;
END $$;

-- Ensure game_end_mode column exists (from previous migrations)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_sessions' 
        AND column_name = 'game_end_mode'
    ) THEN
        ALTER TABLE public.game_sessions 
        ADD COLUMN game_end_mode TEXT DEFAULT 'wait_timer'
        CHECK (game_end_mode IN ('first_finish', 'wait_timer'));
        
        COMMENT ON COLUMN public.game_sessions.game_end_mode IS
        'Game ending mode: first_finish = ends when first player finishes, wait_timer = waits for timer';
        
        UPDATE public.game_sessions 
        SET game_end_mode = 'wait_timer'
        WHERE game_end_mode IS NULL;
        
        ALTER TABLE public.game_sessions 
        ALTER COLUMN game_end_mode SET NOT NULL;
        
        CREATE INDEX idx_game_sessions_game_end_mode ON public.game_sessions(game_end_mode);
    END IF;
END $$;

-- Ensure total_time_minutes and countdown_started_at columns exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_sessions' 
        AND column_name = 'total_time_minutes'
    ) THEN
        ALTER TABLE public.game_sessions 
        ADD COLUMN total_time_minutes INTEGER;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_sessions' 
        AND column_name = 'countdown_started_at'
    ) THEN
        ALTER TABLE public.game_sessions 
        ADD COLUMN countdown_started_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create or replace utility functions for game model management
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

-- Create function to validate game model transitions
CREATE OR REPLACE FUNCTION validate_game_model_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent changing game model after game has started
    IF OLD.status != 'waiting' AND OLD.game_model != NEW.game_model THEN
        RAISE EXCEPTION 'Cannot change game model after game has started';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for game model validation
DROP TRIGGER IF EXISTS validate_game_model_trigger ON public.game_sessions;
CREATE TRIGGER validate_game_model_trigger
    BEFORE UPDATE ON public.game_sessions
    FOR EACH ROW
    EXECUTE FUNCTION validate_game_model_transition();

-- Ensure RLS policies are properly configured
-- (These should already exist from previous migrations, but we'll ensure they work with new columns)

-- Create policy for game model access if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'game_sessions' 
        AND policyname = 'Users can view game sessions they participate in or host'
    ) THEN
        CREATE POLICY "Users can view game sessions they participate in or host"
        ON public.game_sessions FOR SELECT
        USING (
            host_id = auth.uid() OR
            id IN (
                SELECT session_id FROM public.game_participants 
                WHERE user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Update existing policies to include new columns (if needed)
-- The existing policies should automatically include new columns

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_host_id ON public.game_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_quiz_id ON public.game_sessions(quiz_id);

-- Add helpful comments
COMMENT ON TABLE public.game_sessions IS 'Game sessions with support for different game models (normal/submarine)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Submarine integration setup completed successfully!';
    RAISE NOTICE 'Game models supported: normal, submarine';
    RAISE NOTICE 'Game end modes supported: first_finish, wait_timer';
END $$;