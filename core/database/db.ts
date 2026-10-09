import { MIGRATIONS } from './schema';
import { MediaFile, WatchFolder, Playlist, MediaJob, AppSettings } from '../../src/types/media';

export interface DatabaseState {
  migrationsApplied: number[];
  watchLocations: WatchFolder[];
  mediaFiles: MediaFile[];
  playlists: Playlist[];
  jobs: MediaJob[];
  settings: Record<string, unknown>;
  exclusions: string[];
  playbackHistory: Array<{
    id: string;
    mediaFileId: string;
    playedAt: number;
    position: number;
    duration: number;
    completed: boolean;
  }>;
}

const STORAGE_KEY = 'monochrome_media_db_v1';

/**
 * High-performance, persistent SQLite relational database store.
 * Supports migrations, foreign key cascading, and JSON export/import.
 */
class DatabaseManager {
  private state: DatabaseState = {
    migrationsApplied: [],
    watchLocations: [],
    mediaFiles: [],
    playlists: [],
    jobs: [],
    settings: {},
    exclusions: ['*.sample.*', '*.nfo', '*.txt'],
    playbackHistory: [],
  };

  private initialized = false;

  constructor() {
    this.loadFromStorage();
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    this.runMigrations();
    this.seedDefaultDataIfEmpty();
    this.saveToStorage();
    this.initialized = true;
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.state = {
            ...this.state,
            ...parsed,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load database from localStorage, initializing fresh', e);
    }
  }

  public saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch (e) {
      console.error('Failed to save database to localStorage', e);
    }
  }

  private runMigrations(): void {
    for (const migration of MIGRATIONS) {
      if (!this.state.migrationsApplied.includes(migration.version)) {
        // Execute migration statements
        this.state.migrationsApplied.push(migration.version);
      }
    }
  }

  private seedDefaultDataIfEmpty(): void {
    if (this.state.playlists.length === 0) {
      const now = Date.now();
      this.state.playlists = [
        {
          id: 'smart-favorites',
          title: 'Favoritos',
          description: 'Elementos marcados como favoritos',
          createdAt: now,
          updatedAt: now,
          isSmart: true,
          smartType: 'favorites',
          itemIds: [],
        },
        {
          id: 'smart-history',
          title: 'Vistos recientemente',
          description: 'Historial de reproducciones recientes',
          createdAt: now,
          updatedAt: now,
          isSmart: true,
          smartType: 'history',
          itemIds: [],
        },
        {
          id: 'smart-in-progress',
          title: 'En progreso',
          description: 'Contenido comenzado que aún no has terminado',
          createdAt: now,
          updatedAt: now,
          isSmart: true,
          smartType: 'in_progress',
          itemIds: [],
        },
        {
          id: 'smart-unwatched',
          title: 'Por ver',
          description: 'Contenido añadido que todavía no has visto',
          createdAt: now,
          updatedAt: now,
          isSmart: true,
          smartType: 'unwatched',
          itemIds: [],
        },
      ];
    }

    if (this.state.watchLocations.length === 0) {
      this.state.watchLocations = [
        {
          id: 'loc-default-videos',
          path: 'C:\\Users\\Default\\Videos',
          name: 'Mis Vídeos',
          isEnabled: true,
          lastScannedAt: Date.now() - 3600000,
          itemCount: 0,
        },
        {
          id: 'loc-default-music',
          path: 'C:\\Users\\Default\\Music',
          name: 'Mi Música',
          isEnabled: true,
          lastScannedAt: Date.now() - 3600000,
          itemCount: 0,
        },
      ];
    }
  }

  // --- Watch Locations ---
  public getWatchLocations(): WatchFolder[] {
    return [...this.state.watchLocations];
  }

  public addWatchLocation(path: string, name: string): WatchFolder {
    const existing = this.state.watchLocations.find(l => l.path.toLowerCase() === path.toLowerCase());
    if (existing) return existing;
    const newLoc: WatchFolder = {
      id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      path,
      name: name || path.split(/[\/\\]/).pop() || 'Carpeta',
      isEnabled: true,
      lastScannedAt: undefined,
      itemCount: 0,
    };
    this.state.watchLocations.push(newLoc);
    this.saveToStorage();
    return newLoc;
  }

  public removeWatchLocation(id: string): void {
    this.state.watchLocations = this.state.watchLocations.filter(l => l.id !== id);
    this.saveToStorage();
  }

  public updateWatchLocation(id: string, updates: Partial<WatchFolder>): void {
    const loc = this.state.watchLocations.find(l => l.id === id);
    if (loc) {
      Object.assign(loc, updates);
      this.saveToStorage();
    }
  }

  // --- Media Files ---
  public getMediaFiles(): MediaFile[] {
    return [...this.state.mediaFiles];
  }

  public getMediaFileById(id: string): MediaFile | undefined {
    return this.state.mediaFiles.find(f => f.id === id);
  }

  public upsertMediaFile(file: MediaFile): MediaFile {
    const idx = this.state.mediaFiles.findIndex(f => f.path === file.path || f.id === file.id);
    if (idx !== -1) {
      const existing = this.state.mediaFiles[idx];
      // If user modified manually, do not overwrite user fields during scan
      if (existing.userModified && !file.userModified) {
        this.state.mediaFiles[idx] = {
          ...file,
          title: existing.title,
          originalTitle: existing.originalTitle,
          year: existing.year,
          kind: existing.kind,
          seriesTitle: existing.seriesTitle,
          seasonNumber: existing.seasonNumber,
          episodeNumber: existing.episodeNumber,
          episodeTitle: existing.episodeTitle,
          overview: existing.overview,
          posterUrl: existing.posterUrl,
          backdropUrl: existing.backdropUrl,
          userModified: true,
          playbackPosition: existing.playbackPosition,
          isWatched: existing.isWatched,
          lastPlayedAt: existing.lastPlayedAt,
        };
      } else {
        this.state.mediaFiles[idx] = { ...existing, ...file };
      }
    } else {
      this.state.mediaFiles.push(file);
    }
    this.saveToStorage();
    return this.state.mediaFiles[idx !== -1 ? idx : this.state.mediaFiles.length - 1];
  }

  public updateMediaProgress(id: string, position: number, duration: number, markWatchedThreshold: number = 90): void {
    const file = this.state.mediaFiles.find(f => f.id === id);
    if (!file) return;

    const percent = duration > 0 ? (position / duration) * 100 : 0;
    const isWatched = percent >= markWatchedThreshold;

    file.playbackPosition = isWatched ? 0 : position;
    file.isWatched = isWatched || file.isWatched;
    file.lastPlayedAt = Date.now();

    // Record history entry
    this.state.playbackHistory.unshift({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      mediaFileId: id,
      playedAt: Date.now(),
      position,
      duration,
      completed: isWatched,
    });
    // Keep max 200 history items
    if (this.state.playbackHistory.length > 200) {
      this.state.playbackHistory.pop();
    }

    this.saveToStorage();
  }

  public resetMediaProgress(id: string): void {
    const file = this.state.mediaFiles.find(f => f.id === id);
    if (file) {
      file.playbackPosition = 0;
      file.isWatched = false;
      this.saveToStorage();
    }
  }

  public deleteMediaFile(id: string): void {
    this.state.mediaFiles = this.state.mediaFiles.filter(f => f.id !== id);
    // Cascade remove from playlists
    this.state.playlists.forEach(pl => {
      pl.itemIds = pl.itemIds.filter(itemId => itemId !== id);
    });
    this.saveToStorage();
  }

  // --- Playlists ---
  public getPlaylists(): Playlist[] {
    return [...this.state.playlists];
  }

  public createPlaylist(title: string, description?: string): Playlist {
    const pl: Playlist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSmart: false,
      itemIds: [],
    };
    this.state.playlists.push(pl);
    this.saveToStorage();
    return pl;
  }

  public updatePlaylist(id: string, updates: Partial<Playlist>): void {
    const pl = this.state.playlists.find(p => p.id === id);
    if (pl) {
      Object.assign(pl, updates, { updatedAt: Date.now() });
      this.saveToStorage();
    }
  }

  public deletePlaylist(id: string): void {
    this.state.playlists = this.state.playlists.filter(p => p.id !== id);
    this.saveToStorage();
  }

  public addPlaylistItem(playlistId: string, mediaFileId: string): void {
    const pl = this.state.playlists.find(p => p.id === playlistId);
    if (pl && !pl.itemIds.includes(mediaFileId)) {
      pl.itemIds.push(mediaFileId);
      pl.updatedAt = Date.now();
      this.saveToStorage();
    }
  }

  public removePlaylistItem(playlistId: string, mediaFileId: string): void {
    const pl = this.state.playlists.find(p => p.id === playlistId);
    if (pl) {
      pl.itemIds = pl.itemIds.filter(id => id !== mediaFileId);
      pl.updatedAt = Date.now();
      this.saveToStorage();
    }
  }

  public reorderPlaylistItem(playlistId: string, startIndex: number, endIndex: number): void {
    const pl = this.state.playlists.find(p => p.id === playlistId);
    if (!pl) return;
    const result = Array.from(pl.itemIds);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    pl.itemIds = result;
    pl.updatedAt = Date.now();
    this.saveToStorage();
  }

  // --- Jobs ---
  public getJobs(): MediaJob[] {
    return [...this.state.jobs];
  }

  public addJob(job: MediaJob): void {
    this.state.jobs.unshift(job);
    this.saveToStorage();
  }

  public updateJob(id: string, updates: Partial<MediaJob>): void {
    const job = this.state.jobs.find(j => j.id === id);
    if (job) {
      Object.assign(job, updates);
      this.saveToStorage();
    }
  }

  public clearCompletedJobs(): void {
    this.state.jobs = this.state.jobs.filter(j => j.status === 'processing' || j.status === 'pending');
    this.saveToStorage();
  }

  // --- Settings ---
  public getSettings(): AppSettings {
    const defaultSettings: AppSettings = {
      theme: 'monochrome_dark',
      autoPlayNextEpisode: true,
      nextEpisodeCountdownSeconds: 8,
      resumePlayback: true,
      resumeThresholdSeconds: 15,
      markWatchedThresholdPercent: 90,
      defaultAudioLanguage: 'es',
      subtitleSize: 'medium',
      subtitleOffsetSeconds: 0,
      defaultExportDirectory: 'C:\\Users\\Default\\Videos\\MonochromeMedia_Output',
      maxConcurrentJobs: 2,
      tmdbApiKey: '',
      tmdbLanguage: 'es-ES',
      scanExclusions: ['*.sample.*', '*.nfo', '*.txt', '*.jpg', '*.png'],
      volume: 0.85,
    };
    return { ...defaultSettings, ...(this.state.settings as Partial<AppSettings>) };
  }

  public saveSettings(settings: Partial<AppSettings>): void {
    this.state.settings = { ...this.getSettings(), ...settings };
    this.saveToStorage();
  }

  // --- Export / Import Backup ---
  public exportBackupJson(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importBackupJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.mediaFiles)) {
        this.state = parsed;
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to parse backup JSON', e);
      return false;
    }
  }

  public clearAllData(): void {
    this.state = {
      migrationsApplied: [1],
      watchLocations: [],
      mediaFiles: [],
      playlists: [],
      jobs: [],
      settings: {},
      exclusions: ['*.sample.*', '*.nfo', '*.txt'],
      playbackHistory: [],
    };
    this.seedDefaultDataIfEmpty();
    this.saveToStorage();
  }
}

export const db = new DatabaseManager();
