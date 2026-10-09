import React from 'react';
import { Video, LayoutGrid } from 'lucide-react';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { MediaCard } from '../../components/MediaCard';

export const VideosView: React.FC = () => {
  const { files, searchQuery } = useLibraryStore();

  const videos = files.filter(f => f.kind === 'video' || (f.kind !== 'movie' && f.kind !== 'episode' && f.kind !== 'audio'));

  const filtered = videos.filter(v =>
    !searchQuery || v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-zinc-950 text-zinc-200">
      <div className="border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-zinc-300" />
          <h2 className="text-lg font-bold text-white">Vídeos Independientes</h2>
          <span className="text-xs text-zinc-500 font-mono">({filtered.length})</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Archivos de vídeo individuales que no pertenecen a una serie ni están catalogados como largometrajes.
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(video => (
            <MediaCard key={video.id} file={video} layout="landscape" />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-zinc-500">
          No se encontraron vídeos independientes en la biblioteca.
        </div>
      )}
    </div>
  );
};
