export const CREATE_ALARMS_TABLE = `CREATE TABLE IF NOT EXISTS alarms (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  hour INTEGER NOT NULL,
  minute INTEGER NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  repeat_days TEXT NOT NULL,
  sound_id TEXT NOT NULL,
  volume REAL NOT NULL,
  gradual_wake INTEGER NOT NULL DEFAULT 0,
  gradual_minutes INTEGER NOT NULL DEFAULT 0,
  snooze_enabled INTEGER NOT NULL DEFAULT 1,
  snooze_duration INTEGER NOT NULL DEFAULT 5,
  snooze_limit INTEGER NOT NULL DEFAULT 3,
  missions TEXT NOT NULL,
  prevent_dismiss INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  next_fire_time INTEGER NOT NULL
)`;

export const CREATE_SETTINGS_TABLE = `CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`;
