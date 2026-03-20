-- Categories Game Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    host_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    current_round INTEGER DEFAULT 0,
    total_rounds INTEGER DEFAULT 5,
    current_letter TEXT,
    letter_picker_id TEXT,
    round_start_time BIGINT,
    round_duration INTEGER DEFAULT 60,
    settings JSONB NOT NULL DEFAULT '{"roundDuration": 60, "totalRounds": 5, "maxPlayers": 8}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players Table
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    photo_url TEXT,
    is_host BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    score INTEGER DEFAULT 0,
    has_submitted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, telegram_id)
);

-- Round Answers Table
CREATE TABLE IF NOT EXISTS round_answers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    letter TEXT NOT NULL,
    female_name TEXT DEFAULT '',
    male_name TEXT DEFAULT '',
    flower TEXT DEFAULT '',
    fruit TEXT DEFAULT '',
    animal TEXT DEFAULT '',
    city TEXT DEFAULT '',
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, round_number, player_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_players_session ON players(session_id);
CREATE INDEX IF NOT EXISTS idx_players_telegram ON players(telegram_id);
CREATE INDEX IF NOT EXISTS idx_answers_session ON round_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON game_sessions(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_answers ENABLE ROW LEVEL SECURITY;

-- Policies for game_sessions
CREATE POLICY "Anyone can read game sessions" ON game_sessions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create game sessions" ON game_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update game sessions" ON game_sessions
    FOR UPDATE USING (true);

-- Policies for players
CREATE POLICY "Anyone can read players" ON players
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create players" ON players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update players" ON players
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete players" ON players
    FOR DELETE USING (true);

-- Policies for round_answers
CREATE POLICY "Anyone can read round answers" ON round_answers
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create round answers" ON round_answers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update round answers" ON round_answers
    FOR UPDATE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for game_sessions
CREATE TRIGGER update_game_sessions_updated_at
    BEFORE UPDATE ON game_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old sessions (call via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
    -- Delete sessions older than 30 minutes with no activity
    DELETE FROM game_sessions 
    WHERE updated_at < NOW() - INTERVAL '30 minutes'
    AND status = 'waiting';
    
    -- Delete finished sessions older than 1 hour
    DELETE FROM game_sessions 
    WHERE updated_at < NOW() - INTERVAL '1 hour'
    AND status = 'finished';
END;
$$ LANGUAGE plpgsql;

-- Realtime publication
-- Run this in Supabase SQL Editor to enable realtime
-- ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE players;
-- ALTER PUBLICATION supabase_realtime ADD TABLE round_answers;

-- Insert sample data for testing (optional)
-- INSERT INTO game_sessions (id, host_id, status, settings)
-- VALUES ('test-session', 'test-player', 'waiting', '{"roundDuration": 60, "totalRounds": 5, "maxPlayers": 8}'::jsonb);