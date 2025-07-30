-- Create the game_chat_messages table
CREATE TABLE IF NOT EXISTS game_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nickname TEXT NOT NULL,
    message TEXT NOT NULL,
    avatar_url TEXT,
    is_important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for read receipts
CREATE TABLE IF NOT EXISTS game_chat_read_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES game_chat_messages(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    avatar_url TEXT,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one receipt per user per message
    UNIQUE(message_id, user_id)
);

-- Create function to compile read receipts into an array for messages
CREATE OR REPLACE FUNCTION get_message_read_receipts()
RETURNS TRIGGER AS $$
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS temp_read_receipts (
        message_id UUID,
        readers JSONB
    ) ON COMMIT DROP;
    
    TRUNCATE temp_read_receipts;
    
    -- Aggregate readers by message_id
    INSERT INTO temp_read_receipts
    SELECT 
        r.message_id,
        jsonb_agg(
            jsonb_build_object(
                'user_id', r.user_id,
                'nickname', r.nickname,
                'avatar_url', r.avatar_url,
                'read_at', r.read_at
            )
        ) as readers
    FROM game_chat_read_receipts r
    GROUP BY r.message_id;
    
    -- Update messages with reader info
    UPDATE game_chat_messages m
    SET read_by = (
        SELECT readers FROM temp_read_receipts tr
        WHERE tr.message_id = m.id
    )
    WHERE m.session_id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_chat_messages_session_id ON game_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_game_chat_messages_created_at ON game_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_game_chat_read_receipts_message_id ON game_chat_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_game_chat_read_receipts_session_id ON game_chat_read_receipts(session_id);

-- Add column for read_by to messages if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'game_chat_messages' AND column_name = 'read_by'
    ) THEN
        ALTER TABLE game_chat_messages ADD COLUMN read_by JSONB DEFAULT NULL;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE game_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_chat_read_receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for game_chat_messages
-- 1. Allow anyone to read messages for a game session they're participating in
CREATE POLICY "Anyone can view messages for sessions they're in" ON game_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_participants 
            WHERE game_participants.session_id = game_chat_messages.session_id 
            AND (
                game_participants.user_id = auth.uid() OR 
                (SELECT host_id FROM game_sessions WHERE id = game_chat_messages.session_id) = auth.uid()
            )
        ) OR 
        EXISTS (
            SELECT 1 FROM game_sessions 
            WHERE game_sessions.id = game_chat_messages.session_id 
            AND game_sessions.host_id = auth.uid()
        )
    );

-- 2. Allow participants to insert messages
CREATE POLICY "Participants can insert messages" ON game_chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM game_participants 
            WHERE game_participants.session_id = game_chat_messages.session_id 
            AND (
                game_participants.user_id = auth.uid() OR
                (SELECT host_id FROM game_sessions WHERE id = game_chat_messages.session_id) = auth.uid()
            )
        ) OR 
        EXISTS (
            SELECT 1 FROM game_sessions 
            WHERE game_sessions.id = game_chat_messages.session_id 
            AND game_sessions.host_id = auth.uid()
        )
    );

-- 3. Allow users to update only their own messages
CREATE POLICY "Users can update own messages" ON game_chat_messages
    FOR UPDATE USING (
        user_id = auth.uid()
    );

-- 4. Allow users to delete only their own messages
CREATE POLICY "Users can delete own messages" ON game_chat_messages
    FOR DELETE USING (
        user_id = auth.uid()
    );

-- Create RLS policies for read receipts
-- 1. Anyone can view read receipts for sessions they're in
CREATE POLICY "Anyone can view read receipts" ON game_chat_read_receipts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_participants 
            WHERE game_participants.session_id = game_chat_read_receipts.session_id 
            AND (
                game_participants.user_id = auth.uid() OR 
                (SELECT host_id FROM game_sessions WHERE id = game_chat_read_receipts.session_id) = auth.uid()
            )
        ) OR 
        EXISTS (
            SELECT 1 FROM game_sessions 
            WHERE game_sessions.id = game_chat_read_receipts.session_id 
            AND game_sessions.host_id = auth.uid()
        )
    );

-- 2. Participants can insert their own read receipts
CREATE POLICY "Participants can insert read receipts" ON game_chat_read_receipts
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- Create trigger for read receipts
CREATE TRIGGER trigger_message_read_receipts
AFTER INSERT OR UPDATE ON game_chat_read_receipts
FOR EACH ROW
EXECUTE FUNCTION get_message_read_receipts();

-- Enable realtime for chat messages and related tables
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE game_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE game_chat_read_receipts;

-- Create function to notify about new chat messages
CREATE OR REPLACE FUNCTION notify_new_chat_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_chat_message',
    json_build_object(
      'id', NEW.id,
      'session_id', NEW.session_id,
      'nickname', NEW.nickname,
      'message', NEW.message,
      'created_at', NEW.created_at,
      'is_important', NEW.is_important
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new chat message notifications
CREATE TRIGGER trigger_new_chat_message
AFTER INSERT ON game_chat_messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_chat_message(); 