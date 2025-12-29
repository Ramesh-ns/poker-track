-- Migration to add user_id to sessions and update RLS policies
-- Run this script in your Supabase SQL editor

-- Add user_id column to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Drop existing RLS policies for sessions
DROP POLICY IF EXISTS "Sessions are viewable by everyone" ON sessions;
DROP POLICY IF EXISTS "Sessions are insertable by everyone" ON sessions;
DROP POLICY IF EXISTS "Sessions are updatable by everyone" ON sessions;

-- Create new RLS policies for sessions (user-specific)
CREATE POLICY "Users can view their own sessions" ON sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Drop existing RLS policies for players
DROP POLICY IF EXISTS "Players are viewable by everyone" ON players;
DROP POLICY IF EXISTS "Players are insertable by everyone" ON players;
DROP POLICY IF EXISTS "Players are updatable by everyone" ON players;

-- Create new RLS policies for players (user-specific through sessions)
CREATE POLICY "Users can view players in their sessions" ON players
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = players.session_id 
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert players in their sessions" ON players
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = players.session_id 
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update players in their sessions" ON players
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = players.session_id 
            AND sessions.user_id = auth.uid()
        )
    );

-- Update RLS policy for profiles to allow INSERT during signup
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

