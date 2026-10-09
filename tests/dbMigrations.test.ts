import { describe, it, expect } from 'vitest';
import { MIGRATIONS } from '../core/database/schema';

describe('Database Schema & Migrations', () => {
  it('defines valid initial migration containing all core tables', () => {
    expect(MIGRATIONS.length).toBeGreaterThan(0);
    const initial = MIGRATIONS[0];
    expect(initial.version).toBe(1);

    const joinedSql = initial.sql.join('\n');
    expect(joinedSql).toContain('watch_locations');
    expect(joinedSql).toContain('media_files');
    expect(joinedSql).toContain('movies');
    expect(joinedSql).toContain('series');
    expect(joinedSql).toContain('seasons');
    expect(joinedSql).toContain('episodes');
    expect(joinedSql).toContain('playback_history');
    expect(joinedSql).toContain('playlists');
    expect(joinedSql).toContain('media_jobs');
    expect(joinedSql).toContain('settings');
  });
});
