PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS leaderboard_teams (
  team_id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL,
  house TEXT NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0
    CHECK (completed_count BETWEEN 0 AND 8),
  elapsed_seconds INTEGER NOT NULL DEFAULT 0
    CHECK (elapsed_seconds >= 0),
  finished INTEGER NOT NULL DEFAULT 0
    CHECK (finished IN (0, 1)),
  finish_time TEXT,
  last_seq INTEGER NOT NULL DEFAULT 0
    CHECK (last_seq >= 0),
  last_event_type TEXT NOT NULL DEFAULT 'REGISTER',
  first_seen_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_finished_elapsed
  ON leaderboard_teams (finished DESC, elapsed_seconds ASC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_progress
  ON leaderboard_teams (completed_count DESC, elapsed_seconds ASC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_house
  ON leaderboard_teams (house, completed_count DESC);
