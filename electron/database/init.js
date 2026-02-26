import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db = null;

export function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'atlased.db');
  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    -- Expeditions (Playlists/Courses)
    CREATE TABLE IF NOT EXISTS expeditions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      thumbnail_url TEXT,
      playlist_url TEXT,
      total_waypoints INTEGER DEFAULT 0,
      completed_waypoints INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Waypoints (Videos)
    CREATE TABLE IF NOT EXISTS waypoints (
      id TEXT PRIMARY KEY,
      expedition_id TEXT NOT NULL,
      youtube_id TEXT NOT NULL,
      title TEXT NOT NULL,
      thumbnail_url TEXT,
      duration_seconds INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      last_watched_pos INTEGER DEFAULT 0,
      transcript_text TEXT,
      is_charted INTEGER DEFAULT 0,
      is_unavailable INTEGER DEFAULT 0,
      next_review_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (expedition_id) REFERENCES expeditions(id) ON DELETE CASCADE
    );

    -- Field Guides (AI-generated notes)
    CREATE TABLE IF NOT EXISTS field_guides (
      id TEXT PRIMARY KEY,
      waypoint_id TEXT UNIQUE NOT NULL,
      markdown_content TEXT,
      quiz_data_json TEXT,
      executive_summary TEXT,
      key_takeaways TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (waypoint_id) REFERENCES waypoints(id) ON DELETE CASCADE
    );

    -- Tags for knowledge graph
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Waypoint-Tag relationship (for Atlas)
    CREATE TABLE IF NOT EXISTS waypoint_tags (
      waypoint_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (waypoint_id, tag_id),
      FOREIGN KEY (waypoint_id) REFERENCES waypoints(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    -- Quiz Attempts (for SRS tracking)
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      waypoint_id TEXT NOT NULL,
      question_index INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      attempted_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (waypoint_id) REFERENCES waypoints(id) ON DELETE CASCADE
    );

    -- Notes (personal user annotations per waypoint)
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      waypoint_id TEXT NOT NULL UNIQUE,
      content TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (waypoint_id) REFERENCES waypoints(id) ON DELETE CASCADE
    );

    -- Bookmarks (timestamped markers on videos)
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      waypoint_id TEXT NOT NULL,
      timestamp_seconds REAL NOT NULL,
      label TEXT DEFAULT '',
      color TEXT DEFAULT 'gold',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (waypoint_id) REFERENCES waypoints(id) ON DELETE CASCADE
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_waypoints_expedition ON waypoints(expedition_id);
    CREATE INDEX IF NOT EXISTS idx_waypoints_youtube ON waypoints(youtube_id);
    CREATE INDEX IF NOT EXISTS idx_field_guides_waypoint ON field_guides(waypoint_id);
    CREATE INDEX IF NOT EXISTS idx_waypoint_tags_waypoint ON waypoint_tags(waypoint_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_waypoint ON quiz_attempts(waypoint_id);
    CREATE INDEX IF NOT EXISTS idx_notes_waypoint ON notes(waypoint_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_waypoint ON bookmarks(waypoint_id);
  `);

  console.log('Database initialized at:', dbPath);
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}
