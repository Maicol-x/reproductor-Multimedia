export interface Migration {
  version: number;
  description: string;
  sql: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Initial schema with watch_locations, media_files, movies, series, seasons, episodes, playback, playlists, jobs, settings',
    sql: [
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL,
        description TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS watch_locations (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        is_enabled INTEGER NOT NULL DEFAULT 1,
        last_scanned_at INTEGER,
        item_count INTEGER NOT NULL DEFAULT 0
      );`,
      `CREATE TABLE IF NOT EXISTS media_files (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        size INTEGER NOT NULL,
        extension TEXT NOT NULL,
        duration REAL NOT NULL DEFAULT 0,
        width INTEGER,
        height INTEGER,
        video_codec TEXT,
        audio_codec TEXT,
        channels INTEGER,
        sample_rate INTEGER,
        bitrate INTEGER,
        fps REAL,
        container TEXT,
        date_added INTEGER NOT NULL,
        date_modified INTEGER NOT NULL,
        last_played_at INTEGER,
        playback_position REAL NOT NULL DEFAULT 0,
        is_watched INTEGER NOT NULL DEFAULT 0,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        original_title TEXT,
        year INTEGER,
        series_title TEXT,
        season_number INTEGER,
        episode_number INTEGER,
        episode_title TEXT,
        overview TEXT,
        genres TEXT,
        poster_url TEXT,
        backdrop_url TEXT,
        tmdb_id INTEGER,
        user_modified INTEGER NOT NULL DEFAULT 0
      );`,
      `CREATE INDEX IF NOT EXISTS idx_media_kind ON media_files(kind);`,
      `CREATE INDEX IF NOT EXISTS idx_media_series ON media_files(series_title, season_number, episode_number);`,
      `CREATE INDEX IF NOT EXISTS idx_media_last_played ON media_files(last_played_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_media_is_watched ON media_files(is_watched);`,
      `CREATE TABLE IF NOT EXISTS movies (
        id TEXT PRIMARY KEY,
        media_file_id TEXT NOT NULL,
        title TEXT NOT NULL,
        original_title TEXT,
        year INTEGER,
        duration REAL,
        overview TEXT,
        poster_url TEXT,
        backdrop_url TEXT,
        tmdb_id INTEGER,
        FOREIGN KEY(media_file_id) REFERENCES media_files(id) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS series (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL UNIQUE,
        original_title TEXT,
        year INTEGER,
        overview TEXT,
        poster_url TEXT,
        backdrop_url TEXT,
        tmdb_id INTEGER,
        season_count INTEGER NOT NULL DEFAULT 1,
        episode_count INTEGER NOT NULL DEFAULT 1
      );`,
      `CREATE TABLE IF NOT EXISTS seasons (
        id TEXT PRIMARY KEY,
        series_id TEXT NOT NULL,
        season_number INTEGER NOT NULL,
        name TEXT,
        overview TEXT,
        poster_url TEXT,
        episode_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(series_id) REFERENCES series(id) ON DELETE CASCADE,
        UNIQUE(series_id, season_number)
      );`,
      `CREATE TABLE IF NOT EXISTS episodes (
        id TEXT PRIMARY KEY,
        media_file_id TEXT NOT NULL,
        series_id TEXT NOT NULL,
        season_id TEXT,
        season_number INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        overview TEXT,
        duration REAL,
        still_url TEXT,
        FOREIGN KEY(media_file_id) REFERENCES media_files(id) ON DELETE CASCADE,
        FOREIGN KEY(series_id) REFERENCES series(id) ON DELETE CASCADE,
        UNIQUE(series_id, season_number, episode_number)
      );`,
      `CREATE TABLE IF NOT EXISTS playback_history (
        id TEXT PRIMARY KEY,
        media_file_id TEXT NOT NULL,
        played_at INTEGER NOT NULL,
        position REAL NOT NULL,
        duration REAL NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(media_file_id) REFERENCES media_files(id) ON DELETE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS idx_playback_history_played_at ON playback_history(played_at DESC);`,
      `CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        is_smart INTEGER NOT NULL DEFAULT 0,
        smart_type TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS playlist_items (
        id TEXT PRIMARY KEY,
        playlist_id TEXT NOT NULL,
        media_file_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        added_at INTEGER NOT NULL,
        FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY(media_file_id) REFERENCES media_files(id) ON DELETE CASCADE,
        UNIQUE(playlist_id, media_file_id)
      );`,
      `CREATE TABLE IF NOT EXISTS media_jobs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        input_path TEXT NOT NULL,
        input_title TEXT NOT NULL,
        output_path TEXT NOT NULL,
        status TEXT NOT NULL,
        progress REAL NOT NULL DEFAULT 0,
        speed TEXT,
        elapsed_seconds INTEGER NOT NULL DEFAULT 0,
        remaining_seconds INTEGER,
        error TEXT,
        options_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        started_at INTEGER,
        finished_at INTEGER
      );`,
      `CREATE INDEX IF NOT EXISTS idx_media_jobs_status ON media_jobs(status);`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS exclusions (
        id TEXT PRIMARY KEY,
        pattern TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
      );`
    ]
  }
];
