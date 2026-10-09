import React from 'react';
import { PlayCircle } from 'lucide-react';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { MediaCard } from '../../components/MediaCard';

export const ContinueWatchingView: React.FC = () => {
  const { files, searchQuery } = useLibraryStore();

  const inProgress = files
    .filter(f => f.playbackPosition > 10 && !f.isWatched)
    .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));

  const filtered = inProgress.filter(f =>
    !searchQuery || f.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-zinc-950 text-zinc-200">
      <div className="border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-zinc-300" />
          <h2 className="text-lg font-bold text-white">Continuar Viendo</h2>
          <span className="text-xs text-zinc-500 font-mono">({filtered.length})</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Películas y episodios empezados con su progreso exacto guardado.
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(item => (
            <MediaCard key={item.id} file={item} layout="landscape" />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-zinc-500">
          No tienes reproducciones pendientes en curso. ¡Todo está al día!
        </div>
      )}
    </div>
  );
};
