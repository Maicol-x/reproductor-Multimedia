import React from 'react';
import { History, Play, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { usePlayerStore } from '../../stores/usePlayerStore';

export const HistoryView: React.FC = () => {
  const { files, resetProgress } = useLibraryStore();
  const { playMedia } = usePlayerStore();

  const playedFiles = files
    .filter(f => f.lastPlayedAt && f.lastPlayedAt > 0)
    .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-zinc-950 text-zinc-200">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-300" />
            <h2 className="text-lg font-bold text-white">Historial de Reproducción</h2>
            <span className="text-xs text-zinc-500 font-mono">({playedFiles.length})</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Registro cronológico de sesiones y puntos de reanudación guardados localmente.
          </p>
        </div>
      </div>

      {playedFiles.length > 0 ? (
        <div className="flex flex-col border border-zinc-800/80 rounded divide-y divide-zinc-900 bg-zinc-950">
          <div className="grid grid-cols-12 px-4 py-2 text-[10px] uppercase font-mono text-zinc-500 bg-zinc-900/60">
            <span className="col-span-6">Título y tipo</span>
            <span className="col-span-3">Última reproducción</span>
            <span className="col-span-2">Punto de reanudación</span>
            <span className="col-span-1 text-right">Acciones</span>
          </div>

          {playedFiles.map((file) => {
            const percent = file.duration > 0
              ? Math.min(100, (file.playbackPosition / file.duration) * 100)
              : 0;

            return (
              <div
                key={file.id}
                className="grid grid-cols-12 px-4 py-3 text-xs items-center hover:bg-zinc-900/40 transition-colors"
              >
                <div
                  onClick={() => playMedia(file)}
                  className="col-span-6 flex items-center gap-3 truncate cursor-pointer pr-3"
                >
                  <div className="w-8 h-10 bg-zinc-900 rounded overflow-hidden shrink-0">
                    <img src={file.posterUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-white truncate flex items-center gap-2">
                      <span>{file.title}</span>
                      {file.isWatched && (
                        <span title="Completado">
                          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      {file.kind.toUpperCase()} {file.seriesTitle ? `· ${file.seriesTitle}` : ''}
                    </div>
                  </div>
                </div>

                <div className="col-span-3 text-zinc-400 font-mono text-[11px]">
                  {file.lastPlayedAt ? new Date(file.lastPlayedAt).toLocaleString() : '—'}
                </div>

                <div className="col-span-2 text-zinc-300 font-mono text-[11px]">
                  {file.isWatched ? (
                    <span className="text-zinc-500">Visto completo</span>
                  ) : (
                    <span>
                      {formatSeconds(file.playbackPosition)} ({percent.toFixed(0)}%)
                    </span>
                  )}
                </div>

                <div className="col-span-1 flex justify-end gap-1">
                  <button
                    onClick={() => playMedia(file)}
                    className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
                    title="Continuar reproducción"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => resetProgress(file.id)}
                    className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
                    title="Reiniciar progreso"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-zinc-500">
          Aún no has reproducido ningún archivo en esta sesión.
        </div>
      )}
    </div>
  );
};
