import React, { useState } from 'react';
import { Play, MoreVertical, Edit3, Info, RotateCcw, Plus, Check } from 'lucide-react';
import { MediaFile } from '../types/media';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useLibraryStore } from '../stores/useLibraryStore';
import { usePlaylistStore } from '../stores/usePlaylistStore';

interface MediaCardProps {
  file: MediaFile;
  layout?: 'poster' | 'landscape';
}

export const MediaCard: React.FC<MediaCardProps> = ({ file, layout = 'poster' }) => {
  const { playMedia } = usePlayerStore();
  const { setEditingFile, setInspectingFile, resetProgress } = useLibraryStore();
  const { playlists, addItemToPlaylist } = usePlaylistStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const percentWatched = file.duration > 0
    ? Math.min(100, (file.playbackPosition / file.duration) * 100)
    : 0;

  const isLandscape = layout === 'landscape' || file.kind === 'episode' || file.kind === 'video';

  return (
    <div className="group relative flex flex-col bg-zinc-900/40 border border-zinc-800/60 rounded overflow-hidden hover:border-zinc-600 transition-all">
      {/* Thumbnail / Poster Area */}
      <div
        className={`relative w-full bg-zinc-950 overflow-hidden cursor-pointer ${
          isLandscape ? 'aspect-video' : 'aspect-[2/3]'
        }`}
        onClick={() => playMedia(file)}
      >
        <img
          src={file.posterUrl || file.backdropUrl}
          alt={file.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Hover overlay with big play button */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums text-zinc-300 border border-zinc-800">
          {formatDuration(file.duration)}
        </div>

        {/* Watched indicator */}
        {file.isWatched && (
          <div className="absolute top-2 left-2 bg-zinc-900/90 border border-zinc-700 text-zinc-200 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 font-mono">
            <Check className="w-3 h-3 text-zinc-300" />
            <span>VISTO</span>
          </div>
        )}

        {/* Playback progress bar */}
        {percentWatched > 0 && !file.isWatched && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
            <div
              className="h-full bg-zinc-200"
              style={{ width: `${percentWatched}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Information */}
      <div className="p-2.5 flex flex-col justify-between flex-1 gap-1">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <h4
              onClick={() => playMedia(file)}
              className="text-xs font-semibold text-zinc-100 truncate hover:underline cursor-pointer"
              title={file.title}
            >
              {file.title}
            </h4>
            
            {/* Unboxed Metadata with · separator */}
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-normal truncate mt-0.5">
              {file.year && <span>{file.year}</span>}
              {file.year && file.height && <span aria-hidden="true">·</span>}
              {file.height && (
                <span className="font-mono tabular-nums">
                  {file.height >= 2160 ? '4K' : file.height >= 1080 ? '1080p' : file.height >= 720 ? '720p' : `${file.height}p`}
                </span>
              )}
              {file.videoCodec && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="uppercase text-[10px] font-mono">{file.videoCodec}</span>
                </>
              )}
              {file.extension && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="uppercase text-[10px] font-mono">{file.extension}</span>
                </>
              )}
            </div>

            {file.seriesTitle && file.kind === 'episode' && (
              <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                {file.seriesTitle}
                {file.seasonNumber !== undefined && file.episodeNumber !== undefined && (
                  <span className="font-mono text-zinc-300 ml-1">
                    T{file.seasonNumber}:E{file.episodeNumber}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Context Options Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
              aria-label="Opciones de archivo"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-6 w-48 bg-zinc-950 border border-zinc-800 rounded shadow-2xl py-1 z-30 text-xs text-zinc-300"
                onMouseLeave={() => {
                  setShowMenu(false);
                  setShowPlaylistMenu(false);
                }}
              >
                <button
                  onClick={() => {
                    playMedia(file, true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-zinc-900 flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Reproducir desde el inicio</span>
                </button>

                <button
                  onClick={() => {
                    setEditingFile(file);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-zinc-900 flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Editar metadatos</span>
                </button>

                <button
                  onClick={() => {
                    setInspectingFile(file);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-zinc-900 flex items-center gap-2"
                >
                  <Info className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Inspeccionar FFprobe</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                    className="w-full px-3 py-1.5 text-left hover:bg-zinc-900 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Añadir a lista</span>
                    </span>
                    <span>›</span>
                  </button>

                  {showPlaylistMenu && (
                    <div className="absolute left-full top-0 w-44 bg-zinc-950 border border-zinc-800 rounded py-1 shadow-2xl">
                      {playlists.map(pl => (
                        <button
                          key={pl.id}
                          onClick={() => {
                            addItemToPlaylist(pl.id, file.id);
                            setShowMenu(false);
                            setShowPlaylistMenu(false);
                          }}
                          className="w-full px-3 py-1 text-left hover:bg-zinc-900 text-xs truncate"
                        >
                          {pl.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="my-1 border-t border-zinc-900" />

                <button
                  onClick={() => {
                    resetProgress(file.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                >
                  Reiniciar estado de visto
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
