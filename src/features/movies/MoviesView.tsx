import React, { useState } from 'react';
import { Film, LayoutGrid, List, ArrowUpDown, Filter } from 'lucide-react';
import { useLibraryStore, SortField } from '../../stores/useLibraryStore';
import { MediaCard } from '../../components/MediaCard';
import { usePlayerStore } from '../../stores/usePlayerStore';

export const MoviesView: React.FC = () => {
  const { files, searchQuery, sortBy, setSortBy, sortDirection, toggleSortDirection, viewMode, setViewMode } = useLibraryStore();
  const { playMedia } = usePlayerStore();
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const movies = files.filter(f => f.kind === 'movie');

  // Available release years
  const availableYears = Array.from(new Set(movies.map(m => m.year).filter(Boolean) as number[])).sort((a, b) => b - a);

  // Filter & Search
  let filtered = movies.filter(m => {
    const matchesSearch = !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.overview && m.overview.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesYear = selectedYear === 'all' || String(m.year) === selectedYear;
    return matchesSearch && matchesYear;
  });

  // Sort
  filtered.sort((a, b) => {
    let diff = 0;
    if (sortBy === 'title') {
      diff = a.title.localeCompare(b.title);
    } else if (sortBy === 'duration') {
      diff = a.duration - b.duration;
    } else if (sortBy === 'year') {
      diff = (a.year || 0) - (b.year || 0);
    } else if (sortBy === 'size') {
      diff = a.size - b.size;
    } else {
      diff = a.dateAdded - b.dateAdded;
    }
    return sortDirection === 'asc' ? diff : -diff;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-zinc-950 text-zinc-200">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-zinc-300" />
            <h2 className="text-lg font-bold text-white">Películas</h2>
            <span className="text-xs text-zinc-500 font-mono">({filtered.length})</span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Colección cinematográfica clasificada por año, duración y resolución.
          </p>
        </div>

        {/* Toolbar: Year filter, Sorting, View mode */}
        <div className="flex items-center gap-3 text-xs">
          {/* Year Filter */}
          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-500"
            >
              <option value="all">Todos los años</option>
              {availableYears.map(yr => (
                <option key={yr} value={String(yr)}>{yr}</option>
              ))}
            </select>
          )}

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="bg-transparent text-zinc-300 focus:outline-none"
            >
              <option value="dateAdded">Fecha de importación</option>
              <option value="title">Título alfabético</option>
              <option value="year">Año de estreno</option>
              <option value="duration">Duración</option>
              <option value="size">Tamaño de archivo</option>
            </select>
            <button
              onClick={toggleSortDirection}
              className="text-zinc-500 hover:text-white px-1"
              title={sortDirection === 'asc' ? 'Ascendente' : 'Descendente'}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Grid vs List View Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Vista de cuadrícula"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Vista de lista"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map(movie => (
            <MediaCard key={movie.id} file={movie} layout="poster" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col border border-zinc-800/80 rounded overflow-hidden divide-y divide-zinc-900 bg-zinc-950">
          <div className="grid grid-cols-12 px-4 py-2 text-[10px] uppercase font-mono text-zinc-500 bg-zinc-900/60">
            <span className="col-span-6">Título y resolución</span>
            <span className="col-span-2">Año</span>
            <span className="col-span-2">Duración</span>
            <span className="col-span-2 text-right">Tamaño</span>
          </div>
          {filtered.map(movie => (
            <div
              key={movie.id}
              onClick={() => playMedia(movie)}
              className="grid grid-cols-12 px-4 py-3 text-xs items-center hover:bg-zinc-900/40 cursor-pointer transition-colors"
            >
              <div className="col-span-6 flex items-center gap-3 truncate pr-2">
                <div className="w-8 h-10 bg-zinc-900 shrink-0 overflow-hidden rounded">
                  <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="truncate">
                  <div className="font-semibold text-white truncate">{movie.title}</div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    {movie.height ? `${movie.height}p · ` : ''}{movie.videoCodec?.toUpperCase()} · {movie.container?.toUpperCase()}
                  </div>
                </div>
              </div>
              <span className="col-span-2 text-zinc-400 font-mono">{movie.year || '—'}</span>
              <span className="col-span-2 text-zinc-400 font-mono tabular-nums">
                {Math.floor(movie.duration / 60)} min
              </span>
              <span className="col-span-2 text-right text-zinc-400 font-mono tabular-nums">
                {(movie.size / (1024 * 1024)).toFixed(0)} MB
              </span>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-20 text-center text-xs text-zinc-500">
          No se encontraron películas que coincidan con los filtros aplicados.
        </div>
      )}
    </div>
  );
};
