export interface TmdbSearchResult {
  id: number;
  title: string;
  originalTitle?: string;
  overview: string;
  releaseDate?: string;
  posterPath?: string;
  backdropPath?: string;
  voteAverage?: number;
  mediaType: 'movie' | 'tv';
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/**
 * Creates a stylized monochromatic SVG poster data URL when offline or when no TMDB key is provided.
 */
export function generateMonochromePoster(title: string, subtitle?: string, kind?: string): string {
  const displayTitle = title.length > 28 ? title.substring(0, 26) + '...' : title;
  const displaySub = subtitle || (kind === 'episode' ? 'SERIE DE TV' : 'LARGOMETRAJE');
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="100%" height="100%">
    <defs>
      <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#18181b"/>
        <stop offset="100%" stop-color="#09090b"/>
      </radialGradient>
      <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#27272a"/>
        <stop offset="50%" stop-color="#71717a"/>
        <stop offset="100%" stop-color="#27272a"/>
      </linearGradient>
    </defs>
    <rect width="600" height="900" fill="url(#vignette)"/>
    <rect x="24" y="24" width="552" height="852" fill="none" stroke="#27272a" stroke-width="1.5"/>
    <rect x="32" y="32" width="536" height="836" fill="none" stroke="#18181b" stroke-width="1"/>
    
    <!-- Geometric framing watermark -->
    <circle cx="300" cy="400" r="140" fill="none" stroke="#27272a" stroke-width="1" stroke-dasharray="4 6"/>
    <circle cx="300" cy="400" r="100" fill="none" stroke="#1f1f23" stroke-width="1"/>
    
    <!-- Monogram or initial -->
    <text x="300" y="430" font-family="system-ui, -apple-system, sans-serif" font-size="80" font-weight="800" fill="#3f3f46" text-anchor="middle" letter-spacing="2">
      ${title.charAt(0).toUpperCase()}
    </text>
    
    <!-- Top kicker -->
    <text x="300" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#a1a1aa" text-anchor="middle" letter-spacing="4">
      MONOCHROME ARCHIVE
    </text>
    
    <line x1="80" y1="120" x2="520" y2="120" stroke="url(#lineGrad)" stroke-width="1"/>
    
    <!-- Title & Metadata -->
    <text x="300" y="650" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="#fafafa" text-anchor="middle">
      ${escapeXml(displayTitle)}
    </text>
    
    <text x="300" y="690" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#71717a" text-anchor="middle" letter-spacing="3">
      ${escapeXml(displaySub.toUpperCase())}
    </text>
    
    <!-- Bottom film strip accents -->
    <line x1="80" y1="780" x2="520" y2="780" stroke="#27272a" stroke-width="1"/>
    <text x="300" y="820" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="400" fill="#52525b" text-anchor="middle" letter-spacing="2">
      MASTER HIGH FIDELITY · LOCAL PLAYBACK
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Searches TMDB for movies or series matches when an API key is provided.
 */
export async function searchTmdb(
  query: string,
  apiKey?: string,
  type: 'movie' | 'tv' | 'multi' = 'multi'
): Promise<TmdbSearchResult[]> {
  if (!apiKey || !apiKey.trim()) {
    return [];
  }

  try {
    const endpoint = type === 'multi' ? 'search/multi' : `search/${type}`;
    const url = `${TMDB_BASE_URL}/${endpoint}?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}&language=es-ES`;
    
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`TMDB API returned HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.slice(0, 10).map((item: any) => ({
      id: item.id,
      title: item.title || item.name || '',
      originalTitle: item.original_title || item.original_name,
      overview: item.overview || '',
      releaseDate: item.release_date || item.first_air_date,
      posterPath: item.poster_path ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}` : undefined,
      backdropPath: item.backdrop_path ? `${TMDB_IMAGE_BASE}/original${item.backdrop_path}` : undefined,
      voteAverage: item.vote_average,
      mediaType: item.media_type || (type === 'tv' ? 'tv' : 'movie'),
    }));
  } catch (err) {
    console.warn('Failed to query TMDB API', err);
    return [];
  }
}
