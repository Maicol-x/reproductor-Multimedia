import React, { useRef, useEffect } from 'react';
import { Music2, Play, Pause, Shuffle, Repeat, Volume2, Disc } from 'lucide-react';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { usePlayerStore } from '../../stores/usePlayerStore';

export const AudioView: React.FC = () => {
  const { files } = useLibraryStore();
  const { currentMedia, isPlaying, playMedia, togglePlay } = usePlayerStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const audioFiles = files.filter(f => f.kind === 'audio');

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Live waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const draw = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barCount = 48;
      const barWidth = canvas.width / barCount;

      for (let i = 0; i < barCount; i++) {
        const height = isPlaying && currentMedia?.kind === 'audio'
          ? (Math.sin(Date.now() / 250 + i * 0.4) * 0.5 + 0.5) * (canvas.height * 0.7) + 6
          : 4;
        ctx.fillStyle = '#f4f4f5';
        ctx.fillRect(i * barWidth + 1, canvas.height - height, barWidth - 2, height);
      }
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, currentMedia]);

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-zinc-950 text-zinc-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-zinc-300" />
            <h2 className="text-lg font-bold text-white">Música y Audio</h2>
            <span className="text-xs text-zinc-500 font-mono">({audioFiles.length} pistas)</span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Archivos sin pérdida FLAC, WAV, MP3 y AAC con visualización espectral y metadatos.
          </p>
        </div>

        {/* Audio Visualizer Mini Monitor */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded p-2 flex items-center gap-3">
          <canvas ref={canvasRef} width={180} height={36} className="rounded bg-black/60" />
          <div className="text-[11px] font-mono text-zinc-400">
            <div>{isPlaying && currentMedia?.kind === 'audio' ? 'REPRODUCIENDO' : 'PAUSADO'}</div>
            <div className="text-white font-medium truncate max-w-[120px]">
              {currentMedia?.kind === 'audio' ? currentMedia.title : 'Ninguna pista activa'}
            </div>
          </div>
        </div>
      </div>

      {/* Audio Track Table */}
      {audioFiles.length > 0 ? (
        <div className="flex flex-col border border-zinc-800/80 rounded overflow-hidden divide-y divide-zinc-900 bg-zinc-950">
          <div className="grid grid-cols-12 px-4 py-2 text-[10px] uppercase font-mono text-zinc-500 bg-zinc-900/60">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Título de la pista</span>
            <span className="col-span-3">Álbum / Colección</span>
            <span className="col-span-1">Códec</span>
            <span className="col-span-2 text-right">Duración</span>
          </div>

          {audioFiles.map((track, idx) => {
            const isCurrent = currentMedia?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => playMedia(track)}
                className={`grid grid-cols-12 px-4 py-3 text-xs items-center cursor-pointer transition-colors ${
                  isCurrent ? 'bg-zinc-800/60 text-white font-medium' : 'hover:bg-zinc-900/40 text-zinc-300'
                }`}
              >
                <div className="col-span-1 text-zinc-500 font-mono">
                  {isCurrent && isPlaying ? (
                    <Disc className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    String(idx + 1).padStart(2, '0')
                  )}
                </div>

                <div className="col-span-5 flex items-center gap-2 truncate pr-2">
                  <span className="truncate text-white">{track.title}</span>
                </div>

                <div className="col-span-3 text-zinc-400 truncate">
                  {track.seriesTitle || 'Álbum Desconocido'}
                </div>

                <div className="col-span-1 text-zinc-500 font-mono uppercase text-[10px]">
                  {track.audioCodec || track.extension}
                </div>

                <div className="col-span-2 text-right text-zinc-400 font-mono tabular-nums">
                  {formatSeconds(track.duration)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-zinc-500">
          No se encontraron pistas de audio en las carpetas supervisadas.
        </div>
      )}
    </div>
  );
};
