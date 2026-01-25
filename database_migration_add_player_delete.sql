-- Add DELETE policy for players table
-- Run this script in your Supabase SQL editor

-- Create DELETE policy for players (user-specific through sessions)
CREATE POLICY "Users can delete players in their sessions" ON players
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = players.session_id 
            AND sessions.user_id = auth.uid()
        )
    );

