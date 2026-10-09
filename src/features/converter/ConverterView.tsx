import React, { useState } from 'react';
import {
  Sliders,
  Music,
  Video,
  FileCode,
  Minimize2,
  Play,
  XCircle,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Trash2
} from 'lucide-react';
import { useJobsStore } from '../../stores/useJobsStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { JobType, JobOptions } from '../../types/media';

export const ConverterView: React.FC = () => {
  const { jobs, createJob, cancelJob, retryJob, clearCompleted } = useJobsStore();
  const { files } = useLibraryStore();

  const [activeTool, setActiveTool] = useState<JobType>('extract_audio');
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.id || '');

  // Options states
  const [targetAudioFormat, setTargetAudioFormat] = useState('mp3');
  const [audioBitrate, setAudioBitrate] = useState('192k');
  const [sampleRate, setSampleRate] = useState<number>(44100);

  const [targetContainer, setTargetContainer] = useState('mp4');
  const [videoCodec, setVideoCodec] = useState('libx264');
  const [audioCodec, setAudioCodec] = useState('aac');
  const [resolution, setResolution] = useState('original');
  const [crf, setCrf] = useState<number>(23);
  const [qualityPreset, setQualityPreset] = useState<'ultrafast' | 'fast' | 'medium' | 'slow'>('medium');

  const selectedFile = files.find(f => f.id === selectedFileId);

  const handleStartJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    let options: JobOptions = {};

    if (activeTool === 'extract_audio') {
      options = {
        format: targetAudioFormat,
        bitrate: audioBitrate,
        sampleRate,
      };
    } else if (activeTool === 'convert_video') {
      options = {
        format: targetContainer,
        videoCodec,
        audioCodec,
        resolution,
        crf,
        qualityPreset,
      };
    } else if (activeTool === 'convert_audio') {
      options = {
        format: targetAudioFormat,
        bitrate: audioBitrate,
        sampleRate,
      };
    } else if (activeTool === 'compress_video') {
      options = {
        format: 'mp4',
        videoCodec: 'libx264',
        resolution,
        crf: 28, // Higher CRF = smaller size
        qualityPreset: 'medium',
      };
    }

    createJob(activeTool, selectedFile.path, selectedFile.title, options);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-zinc-950 text-zinc-200">
      {/* Header */}
      <div className="border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-zinc-300" />
          <h2 className="text-lg font-bold text-white">Herramientas Multimedia FFmpeg</h2>
        </div>
        <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
          Procesamiento real mediante flujos de codificación independientes sin bloqueo de interfaz.
          Extracción, transcodificación y compresión segura sin sobrescribir tus archivos originales.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tool Configurator (Left 7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/30 border border-zinc-800/80 rounded p-5 flex flex-col gap-5 text-xs">
          {/* Tool Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'extract_audio' as JobType, label: 'Extraer Audio', icon: Music },
              { id: 'convert_video' as JobType, label: 'Convertir Vídeo', icon: Video },
              { id: 'convert_audio' as JobType, label: 'Convertir Audio', icon: FileCode },
              { id: 'compress_video' as JobType, label: 'Comprimir Vídeo', icon: Minimize2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTool === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTool(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded transition-colors border ${
                    isActive
                      ? 'bg-zinc-800 text-white font-medium border-zinc-600 shadow-sm'
                      : 'bg-zinc-900/60 hover:bg-zinc-800/40 text-zinc-400 border-zinc-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleStartJob} className="flex flex-col gap-4">
            {/* Input File Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase font-mono">
                1. Archivo multimedia de origen
              </label>
              <select
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-400 font-mono"
              >
                {files.map(f => (
                  <option key={f.id} value={f.id}>
                    [{f.kind.toUpperCase()}] {f.title} ({f.extension.toUpperCase()} · {(f.size / (1024 * 1024)).toFixed(0)} MB)
                  </option>
                ))}
              </select>
              {selectedFile && (
                <div className="text-[11px] text-zinc-500 font-mono truncate">
                  Ruta: {selectedFile.path}
                </div>
              )}
            </div>

            {/* Tool Specific Parameters */}
            <div className="bg-zinc-950/60 p-4 rounded border border-zinc-800 flex flex-col gap-4">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase font-mono">
                2. Parámetros de codificación
              </span>

              {activeTool === 'extract_audio' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Formato de audio</label>
                    <select
                      value={targetAudioFormat}
                      onChange={(e) => setTargetAudioFormat(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-white"
                    >
                      <option value="mp3">MP3 (MPEG Audio Layer III)</option>
                      <option value="aac">AAC (Advanced Audio Coding)</option>
                      <option value="flac">FLAC (Sin pérdida)</option>
                      <option value="wav">WAV (PCM 16-bit)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Tasa de bits (Bitrate)</label>
                    <select
                      value={audioBitrate}
                      onChange={(e) => setAudioBitrate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-white font-mono"
                    >
                      <option value="128k">128 kbps</option>
                      <option value="192k">192 kbps (Estándar)</option>
                      <option value="256k">256 kbps (Alta fidelidad)</option>
                      <option value="320k">320 kbps (Máxima calidad)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Muestreo (Sample Rate)</label>
                    <select
                      value={sampleRate}
                      onChange={(e) => setSampleRate(parseInt(e.target.value, 10))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-white font-mono"
                    >
                      <option value={44100}>44.1 kHz (CD Audio)</option>
                      <option value={48000}>48.0 kHz (Estándar Cine)</option>
                      <option value={96000}>96.0 kHz (Hi-Res)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTool === 'convert_video' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Contenedor de salida</label>
                    <select
                      value={targetContainer}
                      onChange={(e) => setTargetContainer(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-white font-mono"
                    >
                      <option value="mp4">MP4 (.mp4)</option>
                      <option value="mkv">Matroska (.mkv)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Códec de vídeo</label>
                    <select
                      value={videoCodec}
                      onChange={(e) => setVideoCodec(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-white font-mono"
                    >
                      <option value="libx264">H.264 / AVC (Alta compatibilidad)</option>
                      <option value="libx265">H.265 / HEVC (Alta eficiencia)</option>
                      <option value="libvpx-vp9">VP9 (Código abierto WebM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Resolución</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-white font-mono"
                    >
                      <option value="original">Mantener original</option>
                      <option value="1920x1080">1080p Full HD (1920×1080)</option>
                      <option value="1280x720">720p HD (1280×720)</option>
                      <option value="854x480">480p SD (854×480)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Factor de Calidad CRF ({crf})
                    </label>
                    <input
                      type="range"
                      min={18}
                      max={28}
                      step={1}
                      value={crf}
                      onChange={(e) => setCrf(parseInt(e.target.value, 10))}
                      className="w-full accent-white"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span>18 (Mayor calidad)</span>
                      <span>28 (Menor tamaño)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'convert_audio' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Formato de destino</label>
                    <select
                      value={targetAudioFormat}
                      onChange={(e) => setTargetAudioFormat(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-white font-mono"
                    >
                      <option value="mp3">MP3</option>
                      <option value="aac">AAC</option>
                      <option value="flac">FLAC</option>
                      <option value="wav">WAV</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Tasa de bits</label>
                    <select
                      value={audioBitrate}
                      onChange={(e) => setAudioBitrate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-white font-mono"
                    >
                      <option value="128k">128 kbps</option>
                      <option value="192k">192 kbps</option>
                      <option value="320k">320 kbps</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTool === 'compress_video' && (
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Aplica codificación adaptativa x264 CRF 28 con audio AAC para reducir de un 40% a un 70% el peso del vídeo original sin pérdidas notables en pantallas estándar.
                  </p>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Escalar resolución (opcional)</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-white font-mono"
                    >
                      <option value="original">Mantener resolución actual</option>
                      <option value="1920x1080">Reducir a 1080p</option>
                      <option value="1280x720">Reducir a 720p (Máximo ahorro)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!selectedFile}
                className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-medium rounded text-xs flex items-center gap-2 transition-colors disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Añadir a la Cola de Procesamiento</span>
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Jobs Queue (Right 5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/30 border border-zinc-800/80 rounded p-5 flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-300" />
              <h3 className="font-semibold text-white">Cola de Trabajos ({jobs.length})</h3>
            </div>
            {jobs.some(j => j.status === 'completed' || j.status === 'failed') && (
              <button
                onClick={clearCompleted}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                title="Limpiar completados"
              >
                <Trash2 className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto">
            {jobs.map((job) => {
              const isRunning = job.status === 'processing';
              const isCompleted = job.status === 'completed';
              const isFailed = job.status === 'failed' || job.status === 'interrupted';
              const isCancelled = job.status === 'cancelled';

              return (
                <div
                  key={job.id}
                  className="bg-zinc-950 p-3 rounded border border-zinc-800/80 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white truncate">{job.inputTitle}</div>
                      <div className="text-[10px] text-zinc-500 font-mono uppercase mt-0.5">
                        {job.type.replace('_', ' ')} · {job.options.format?.toUpperCase() || 'MP4'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isRunning && (
                        <button
                          onClick={() => cancelJob(job.id)}
                          className="p-1 text-zinc-400 hover:text-red-400"
                          title="Cancelar trabajo"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(isFailed || isCancelled) && (
                        <button
                          onClick={() => retryJob(job.id)}
                          className="p-1 text-zinc-400 hover:text-white"
                          title="Reintentar trabajo"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Badge & Progress */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-zinc-100'
                            : isFailed
                            ? 'bg-red-500'
                            : isCancelled
                            ? 'bg-zinc-500'
                            : 'bg-white animate-pulse'
                        }`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1">
                        {isRunning && <span className="text-white font-medium">Ejecutando... {job.speed}</span>}
                        {isCompleted && <span className="text-zinc-200">Completado con éxito</span>}
                        {isFailed && <span className="text-red-400">{job.error || 'Fallido'}</span>}
                        {isCancelled && <span className="text-zinc-500">Cancelado</span>}
                        {job.status === 'pending' && <span className="text-zinc-500">En espera en cola</span>}
                      </span>
                      <span className="tabular-nums font-medium text-white">{job.progress}%</span>
                    </div>

                    {isRunning && (
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                        <span>Tiempo: {formatSeconds(job.elapsedSeconds)}</span>
                        {job.remainingSeconds !== undefined && (
                          <span>Restante aprox: {formatSeconds(job.remainingSeconds)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {jobs.length === 0 && (
              <div className="py-16 text-center text-zinc-600 text-xs">
                No hay trabajos en la cola de procesamiento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
