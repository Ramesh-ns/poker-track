-- Poker Tracking App Database Schema
-- Run this script in your Supabase SQL editor to create all necessary tables

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_name VARCHAR(255) NOT NULL,
    pot_value DECIMAL(10,2) NOT NULL,
    pot_mode VARCHAR(20) NOT NULL DEFAULT 'fixed',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    pots_taken INTEGER DEFAULT 0 NOT NULL,
    pots_returned DECIMAL(10,2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sessions
CREATE POLICY "Sessions are viewable by everyone" ON sessions
    FOR SELECT USING (true);

CREATE POLICY "Sessions are insertable by everyone" ON sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Sessions are updatable by everyone" ON sessions
    FOR UPDATE USING (true);

-- Create RLS policies for players
CREATE POLICY "Players are viewable by everyone" ON players
    FOR SELECT USING (true);

CREATE POLICY "Players are insertable by everyone" ON players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Players are updatable by everyone" ON players
    FOR UPDATE USING (true);

-- Verify the tables were created successfully
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('sessions', 'players')
ORDER BY table_name, ordinal_position; 