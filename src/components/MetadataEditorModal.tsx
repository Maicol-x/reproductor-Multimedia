import React, { useState } from 'react';
import { X, Save, Search, Check, AlertCircle } from 'lucide-react';
import { MediaFile, MediaKind } from '../types/media';
import { useLibraryStore } from '../stores/useLibraryStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { searchTmdb, TmdbSearchResult } from '../../core/metadata/tmdb';

interface MetadataEditorModalProps {
  file: MediaFile | null;
  onClose: () => void;
}

export const MetadataEditorModal: React.FC<MetadataEditorModalProps> = ({ file, onClose }) => {
  const { updateMediaFile } = useLibraryStore();
  const { settings } = useSettingsStore();

  const [kind, setKind] = useState<MediaKind>(file?.kind || 'movie');
  const [title, setTitle] = useState(file?.title || '');
  const [year, setYear] = useState<string>(file?.year ? String(file?.year) : '');
  const [seriesTitle, setSeriesTitle] = useState(file?.seriesTitle || '');
  const [seasonNumber, setSeasonNumber] = useState<string>(file?.seasonNumber !== undefined ? String(file?.seasonNumber) : '');
  const [episodeNumber, setEpisodeNumber] = useState<string>(file?.episodeNumber !== undefined ? String(file?.episodeNumber) : '');
  const [episodeTitle, setEpisodeTitle] = useState(file?.episodeTitle || '');
  const [overview, setOverview] = useState(file?.overview || '');
  const [posterUrl, setPosterUrl] = useState(file?.posterUrl || '');

  // TMDB Search State
  const [tmdbQuery, setTmdbQuery] = useState(file?.seriesTitle || file?.title || '');
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  if (!file) return null;

  const handleSearchTmdb = async () => {
    if (!tmdbQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const type = kind === 'episode' || kind === 'series' ? 'tv' : 'movie';
      const results = await searchTmdb(tmdbQuery, settings.tmdbApiKey, type);
      setTmdbResults(results);
      if (results.length === 0) {
        if (!settings.tmdbApiKey) {
          setSearchError('No se configuró una API Key de TMDB en Configuración. Introduce una para buscar en la base de datos remota.');
        } else {
          setSearchError('No se encontraron coincidencias para la búsqueda.');
        }
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error al conectar con TMDB');
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplyTmdbResult = (item: TmdbSearchResult) => {
    setTitle(item.title);
    if (item.releaseDate) {
      const extractedYear = parseInt(item.releaseDate.split('-')[0], 10);
      if (!isNaN(extractedYear)) setYear(String(extractedYear));
    }
    if (item.overview) setOverview(item.overview);
    if (item.posterPath) setPosterUrl(item.posterPath);
    if (item.mediaType === 'tv') {
      setSeriesTitle(item.title);
      setKind('episode');
    }
    setTmdbResults([]);
  };

  const handleSave = () => {
    const updated: MediaFile = {
      ...file,
      kind,
      title: title.trim() || file.filename,
      year: year ? parseInt(year, 10) : undefined,
      seriesTitle: seriesTitle.trim() || undefined,
      seasonNumber: seasonNumber ? parseInt(seasonNumber, 10) : undefined,
      episodeNumber: episodeNumber ? parseInt(episodeNumber, 10) : undefined,
      episodeTitle: episodeTitle.trim() || undefined,
      overview: overview.trim() || undefined,
      posterUrl: posterUrl.trim() || file.posterUrl,
      userModified: true, // Marked userModified to ensure persistent protection from auto-scans
    };

    updateMediaFile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-950 border border-zinc-800 rounded max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 text-zinc-300 max-h-[90vh] overflow-y-auto text-xs">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Editar Metadatos y Clasificación</h3>
            <p className="text-[11px] text-zinc-500 font-mono truncate max-w-sm">{file.filename}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TMDB Search Bar */}
        <div className="bg-zinc-900/40 p-3 rounded border border-zinc-800/80 flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-zinc-400">Identificación externa (TMDB opcional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tmdbQuery}
              onChange={(e) => setTmdbQuery(e.target.value)}
              placeholder="Buscar título en TMDB..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
            />
            <button
              type="button"
              onClick={handleSearchTmdb}
              disabled={isSearching}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isSearching ? 'Buscando...' : 'Buscar'}</span>
            </button>
          </div>

          {searchError && (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {tmdbResults.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-2 max-h-40 overflow-y-auto border-t border-zinc-800 pt-2">
              <span className="text-[10px] text-zinc-500 font-mono uppercase">Coincidencias encontradas:</span>
              {tmdbResults.map((res) => (
                <div
                  key={res.id}
                  onClick={() => handleApplyTmdbResult(res)}
                  className="flex items-center justify-between p-2 rounded hover:bg-zinc-800/80 cursor-pointer border border-zinc-800 transition-colors"
                >
                  <div className="truncate pr-2">
                    <span className="font-medium text-white">{res.title}</span>
                    <span className="text-zinc-500 ml-1.5 text-[10px]">
                      {res.releaseDate?.split('-')[0]} · {res.mediaType === 'tv' ? 'Serie' : 'Película'}
                    </span>
                  </div>
                  <button className="text-[11px] text-zinc-300 px-2 py-0.5 bg-zinc-800 rounded hover:bg-zinc-700">
                    Aplicar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Classification Form */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Tipo de contenido</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as MediaKind)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400"
            >
              <option value="movie">Película</option>
              <option value="episode">Episodio de Serie</option>
              <option value="video">Vídeo Independiente</option>
              <option value="audio">Archivo de Audio</option>
              <option value="unknown">Desconocido</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Año</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Ej: 2024"
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-zinc-400 block mb-1">Título principal</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400"
          />
        </div>

        {/* Series Specific Fields */}
        {kind === 'episode' && (
          <div className="grid grid-cols-3 gap-3 bg-zinc-900/30 p-3 rounded border border-zinc-800/60">
            <div className="col-span-3 sm:col-span-1">
              <label className="text-[11px] text-zinc-400 block mb-1">Nombre de la Serie</label>
              <input
                type="text"
                value={seriesTitle}
                onChange={(e) => setSeriesTitle(e.target.value)}
                placeholder="Ej: Severance"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Temporada (Nº)</label>
              <input
                type="number"
                value={seasonNumber}
                onChange={(e) => setSeasonNumber(e.target.value)}
                placeholder="1"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Episodio (Nº)</label>
              <input
                type="number"
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(e.target.value)}
                placeholder="3"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-[11px] text-zinc-400 block mb-1">Sinopsis / Descripción</label>
          <textarea
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400 resize-none"
            placeholder="Resumen o sinopsis del contenido..."
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <span className="text-[10px] text-zinc-500 font-mono">
            Las modificaciones manuales quedarán bloqueadas contra futuros escaneos.
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs border border-zinc-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 font-medium rounded text-xs flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
