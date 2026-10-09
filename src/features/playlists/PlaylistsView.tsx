import React, { useState } from 'react';
import { ListMusic, Plus, Play, Trash2, ArrowUp, ArrowDown, Sparkles, Shuffle } from 'lucide-react';
import { usePlaylistStore } from '../../stores/usePlaylistStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { Playlist, MediaFile } from '../../types/media';

export const PlaylistsView: React.FC = () => {
  const {
    playlists,
    activePlaylistId,
    setActivePlaylistId,
    createPlaylist,
    deletePlaylist,
    removeItemFromPlaylist,
    reorderPlaylistItem,
    getPlaylistMediaFiles,
  } = usePlaylistStore();

  const { playMedia } = usePlayerStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const currentPlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0];
  const playlistItems = currentPlaylist ? getPlaylistMediaFiles(currentPlaylist) : [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createPlaylist(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setIsCreating(false);
  };

  const handlePlayAll = () => {
    if (playlistItems.length > 0) {
      playMedia(playlistItems[0]);
    }
  };

  const handleShufflePlay = () => {
    if (playlistItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * playlistItems.length);
      playMedia(playlistItems[randomIndex]);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex bg-zinc-950 text-zinc-200">
      {/* Playlists Left Panel */}
      <div className="w-72 border-r border-zinc-800/80 p-4 flex flex-col gap-3 overflow-y-auto shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold tracking-wider">
            Listas ({playlists.length})
          </span>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Nueva Lista</span>
          </button>
        </div>

        {/* Modal/Inline creator */}
        {isCreating && (
          <form onSubmit={handleCreate} className="bg-zinc-900/60 border border-zinc-700 p-3 rounded flex flex-col gap-2 text-xs">
            <span className="font-semibold text-white">Crear Lista</span>
            <input
              type="text"
              placeholder="Nombre de la lista..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
              autoFocus
            />
            <input
              type="text"
              placeholder="Descripción opcional..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
            />
            <div className="flex justify-end gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2 py-1 bg-zinc-800 text-zinc-400 hover:text-white rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 bg-white text-zinc-950 font-medium rounded hover:bg-zinc-200"
              >
                Crear
              </button>
            </div>
          </form>
        )}

        {/* Playlists List */}
        <div className="flex flex-col gap-1">
          {playlists.map((pl) => {
            const isSelected = pl.id === currentPlaylist?.id;
            return (
              <button
                key={pl.id}
                onClick={() => setActivePlaylistId(pl.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded text-left transition-colors ${
                  isSelected
                    ? 'bg-zinc-800 text-white font-medium border border-zinc-700'
                    : 'hover:bg-zinc-900/60 text-zinc-400 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {pl.isSmart ? (
                    <Sparkles className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  ) : (
                    <ListMusic className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  )}
                  <span className="truncate text-xs">{pl.title}</span>
                </div>
                <span className="text-[10px] font-mono tabular-nums text-zinc-500">
                  {pl.isSmart ? 'Auto' : pl.itemIds.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Playlist Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {currentPlaylist ? (
          <>
            {/* Playlist Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{currentPlaylist.title}</h2>
                  {currentPlaylist.isSmart && (
                    <span className="text-[10px] uppercase font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                      Lista Inteligente
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {currentPlaylist.description || `${playlistItems.length} elementos guardados.`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayAll}
                  disabled={playlistItems.length === 0}
                  className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 font-medium rounded text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Reproducir todo</span>
                </button>
                <button
                  onClick={handleShufflePlay}
                  disabled={playlistItems.length === 0}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 transition-colors disabled:opacity-40"
                  title="Reproducción aleatoria"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                {!currentPlaylist.isSmart && (
                  <button
                    onClick={() => deletePlaylist(currentPlaylist.id)}
                    className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-red-400 rounded transition-colors"
                    title="Eliminar lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Items List */}
            {playlistItems.length > 0 ? (
              <div className="flex flex-col border border-zinc-800/80 rounded divide-y divide-zinc-900 bg-zinc-950">
                {playlistItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/40 text-xs transition-colors group"
                  >
                    <div
                      onClick={() => playMedia(item)}
                      className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer pr-4"
                    >
                      <span className="font-mono text-zinc-500 text-xs w-5 text-right">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="w-8 h-10 bg-zinc-900 rounded overflow-hidden shrink-0">
                        <img src={item.posterUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="font-semibold text-white truncate">{item.title}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {item.kind.toUpperCase()} {item.year ? `· ${item.year}` : ''} {item.height ? `· ${item.height}p` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Reorder and Remove buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                      {!currentPlaylist.isSmart && (
                        <>
                          <button
                            onClick={() => reorderPlaylistItem(currentPlaylist.id, idx, Math.max(0, idx - 1))}
                            disabled={idx === 0}
                            className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-20"
                            title="Subir posición"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => reorderPlaylistItem(currentPlaylist.id, idx, Math.min(playlistItems.length - 1, idx + 1))}
                            disabled={idx === playlistItems.length - 1}
                            className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-20"
                            title="Bajar posición"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeItemFromPlaylist(currentPlaylist.id, item.id)}
                            className="p-1 text-zinc-500 hover:text-red-400 ml-1"
                            title="Quitar de la lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-zinc-500">
                La lista no contiene ningún elemento. Puedes añadir vídeos, películas o música desde el menú contextual (⋮) de cualquier tarjeta.
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center text-xs text-zinc-500">
            Selecciona o crea una lista de reproducción.
          </div>
        )}
      </div>
    </div>
  );
};
