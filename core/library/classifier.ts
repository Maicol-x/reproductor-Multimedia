import { MediaKind } from '../../src/types/media';

export interface ParsedMediaInfo {
  kind: MediaKind;
  cleanTitle: string;
  year?: number;
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  extension: string;
}

const VIDEO_EXTENSIONS = new Set([
  'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', 'ts', 'm2ts', 'vob', 'ogv'
]);

const AUDIO_EXTENSIONS = new Set([
  'mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a', 'opus', 'wma', 'alac', 'aiff'
]);

// Common scene release tags to remove when cleaning titles
const RELEASE_TAGS_REGEX = /\b(1080p|720p|2160p|4k|uhd|bluray|blu-ray|bdrip|brrip|web-dl|webrip|web|hdtv|dvdrip|x264|x265|hevc|avc|h\.264|h\.265|10bit|8bit|hdr|hdr10|sdr|aac|ac3|dts|dts-hd|truehd|atmos|mp3|flac|repack|proper|remux|extended|unrated|directors\.cut|dual\.audio|multi|sub|subbed|latino|castellano|ita|fra|ger|rus)\b/gi;

/**
 * Parses file path and name to extract series, season, episode, movie year, and kind.
 */
export function classifyMedia(filepath: string): ParsedMediaInfo {
  // Normalize path separators
  const normalizedPath = filepath.replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/').filter(Boolean);
  const fullFilename = pathParts[pathParts.length - 1] || '';
  
  const dotIndex = fullFilename.lastIndexOf('.');
  const ext = dotIndex !== -1 ? fullFilename.substring(dotIndex + 1).toLowerCase() : '';
  const rawBaseName = dotIndex !== -1 ? fullFilename.substring(0, dotIndex) : fullFilename;

  // Check audio first
  if (AUDIO_EXTENSIONS.has(ext)) {
    const cleanTitle = cleanReleaseName(rawBaseName);
    return {
      kind: 'audio',
      cleanTitle,
      extension: ext,
    };
  }

  // If not video and not audio, mark unknown
  if (!VIDEO_EXTENSIONS.has(ext)) {
    return {
      kind: 'unknown',
      cleanTitle: rawBaseName,
      extension: ext,
    };
  }

  // 1. Try standard S01E02 / s01e02 / S1E3 / S01-E03
  const sxxExxMatch = rawBaseName.match(/^(.*?)[ ._-]+[sS](\d{1,2})[ ._-]*[eE](\d{1,3})(.*?)$/);
  if (sxxExxMatch) {
    const rawSeries = sxxExxMatch[1];
    const season = parseInt(sxxExxMatch[2], 10);
    const episode = parseInt(sxxExxMatch[3], 10);
    const seriesTitle = cleanSeriesName(rawSeries, pathParts);
    return {
      kind: 'episode',
      cleanTitle: `${seriesTitle} S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`,
      seriesTitle,
      seasonNumber: season,
      episodeNumber: episode,
      extension: ext,
    };
  }

  // 2. Try 1x03 or 01x03 pattern
  const nxnnMatch = rawBaseName.match(/^(.*?)[ ._-]+(\d{1,2})x(\d{1,3})(.*?)$/i);
  if (nxnnMatch) {
    const rawSeries = nxnnMatch[1];
    const season = parseInt(nxnnMatch[2], 10);
    const episode = parseInt(nxnnMatch[3], 10);
    const seriesTitle = cleanSeriesName(rawSeries, pathParts);
    return {
      kind: 'episode',
      cleanTitle: `${seriesTitle} S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`,
      seriesTitle,
      seasonNumber: season,
      episodeNumber: episode,
      extension: ext,
    };
  }

  // 3. Try directory context: "Series Name / Season 1 / Episode 05.mkv" or "Temporada 2 / Capitulo 3"
  const folderSeasonMatch = findSeasonInPath(pathParts);
  const episodeNameMatch = rawBaseName.match(/\b(episodio|episode|capitulo|ep|cap)[ ._-]*(\d{1,3})\b/i);
  if (folderSeasonMatch !== null && episodeNameMatch) {
    const season = folderSeasonMatch;
    const episode = parseInt(episodeNameMatch[2], 10);
    const seriesTitle = getSeriesNameFromPath(pathParts);
    return {
      kind: 'episode',
      cleanTitle: `${seriesTitle} S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`,
      seriesTitle,
      seasonNumber: season,
      episodeNumber: episode,
      extension: ext,
    };
  }

  // 4. Pattern: "Series - 103" or "Series 103" where 103 = Season 1 Ep 03 (3 or 4 digits)
  // Only if preceded by explicit dash or series folder context
  const dashEpisodeMatch = rawBaseName.match(/^(.*?)[ ._-]+[-][ ._-]+(\d{1,2})(\d{2})(.*?)$/);
  if (dashEpisodeMatch && pathParts.length > 1) {
    const rawSeries = dashEpisodeMatch[1];
    const season = parseInt(dashEpisodeMatch[2], 10);
    const episode = parseInt(dashEpisodeMatch[3], 10);
    if (season > 0 && season < 50 && episode > 0 && episode < 99) {
      const seriesTitle = cleanSeriesName(rawSeries, pathParts);
      return {
        kind: 'episode',
        cleanTitle: `${seriesTitle} S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`,
        seriesTitle,
        seasonNumber: season,
        episodeNumber: episode,
        extension: ext,
      };
    }
  }

  // 5. Check if it is a Movie with Year: "Inception (2010)" or "The Matrix 1999"
  const movieYearMatch = rawBaseName.match(/^(.*?)[ ._(-]+(19\d{2}|20\d{2})[ ._)-]*(.*?)$/);
  if (movieYearMatch) {
    const rawTitle = movieYearMatch[1];
    const year = parseInt(movieYearMatch[2], 10);
    const cleanTitle = cleanReleaseName(rawTitle);
    if (cleanTitle.length > 0) {
      return {
        kind: 'movie',
        cleanTitle,
        year,
        extension: ext,
      };
    }
  }

  // 6. Standalone Video (Default when no series or movie patterns match)
  const cleanTitle = cleanReleaseName(rawBaseName);
  return {
    kind: 'video',
    cleanTitle: cleanTitle || rawBaseName,
    extension: ext,
  };
}

/**
 * Cleans release artifacts from names (periods to spaces, removing codec/resolution tags).
 */
export function cleanReleaseName(rawName: string): string {
  let cleaned = rawName
    .replace(/[._]/g, ' ')
    .replace(RELEASE_TAGS_REGEX, ' ')
    .replace(/\[.*?\]|\(.*?\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If cleaning wiped out everything, restore alphanumeric base
  if (!cleaned) {
    cleaned = rawName.replace(/[._]/g, ' ').trim();
  }
  return capitalizeTitle(cleaned);
}

function cleanSeriesName(rawSeries: string, pathParts: string[]): string {
  let cleaned = cleanReleaseName(rawSeries);
  if (!cleaned || cleaned.length < 2) {
    cleaned = getSeriesNameFromPath(pathParts);
  }
  return capitalizeTitle(cleaned);
}

function findSeasonInPath(parts: string[]): number | null {
  for (let i = parts.length - 2; i >= 0; i--) {
    const part = parts[i];
    const match = part.match(/\b(season|temporada|temp|s)[ ._-]*(\d{1,2})\b/i);
    if (match) {
      return parseInt(match[2], 10);
    }
  }
  return null;
}

function getSeriesNameFromPath(parts: string[]): string {
  if (parts.length >= 3) {
    // If penultimate is "Season 1", then the parent is Series Name
    const penultimate = parts[parts.length - 2];
    if (/\b(season|temporada|temp|s)\b/i.test(penultimate) && parts.length >= 3) {
      return cleanReleaseName(parts[parts.length - 3]);
    }
    return cleanReleaseName(penultimate);
  }
  return 'Serie Desconocida';
}

function capitalizeTitle(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
    .join(' ')
    .trim();
}
