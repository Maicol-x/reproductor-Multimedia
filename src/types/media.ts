export type MediaKind = 'movie' | 'series' | 'episode' | 'video' | 'audio' | 'unknown';

export interface MediaFile {
  id: string;
  path: string;
  filename: string;
  size: number;
  extension: string;
  duration: number; // in seconds
  width?: number;
  height?: number;
  videoCodec?: string;
  audioCodec?: string;
  channels?: number;
  sampleRate?: number;
  bitrate?: number; // in kbps
  fps?: number;
  container?: string;
  dateAdded: number; // timestamp
  dateModified: number; // timestamp
  lastPlayedAt?: number;
  playbackPosition: number; // seconds
  isWatched: boolean;
  
  // Classification
  kind: MediaKind;
  title: string;
  originalTitle?: string;
  year?: number;
  
  // For series/episodes
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  
  // Metadata & Art
  overview?: string;
  genres?: string[];
  posterUrl?: string;
  backdropUrl?: string;
  tmdbId?: number;
  userModified: boolean; // Protects manual edits from being overwritten by scans
}

export interface WatchFolder {
  id: string;
  path: string;
  name: string;
  isEnabled: boolean;
  lastScannedAt?: number;
  itemCount: number;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  isSmart: boolean;
  smartType?: 'favorites' | 'history' | 'in_progress' | 'unwatched';
  itemIds: string[];
}

export type JobType = 'extract_audio' | 'convert_video' | 'convert_audio' | 'compress_video';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'interrupted';

export interface JobOptions {
  format?: string;
  videoCodec?: string;
  audioCodec?: string;
  resolution?: string; // e.g. "1920x1080", "1280x720", "original"
  bitrate?: string; // e.g. "192k", "320k", "2500k"
  crf?: number; // 18-28 for x264
  sampleRate?: number;
  qualityPreset?: 'ultrafast' | 'fast' | 'medium' | 'slow';
  outputDirectory?: string;
}

export interface MediaJob {
  id: string;
  type: JobType;
  inputPath: string;
  inputTitle: string;
  outputPath: string;
  status: JobStatus;
  progress: number; // 0 to 100
  speed?: string; // e.g. "1.8x"
  elapsedSeconds: number;
  remainingSeconds?: number;
  error?: string;
  options: JobOptions;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
}

export interface AppSettings {
  theme: 'monochrome_dark' | 'monochrome_black';
  autoPlayNextEpisode: boolean;
  nextEpisodeCountdownSeconds: number;
  resumePlayback: boolean;
  resumeThresholdSeconds: number; // minimum seconds before saving progress
  markWatchedThresholdPercent: number; // percentage (e.g. 90)
  defaultAudioLanguage: string;
  subtitleSize: 'small' | 'medium' | 'large';
  subtitleOffsetSeconds: number;
  defaultExportDirectory: string;
  maxConcurrentJobs: number;
  tmdbApiKey: string;
  tmdbLanguage: string;
  scanExclusions: string[]; // file patterns like "*.sample.*", "*.nfo"
  volume: number;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  isExternal: boolean;
  url?: string;
  content?: string;
}

export interface AudioTrack {
  id: string;
  label: string;
  language: string;
  codec: string;
  channels: number;
}

export interface TechnicalMediaInfo {
  formatName: string;
  formatLongName: string;
  duration: number;
  size: number;
  bitrate: number;
  videoStreams: Array<{
    codec: string;
    codecLongName: string;
    width: number;
    height: number;
    aspectRatio: string;
    fps: number;
    pixelFormat: string;
  }>;
  audioStreams: Array<{
    codec: string;
    codecLongName: string;
    channels: number;
    channelLayout: string;
    sampleRate: number;
    bitrate: number;
    language?: string;
  }>;
  subtitleStreams: Array<{
    codec: string;
    language?: string;
    title?: string;
  }>;
}
