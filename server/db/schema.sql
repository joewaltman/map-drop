CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  reminder_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_timezone TEXT DEFAULT 'America/New_York',
  last_reminder_sent INTEGER DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  total_km REAL NOT NULL,
  elapsed_ms INTEGER NOT NULL,
  guesses TEXT NOT NULL,
  submitted_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, day_number)
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  started_at INTEGER NOT NULL DEFAULT (unixepoch()),
  current_round INTEGER NOT NULL DEFAULT 0,
  guesses TEXT NOT NULL DEFAULT '[]',
  completed INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_scores_day_km ON scores(day_number, total_km ASC);
