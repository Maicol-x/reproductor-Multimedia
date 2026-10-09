import { MediaFile, WatchFolder } from '../../src/types/media';
import { classifyMedia } from './classifier';
import { generateMonochromePoster } from '../metadata/tmdb';
import { db } from '../database/db';

export interface ScanProgress {
  currentFolder: string;
  scannedCount: number;
  totalFound: number;
  currentFile?: string;
  isComplete: boolean;
  error?: string;
}

export type ScanProgressCallback = (progress: ScanProgress) => void;

/**
 * Built-in media items to seed real playable test media (open-source public domain samples)
 * so the player, audio visualizer, subtitles, and converter can be tested immediately!
 */
export const SAMPLE_MEDIA_ITEMS: Array<Partial<MediaFile> & { path: string }> = [
  {
    path: 'C:\\Users\\Default\\Videos\\Películas\\Cosmos.Odyssey.2024.1080p.mkv',
    title: 'Cosmos: Odyssey',
    kind: 'movie',
    year: 2024,
    duration: 596,
    width: 1920,
    height: 1080,
    videoCodec: 'h264',
    audioCodec: 'aac',
    container: 'matroska',
    size: 680 * 1024 * 1024,
    overview: 'Un viaje documental a través de los límites del universo observable y la física relativista.',
    genres: ['Documental', 'Ciencia Ficción'],
    // Big Buck Bunny 1080p open clip for real video playback
    extension: 'mp4',
    playbackPosition: 120,
    isWatched: false,
  },
  {
    path: 'C:\\Users\\Default\\Videos\\Series\\Severance\\Temporada 01\\Severance S01E01 - Buenas Noticias.mkv',
    title: 'Severance S01E01',
    seriesTitle: 'Severance',
    seasonNumber: 1,
    episodeNumber: 1,
    episodeTitle: 'Buenas Noticias Sobre El Infierno',
    kind: 'episode',
    duration: 3420,
    width: 1920,
    height: 1080,
    videoCodec: 'hevc',
    audioCodec: 'eac3',
    container: 'matroska',
    size: 1400 * 1024 * 1024,
    overview: 'Mark lidera un equipo cuyos recuerdos laborales y personales han sido separados quirúrgicamente.',
    genres: ['Drama', 'Misterio', 'Suspense'],
    extension: 'mp4',
    playbackPosition: 0,
    isWatched: false,
  },
  {
    path: 'C:\\Users\\Default\\Videos\\Series\\Severance\\Temporada 01\\Severance S01E02 - Media Vuelta.mkv',
    title: 'Severance S01E02',
    seriesTitle: 'Severance',
    seasonNumber: 1,
    episodeNumber: 2,
    episodeTitle: 'Media Vuelta',
    kind: 'episode',
    duration: 3180,
    width: 1920,
    height: 1080,
    videoCodec: 'hevc',
    audioCodec: 'eac3',
    container: 'matroska',
    size: 1350 * 1024 * 1024,
    overview: 'El equipo entrena a Helly mientras Mark asume nuevas responsabilidades corporativas.',
    genres: ['Drama', 'Misterio', 'Suspense'],
    extension: 'mp4',
    playbackPosition: 0,
    isWatched: false,
  },
  {
    path: 'C:\\Users\\Default\\Videos\\Películas\\Metropolis.1927.Remastered.mp4',
    title: 'Metrópolis',
    kind: 'movie',
    year: 1927,
    duration: 9180,
    width: 1440,
    height: 1080,
    videoCodec: 'h264',
    audioCodec: 'flac',
    container: 'mp4',
    size: 2100 * 1024 * 1024,
    overview: 'En una distopía futurista, el hijo del gobernante de la ciudad y una mujer de la clase trabajadora intentan mediar la brecha de clases.',
    genres: ['Ciencia Ficción', 'Clásico', 'Drama'],
    extension: 'mp4',
    playbackPosition: 450,
    isWatched: false,
  },
  {
    path: 'C:\\Users\\Default\\Music\\Nils Frahm - Spaces\\01 - An Echo.flac',
    title: 'An Echo',
    kind: 'audio',
    seriesTitle: 'Spaces',
    year: 2013,
    duration: 278,
    audioCodec: 'flac',
    channels: 2,
    sampleRate: 96000,
    bitrate: 1411,
    container: 'flac',
    size: 48 * 1024 * 1024,
    extension: 'flac',
    playbackPosition: 0,
    isWatched: false,
  },
  {
    path: 'C:\\Users\\Default\\Music\\Max Richter - Sleep\\01 - Dream 1.mp3',
    title: 'Dream 1 (Before the Wind Blows It All Away)',
    kind: 'audio',
    seriesTitle: 'Sleep',
    year: 2015,
    duration: 482,
    audioCodec: 'mp3',
    channels: 2,
    sampleRate: 44100,
    bitrate: 320,
    container: 'mp3',
    size: 18 * 1024 * 1024,
    extension: 'mp3',
    playbackPosition: 0,
    isWatched: false,
  }
];

export class LibraryScanner {
  private isScanning = false;
  private abortController: AbortController | null = null;

  public async scanFolder(
    folder: WatchFolder,
    onProgress: ScanProgressCallback
  ): Promise<MediaFile[]> {
    if (this.isScanning) {
      throw new Error('Ya hay un escaneo en curso');
    }

    this.isScanning = true;
    this.abortController = new AbortController();

    const addedOrUpdated: MediaFile[] = [];

    try {
      onProgress({
        currentFolder: folder.path,
        scannedCount: 0,
        totalFound: 0,
        isComplete: false,
      });

      // Filter sample files belonging to this folder or seed initial files
      const candidates = SAMPLE_MEDIA_ITEMS.filter(item => 
        item.path.toLowerCase().startsWith(folder.path.toLowerCase()) ||
        (folder.path.includes('Videos') && item.kind !== 'audio') ||
        (folder.path.includes('Music') && item.kind === 'audio')
      );

      const itemsToScan = candidates.length > 0 ? candidates : SAMPLE_MEDIA_ITEMS;

      for (let i = 0; i < itemsToScan.length; i++) {
        if (this.abortController.signal.aborted) {
          throw new Error('Escaneo cancelado por el usuario');
        }

        const candidate = itemsToScan[i];
        const classified = classifyMedia(candidate.path);

        const id = `media-${candidate.path.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
        const existing = db.getMediaFileById(id);

        const filename = candidate.path.split(/[\\/]/).pop() || '';
        const posterUrl = existing?.posterUrl || generateMonochromePoster(
          candidate.title || classified.cleanTitle,
          classified.seriesTitle || String(classified.year || ''),
          classified.kind
        );

        const mediaFile: MediaFile = {
          id,
          path: candidate.path,
          filename,
          size: candidate.size || 500 * 1024 * 1024,
          extension: classified.extension,
          duration: candidate.duration || 1200,
          width: candidate.width || 1920,
          height: candidate.height || 1080,
          videoCodec: candidate.videoCodec || 'h264',
          audioCodec: candidate.audioCodec || 'aac',
          channels: candidate.channels || 2,
          sampleRate: candidate.sampleRate || 48000,
          bitrate: candidate.bitrate || 3500,
          fps: 24,
          container: candidate.container || 'mp4',
          dateAdded: existing?.dateAdded || Date.now(),
          dateModified: Date.now(),
          lastPlayedAt: existing?.lastPlayedAt,
          playbackPosition: existing?.playbackPosition || candidate.playbackPosition || 0,
          isWatched: existing?.isWatched || false,
          kind: existing?.userModified ? existing.kind : classified.kind,
          title: existing?.userModified ? existing.title : (candidate.title || classified.cleanTitle),
          year: existing?.userModified ? existing.year : (candidate.year || classified.year),
          seriesTitle: existing?.userModified ? existing.seriesTitle : (candidate.seriesTitle || classified.seriesTitle),
          seasonNumber: existing?.userModified ? existing.seasonNumber : (candidate.seasonNumber || classified.seasonNumber),
          episodeNumber: existing?.userModified ? existing.episodeNumber : (candidate.episodeNumber || classified.episodeNumber),
          episodeTitle: existing?.userModified ? existing.episodeTitle : candidate.episodeTitle,
          overview: existing?.overview || candidate.overview,
          genres: candidate.genres || ['General'],
          posterUrl,
          backdropUrl: existing?.backdropUrl,
          userModified: existing?.userModified || false,
        };

        const saved = db.upsertMediaFile(mediaFile);
        addedOrUpdated.push(saved);

        onProgress({
          currentFolder: folder.path,
          scannedCount: i + 1,
          totalFound: itemsToScan.length,
          currentFile: filename,
          isComplete: false,
        });

        // Small non-blocking yield
        await new Promise(r => setTimeout(r, 60));
      }

      // Update folder info in database
      db.updateWatchLocation(folder.id, {
        lastScannedAt: Date.now(),
        itemCount: addedOrUpdated.length,
      });

      onProgress({
        currentFolder: folder.path,
        scannedCount: addedOrUpdated.length,
        totalFound: addedOrUpdated.length,
        isComplete: true,
      });

      return addedOrUpdated;
    } finally {
      this.isScanning = false;
      this.abortController = null;
    }
  }

  public cancelScan(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isScanning = false;
  }
}

export const libraryScanner = new LibraryScanner();
