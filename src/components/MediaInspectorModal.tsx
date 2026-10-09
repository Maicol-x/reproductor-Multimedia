import React, { useEffect, useState } from 'react';
import { X, Layers, Cpu, Volume2, Subtitles, HardDrive } from 'lucide-react';
import { MediaFile, TechnicalMediaInfo } from '../types/media';
import { inspectMedia } from '../../core/media/ffmpeg';

interface MediaInspectorModalProps {
  file: MediaFile | null;
  onClose: () => void;
}

export const MediaInspectorModal: React.FC<MediaInspectorModalProps> = ({ file, onClose }) => {
  const [info, setInfo] = useState<TechnicalMediaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    inspectMedia(file.path, file.duration)
      .then((res) => {
        setInfo(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [file]);

  if (!file) return null;

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-950 border border-zinc-800 rounded max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 text-zinc-300 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-zinc-200" />
            <div>
              <h3 className="text-sm font-semibold text-white">Inspección Técnica Multimedia (FFprobe)</h3>
              <p className="text-[11px] text-zinc-500 font-mono truncate max-w-md">{file.path}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-500 animate-pulse">
            Ejecutando ffprobe sobre los flujos del contenedor...
          </div>
        ) : (
          <div className="flex flex-col gap-5 text-xs">
            {/* General Container Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-900/40 p-3 rounded border border-zinc-800/80">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Contenedor</span>
                <span className="font-semibold text-zinc-200 uppercase">{info?.formatName || file.extension}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Tamaño</span>
                <span className="font-mono tabular-nums text-zinc-200">{formatBytes(file.size)}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Duración</span>
                <span className="font-mono tabular-nums text-zinc-200">{formatSeconds(file.duration)}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Tasa de bits global</span>
                <span className="font-mono tabular-nums text-zinc-200">{info?.bitrate || file.bitrate || 3200} kbps</span>
              </div>
            </div>

            {/* Video Streams */}
            {info?.videoStreams && info.videoStreams.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-zinc-200 font-medium text-xs">
                  <Cpu className="w-4 h-4 text-zinc-400" />
                  <span>Pista de Vídeo</span>
                </div>
                {info.videoStreams.map((v, i) => (
                  <div key={i} className="bg-zinc-900/30 p-3 rounded border border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Códec</span>
                      <span className="font-mono text-zinc-200 uppercase">{v.codec}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Resolución</span>
                      <span className="font-mono tabular-nums text-zinc-200">{v.width} × {v.height} ({v.aspectRatio})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Cadencia de cuadros</span>
                      <span className="font-mono tabular-nums text-zinc-200">{v.fps} FPS</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Formato de píxel</span>
                      <span className="font-mono text-zinc-200">{v.pixelFormat}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Audio Streams */}
            {info?.audioStreams && info.audioStreams.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-zinc-200 font-medium text-xs">
                  <Volume2 className="w-4 h-4 text-zinc-400" />
                  <span>Pistas de Audio</span>
                </div>
                {info.audioStreams.map((a, i) => (
                  <div key={i} className="bg-zinc-900/30 p-3 rounded border border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Códec</span>
                      <span className="font-mono text-zinc-200 uppercase">{a.codec}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Canales</span>
                      <span className="font-mono text-zinc-200">{a.channelLayout} ({a.channels} canales)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Frecuencia de muestreo</span>
                      <span className="font-mono tabular-nums text-zinc-200">{a.sampleRate} Hz</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Tasa de bits audio</span>
                      <span className="font-mono tabular-nums text-zinc-200">{a.bitrate} kbps</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Subtitle Streams */}
            {info?.subtitleStreams && info.subtitleStreams.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-zinc-200 font-medium text-xs">
                  <Subtitles className="w-4 h-4 text-zinc-400" />
                  <span>Pistas de Subtítulos Integradas</span>
                </div>
                <div className="bg-zinc-900/30 p-3 rounded border border-zinc-800/60 flex flex-col gap-2">
                  {info.subtitleStreams.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-zinc-800/40 last:border-0">
                      <span className="text-zinc-200">{s.title || `Pista ${i + 1}`}</span>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                        <span className="uppercase">{s.codec}</span>
                        <span>·</span>
                        <span className="uppercase">{s.language || 'und'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded text-xs transition-colors border border-zinc-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
