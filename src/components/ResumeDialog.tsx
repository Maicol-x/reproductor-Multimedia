import React from 'react';
import { Play, RotateCcw, X } from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';

export const ResumeDialog: React.FC = () => {
  const { pendingResumeFile, resumeSeconds, confirmResume } = usePlayerStore();

  if (!pendingResumeFile) return null;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins % 60).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-950 border border-zinc-800 rounded max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4 text-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Continuar reproducción</h3>
          <button
            onClick={() => confirmResume(false)}
            className="text-zinc-500 hover:text-zinc-300"
            aria-label="Cerrar diálogo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-zinc-400">
          Dejaste <strong className="text-zinc-200">{pendingResumeFile.title}</strong> en el minuto{' '}
          <span className="font-mono tabular-nums text-white font-medium">{formatSeconds(resumeSeconds)}</span>.
          ¿Cómo deseas continuar?
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={() => confirmResume(true)}
            className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-4 py-2.5 rounded text-xs transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Continuar en {formatSeconds(resumeSeconds)}</span>
          </button>

          <button
            onClick={() => confirmResume(false)}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-4 py-2.5 rounded text-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reproducir desde el inicio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
