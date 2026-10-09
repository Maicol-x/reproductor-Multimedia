import React, { useState } from 'react';
import { Tv, Play, Check, ChevronRight } from 'lucide-react';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { MediaFile } from '../../types/media';

export const SeriesView: React.FC = () => {
  const { files, searchQuery } = useLibraryStore();
  const { playMedia } = usePlayerStore();

  const episodes = files.filter(f => f.kind === 'episode' && f.seriesTitle);

  // Group by series title
  const seriesMap: Record<string, MediaFile[]> = {};
  episodes.forEach(ep => {
    const title = ep.seriesTitle || 'Serie Sin Nombre';
    if (!seriesMap[title]) seriesMap[title] = [];
    seriesMap[title].push(ep);
  });

  const seriesTitles = Object.keys(seriesMap).sort();
  const [selectedSeriesTitle, setSelectedSeriesTitle] = useState<string>(seriesTitles[0] || '');
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  const currentSeriesEpisodes = seriesMap[selectedSeriesTitle] || [];

  // Available seasons in the selected series
  const seasons = Array.from(new Set(currentSeriesEpisodes.map(e => e.seasonNumber || 1))).sort((a, b) => a - b);

  // Episodes in active season
  const activeSeasonEpisodes = currentSeriesEpisodes
    .filter(e => (e.seasonNumber || 1) === selectedSeason)
    .sort((a, b) => (a.episodeNumber || 1) - (b.episodeNumber || 1));

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (seriesTitles.length === 0) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-2 bg-zinc-950 text-zinc-400">
        <Tv className="w-10 h-10 text-zinc-600 mb-2" />
        <h3 className="text-sm font-semibold text-zinc-300">No hay series o episodios detectados</h3>
        <p className="text-xs text-zinc-500 max-w-sm">
          Añade archivos con patrones como `S01E02` o `1x03` para que Monochrome Media los clasifique automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex bg-zinc-950 text-zinc-200">
      {/* Series Sidebar List */}
      <div className="w-72 border-r border-zinc-800/80 overflow-y-auto p-4 flex flex-col gap-2 shrink-0">
        <div className="text-[10px] uppercase font-mono text-zinc-500 font-semibold tracking-wider mb-1">
          Series en la Biblioteca ({seriesTitles.length})
        </div>

        {seriesTitles.map((title) => {
          const list = seriesMap[title];
          const isSelected = title === selectedSeriesTitle;
          const firstItem = list[0];
          return (
            <button
              key={title}
              onClick={() => {
                setSelectedSeriesTitle(title);
                const s = Array.from(new Set(list.map(e => e.seasonNumber || 1))).sort((a, b) => a - b);
                setSelectedSeason(s[0] || 1);
              }}
              className={`w-full flex items-center gap-3 p-2 rounded text-left transition-colors border ${
                isSelected
                  ? 'bg-zinc-800 text-white border-zinc-700 font-medium'
                  : 'bg-zinc-900/30 hover:bg-zinc-900/80 text-zinc-300 border-zinc-800/60'
              }`}
            >
              <div className="w-10 h-14 bg-zinc-900 rounded overflow-hidden shrink-0">
                <img src={firstItem.posterUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate">{title}</div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  {list.length} episodios · {new Set(list.map(e => e.seasonNumber)).size} temporadas
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Selected Series Detail & Episodes */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* Series Header */}
        <div className="flex flex-col sm:flex-row gap-5 bg-zinc-900/30 p-5 rounded border border-zinc-800/80">
          <div className="w-28 sm:w-36 aspect-[2/3] bg-zinc-900 rounded overflow-hidden shadow-xl shrink-0">
            <img src={currentSeriesEpisodes[0]?.posterUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col justify-between flex-1 gap-2">
            <div>
              <div className="text-[10px] uppercase font-mono text-zinc-500 font-semibold tracking-wider">
                Serie de Televisión
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">{selectedSeriesTitle}</h2>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 font-mono">
                <span>{seasons.length} temporadas</span>
                <span>·</span>
                <span>{currentSeriesEpisodes.length} episodios totales</span>
              </div>
              <p className="text-xs text-zinc-400 mt-3 max-w-2xl leading-relaxed">
                {currentSeriesEpisodes[0]?.overview || 'Serie organizada automáticamente por nombre de archivo y estructura de carpetas.'}
              </p>
            </div>

            {/* Quick Play First Available / Resume Next */}
            <div className="pt-2">
              <button
                onClick={() => {
                  const unwatched = currentSeriesEpisodes.find(e => !e.isWatched) || currentSeriesEpisodes[0];
                  if (unwatched) playMedia(unwatched);
                }}
                className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-medium rounded text-xs flex items-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Reproducir siguiente episodio</span>
              </button>
            </div>
          </div>
        </div>

        {/* Season Selector Tabs */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            {seasons.map(seasonNum => (
              <button
                key={seasonNum}
                onClick={() => setSelectedSeason(seasonNum)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  selectedSeason === seasonNum
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                Temporada {seasonNum}
              </button>
            ))}
          </div>

          {/* Episodes List in Selected Season */}
          <div className="flex flex-col gap-2">
            {activeSeasonEpisodes.map(ep => {
              const percentWatched = ep.duration > 0
                ? Math.min(100, (ep.playbackPosition / ep.duration) * 100)
                : 0;
              return (
                <div
                  key={ep.id}
                  onClick={() => playMedia(ep)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-zinc-900/30 hover:bg-zinc-900/80 border border-zinc-800/60 rounded cursor-pointer transition-colors gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative w-28 aspect-video bg-zinc-900 rounded overflow-hidden shrink-0 border border-zinc-800">
                      <img src={ep.posterUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 fill-white text-white" />
                      </div>
                      {percentWatched > 0 && !ep.isWatched && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                          <div className="h-full bg-white" style={{ width: `${percentWatched}%` }} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-400 text-xs font-semibold">
                          E{String(ep.episodeNumber || 1).padStart(2, '0')}
                        </span>
                        <h4 className="text-xs font-semibold text-white truncate">
                          {ep.episodeTitle || ep.title}
                        </h4>
                        {ep.isWatched && (
                          <span title="Visto">
                            <Check className="w-3.5 h-3.5 text-zinc-400 ml-1" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                        {ep.overview || 'Sin descripción disponible.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 shrink-0 self-end sm:self-center">
                    <span className="tabular-nums">{formatSeconds(ep.duration)}</span>
                    <button
                      className="px-2.5 py-1 bg-zinc-800 group-hover:bg-white group-hover:text-zinc-950 text-zinc-200 rounded text-xs transition-colors flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Ver</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
