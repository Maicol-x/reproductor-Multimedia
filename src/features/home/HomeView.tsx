import React from 'react';
import { PlayCircle, Film, Tv, Clock, HardDrive, Sparkles } from 'lucide-react';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { MediaCard } from '../../components/MediaCard';
import { usePlayerStore } from '../../stores/usePlayerStore';

export const HomeView: React.FC = () => {
  const { files, searchQuery } = useLibraryStore();
  const { playMedia } = usePlayerStore();

  const continueWatching = files
    .filter(f => f.playbackPosition > 10 && !f.isWatched)
    .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));

  const recentMovies = files
    .filter(f => f.kind === 'movie')
    .sort((a, b) => b.dateAdded - a.dateAdded)
    .slice(0, 6);

  const recentEpisodes = files
    .filter(f => f.kind === 'episode')
    .sort((a, b) => b.dateAdded - a.dateAdded)
    .slice(0, 6);

  const totalDurationSeconds = files.reduce((acc, f) => acc + (f.duration || 0), 0);
  const totalHours = Math.round(totalDurationSeconds / 3600);
  const totalWatched = files.filter(f => f.isWatched).length;

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 bg-zinc-950 text-zinc-200">
      {/* Hero Welcome / Library Status */}
      <section className="bg-zinc-900/40 border border-zinc-800/80 rounded p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase">
            Monochrome Media · Centro de Control
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Tu Biblioteca Audiovisual para Windows
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl">
            Reproducción local de alta fidelidad, organización automática de temporadas y herramientas FFmpeg integradas. 100% privado y sin conexión.
          </p>
        </div>

        {/* Quick Quantitative Metrics (Tabular numerals, unboxed) */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-zinc-800/80 pt-4 md:pt-0 md:pl-6 text-xs text-zinc-400">
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-500 block">Total Archivos</span>
            <span className="text-base font-bold font-mono tabular-nums text-white">{files.length}</span>
          </div>
          <div className="w-[1px] h-6 bg-zinc-800" />
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-500 block">Horas de Contenido</span>
            <span className="text-base font-bold font-mono tabular-nums text-white">{totalHours}h</span>
          </div>
          <div className="w-[1px] h-6 bg-zinc-800" />
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-500 block">Completados</span>
            <span className="text-base font-bold font-mono tabular-nums text-white">{totalWatched}</span>
          </div>
        </div>
      </section>

      {/* Continue Watching Section */}
      {continueWatching.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-zinc-300" />
              <h3 className="text-sm font-semibold text-white">Continuar viendo</h3>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              {continueWatching.length} títulos pendientes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {continueWatching.slice(0, 4).map(file => (
              <MediaCard key={file.id} file={file} layout="landscape" />
            ))}
          </div>
        </section>
      )}

      {/* Recent Movies */}
      {recentMovies.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-zinc-300" />
              <h3 className="text-sm font-semibold text-white">Películas en la biblioteca</h3>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              {files.filter(f => f.kind === 'movie').length} películas
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentMovies.map(file => (
              <MediaCard key={file.id} file={file} layout="poster" />
            ))}
          </div>
        </section>
      )}

      {/* Series & Episodes */}
      {recentEpisodes.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-zinc-300" />
              <h3 className="text-sm font-semibold text-white">Episodios y Series de TV</h3>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              Organizados por temporadas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentEpisodes.map(file => (
              <MediaCard key={file.id} file={file} layout="landscape" />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
          <HardDrive className="w-10 h-10 text-zinc-600" />
          <h4 className="text-sm font-semibold text-zinc-300">No hay archivos multimedia importados</h4>
          <p className="text-xs text-zinc-500 max-w-sm">
            Añade carpetas supervisadas en la barra superior para escanear y organizar tus películas, series y música.
          </p>
        </div>
      )}
    </div>
  );
};
