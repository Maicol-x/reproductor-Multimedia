import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  PictureInPicture2,
  Subtitles,
  AudioLines,
  Sliders,
  Settings2,
  X,
  FastForward,
  Info
} from 'lucide-react';
import { usePlayerStore, AspectRatioMode } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';

export const PlayerView: React.FC = () => {
  const {
    currentMedia,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    aspectRatio,
    isFullscreen,
    isControlsVisible,
    subtitleTracks,
    activeSubtitleTrackId,
    currentSubtitleText,
    subtitleOffsetSeconds,
    subtitleSize,
    audioTracks,
    activeAudioTrackId,
    showNextEpisodePrompt,
    nextEpisode,
    nextEpisodeCountdown,
    togglePlay,
    pause,
    play,
    seek,
    seekRelative,
    setVolume,
    toggleMute,
    setPlaybackRate,
    setAspectRatio,
    setIsFullscreen,
    setIsMiniPlayer,
    setControlsVisible,
    updateTime,
    setActiveSubtitleTrack,
    loadExternalSubtitles,
    setSubtitleOffset,
    setSubtitleSize,
    setActiveAudioTrack,
    cancelNextEpisodePrompt,
    playNextEpisodeNow,
    closePlayer,
  } = usePlayerStore();

  const { setInspectingFile } = useLibraryStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);

  // Auto-hide controls
  const handleMouseMove = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
        setShowSettingsMenu(false);
        setShowSubtitleMenu(false);
        setShowAudioMenu(false);
      }, 3000);
    }
  }, [isPlaying, setControlsVisible]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'Escape':
          e.preventDefault();
          if (isFullscreen) {
            handleToggleFullscreen();
          } else {
            closePlayer();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seekRelative, volume, setVolume, toggleMute, isFullscreen, closePlayer]);

  // Video element sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Math.abs(video.currentTime - currentTime) > 1.5) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = isMuted ? 0 : volume;
    video.playbackRate = playbackRate;
  }, [volume, isMuted, playbackRate]);

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Picture in Picture
  const handleTogglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsMiniPlayer(false);
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        setIsMiniPlayer(true);
      }
    } catch (e) {
      console.warn('PiP error', e);
    }
  };

  // Fallback visualizer animation for local audio or files without direct video streams
  useEffect(() => {
    if (!currentMedia || currentMedia.kind !== 'audio') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const draw = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bars = 64;
      const barWidth = canvas.width / bars;
      for (let i = 0; i < bars; i++) {
        const height = isPlaying
          ? (Math.sin(Date.now() / 200 + i * 0.3) * 0.5 + 0.5) * (canvas.height * 0.6) + 10
          : 4;
        ctx.fillStyle = '#e4e4e7';
        ctx.fillRect(i * barWidth + 1, canvas.height / 2 - height / 2, barWidth - 2, height);
      }
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [currentMedia, isPlaying]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  const handleFileUploadSubtitles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        loadExternalSubtitles(file.name, content);
      }
    };
    reader.readAsText(file);
  };

  if (!currentMedia) return null;

  // Aspect ratio class mapping
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16:9': return 'aspect-video object-contain';
      case '4:3': return 'aspect-[4/3] object-contain';
      case '21:9': return 'aspect-[21/9] object-contain';
      case 'fill': return 'w-full h-full object-fill';
      default: return 'w-full h-full object-contain';
    }
  };

  const getSubtitleSizeClass = () => {
    switch (subtitleSize) {
      case 'small': return 'text-sm sm:text-base';
      case 'large': return 'text-xl sm:text-2xl';
      default: return 'text-base sm:text-lg';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 bg-black z-50 flex flex-col justify-between overflow-hidden select-none cursor-default"
    >
      {/* Hidden file input for external subtitles */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUploadSubtitles}
        accept=".srt,.vtt,.txt"
        className="hidden"
      />

      {/* Top Bar (Title & Window Controls) */}
      <div
        className={`h-14 bg-gradient-to-b from-black/90 to-transparent px-4 flex items-center justify-between text-white transition-opacity duration-300 z-30 ${
          isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={closePlayer}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-zinc-300 hover:text-white"
            aria-label="Cerrar reproductor"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate text-zinc-100">{currentMedia.title}</h2>
            <div className="text-[11px] text-zinc-400 font-mono truncate">
              {currentMedia.seriesTitle && `${currentMedia.seriesTitle} · `}
              {currentMedia.kind === 'episode' && `T${currentMedia.seasonNumber}:E${currentMedia.episodeNumber} · `}
              {currentMedia.videoCodec?.toUpperCase()} · {currentMedia.audioCodec?.toUpperCase()} · {currentMedia.extension?.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setInspectingFile(currentMedia)}
            title="Inspeccionar pistas técnicas (FFprobe)"
            className="p-2 hover:bg-white/10 rounded text-zinc-300 hover:text-white transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Video/Audio Viewport */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
        {currentMedia.kind === 'audio' ? (
          <div className="flex flex-col items-center justify-center gap-6 w-full max-w-md px-4">
            <div className="w-48 h-48 rounded bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex items-center justify-center">
              <img
                src={currentMedia.posterUrl}
                alt={currentMedia.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white truncate">{currentMedia.title}</h3>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                {currentMedia.seriesTitle || 'Álbum Desconocido'} · {currentMedia.audioCodec?.toUpperCase()} · {currentMedia.sampleRate}Hz
              </p>
            </div>
            <canvas ref={canvasRef} width={380} height={70} className="w-full rounded bg-zinc-950/60 border border-zinc-900" />
          </div>
        ) : (
          <video
            ref={videoRef}
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            className={`max-w-full max-h-full ${getAspectRatioClass()}`}
            onClick={togglePlay}
            onTimeUpdate={(e) => {
              const target = e.currentTarget;
              updateTime(target.currentTime, target.duration || currentMedia.duration);
            }}
            onEnded={() => {
              pause();
            }}
          />
        )}

        {/* Subtitle Text Overlay */}
        {currentSubtitleText && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-3xl text-center px-4 pointer-events-none z-20">
            <span
              className={`bg-black/80 text-white font-medium px-3 py-1.5 rounded leading-relaxed shadow-lg backdrop-blur-xs ${getSubtitleSizeClass()}`}
            >
              {currentSubtitleText}
            </span>
          </div>
        )}

        {/* Auto-Play Next Episode Prompt Banner */}
        {showNextEpisodePrompt && nextEpisode && (
          <div className="absolute top-20 right-8 bg-zinc-950/95 border border-zinc-700 p-4 rounded shadow-2xl max-w-sm w-full z-40 text-xs animate-in fade-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono text-zinc-400">Siguiente Episodio</span>
              <button onClick={cancelNextEpisodePrompt} className="text-zinc-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="font-semibold text-white truncate text-sm mb-1">{nextEpisode.title}</div>
            <div className="text-[11px] text-zinc-400 mb-3">
              T{nextEpisode.seasonNumber}:E{nextEpisode.episodeNumber} · Reproducción en {nextEpisodeCountdown} segundos...
            </div>
            <div className="flex gap-2">
              <button
                onClick={playNextEpisodeNow}
                className="flex-1 bg-white hover:bg-zinc-200 text-zinc-950 font-medium py-1.5 rounded transition-colors text-xs flex items-center justify-center gap-1.5"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Reproducir ahora</span>
              </button>
              <button
                onClick={cancelNextEpisodePrompt}
                className="px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div
        className={`bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 flex flex-col gap-2 transition-opacity duration-300 z-30 ${
          isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber bar */}
        <div className="relative group w-full flex items-center">
          <input
            type="range"
            min={0}
            max={duration || currentMedia.duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleScrubberChange}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white hover:h-2 transition-all"
          />
          {/* Progress fill */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-white pointer-events-none rounded-l"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between mt-1 text-zinc-300">
          {/* Left Controls: Play, Skips, Timestamps, Volume */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:bg-zinc-200 transition-colors"
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => seekRelative(-10)}
              className="p-1.5 hover:bg-white/10 rounded text-zinc-300 hover:text-white transition-colors"
              title="Retroceder 10s (Flecha izquierda)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => seekRelative(10)}
              className="p-1.5 hover:bg-white/10 rounded text-zinc-300 hover:text-white transition-colors"
              title="Avanzar 10s (Flecha derecha)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Time Indicator */}
            <div className="text-xs font-mono tabular-nums text-zinc-400 ml-2">
              <span className="text-zinc-100 font-medium">{formatTime(currentTime)}</span>
              <span className="mx-1 text-zinc-600">/</span>
              <span>{formatTime(duration || currentMedia.duration)}</span>
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-2 group ml-3">
              <button
                onClick={toggleMute}
                className="p-1.5 hover:bg-white/10 rounded text-zinc-300 hover:text-white transition-colors"
                aria-label={isMuted ? 'Desactivar silencio' : 'Silenciar'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>

          {/* Right Controls: Subtitles, Audio Track, Speed, Aspect, PiP, Fullscreen */}
          <div className="flex items-center gap-1.5 relative">
            {/* Subtitles Menu Toggle */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSubtitleMenu(!showSubtitleMenu);
                  setShowSettingsMenu(false);
                  setShowAudioMenu(false);
                }}
                className={`p-2 rounded transition-colors ${
                  activeSubtitleTrackId !== 'sub-none'
                    ? 'bg-zinc-800 text-white'
                    : 'hover:bg-white/10 text-zinc-300 hover:text-white'
                }`}
                title="Pistas de subtítulos"
              >
                <Subtitles className="w-4 h-4" />
              </button>

              {showSubtitleMenu && (
                <div className="absolute right-0 bottom-11 w-64 bg-zinc-950 border border-zinc-800 rounded p-2 shadow-2xl text-xs z-50 flex flex-col gap-2">
                  <div className="font-semibold text-white border-b border-zinc-800 pb-1.5">Subtítulos</div>
                  
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {subtitleTracks.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSubtitleTrack(sub.id)}
                        className={`px-2.5 py-1.5 text-left rounded truncate transition-colors ${
                          activeSubtitleTrackId === sub.id ? 'bg-zinc-800 text-white font-medium' : 'hover:bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-1.5 text-center bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 transition-colors text-[11px]"
                  >
                    + Cargar subtítulo (.srt / .vtt)
                  </button>

                  {/* Subtitle Offset adjustment */}
                  <div className="border-t border-zinc-800 pt-2 flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Sincronización (Offset):</span>
                      <span className="font-mono tabular-nums text-white">{subtitleOffsetSeconds}s</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSubtitleOffset(subtitleOffsetSeconds - 0.5)}
                        className="flex-1 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-[11px]"
                      >
                        -0.5s
                      </button>
                      <button
                        onClick={() => setSubtitleOffset(0)}
                        className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded text-[11px]"
                      >
                        0
                      </button>
                      <button
                        onClick={() => setSubtitleOffset(subtitleOffsetSeconds + 0.5)}
                        className="flex-1 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-[11px]"
                      >
                        +0.5s
                      </button>
                    </div>
                  </div>

                  {/* Subtitle Size */}
                  <div className="border-t border-zinc-800 pt-2 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Tamaño:</span>
                    <div className="flex gap-1">
                      {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setSubtitleSize(size)}
                          className={`px-2 py-0.5 rounded ${
                            subtitleSize === size ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-900'
                          }`}
                        >
                          {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Audio Track Menu Toggle */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAudioMenu(!showAudioMenu);
                  setShowSubtitleMenu(false);
                  setShowSettingsMenu(false);
                }}
                className="p-2 hover:bg-white/10 rounded text-zinc-300 hover:text-white transition-colors"
                title="Pistas de audio"
              >
                <AudioLines className="w-4 h-4" />
              </button>

              {showAudioMenu && (
                <div className="absolute right-0 bottom-11 w-56 bg-zinc-950 border border-zinc-800 rounded p-2 shadow-2xl text-xs z-50 flex flex-col gap-1">
                  <div className="font-semibold text-white border-b border-zinc-800 pb-1.5 mb-1">Pistas de Audio</div>
                  {audioTracks.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setActiveAudioTrack(a.id);
                        setShowAudioMenu(false);
                      }}
                      className={`px-2.5 py-1.5 text-left rounded truncate transition-colors ${
                        activeAudioTrackId === a.id ? 'bg-zinc-800 text-white font-medium' : 'hover:bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Playback Settings (Speed, Aspect Ratio) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettingsMenu(!showSettingsMenu);
                  setShowSubtitleMenu(false);
                  setShowAudioMenu(false);
                }}
                className="p-2 hover:bg-white/10 rounded text-zinc-300 hover:text-white transition-colors"
                title="Ajustes de reproducción"
              >
                <Settings2 className="w-4 h-4" />
              </button>

              {showSettingsMenu && (
                <div className="absolute right-0 bottom-11 w-52 bg-zinc-950 border border-zinc-800 rounded p-2.5 shadow-2xl text-xs z-50 flex flex-col gap-3">
                  {/* Speed */}
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1.5">Velocidad</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setPlaybackRate(rate)}
                          className={`py-1 rounded text-center font-mono ${
                            playbackRate === rate ? 'bg-white text-zinc-950 font-medium' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1.5">Relación de aspecto</span>
                    <div className="flex flex-col gap-1">
                      {(['auto', '16:9', '4:3', '21:9', 'fill'] as AspectRatioMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setAspectRatio(mode)}
                          className={`px-2.5 py-1 text-left rounded font-mono text-[11px] ${
                            aspectRatio === mode ? 'bg-zinc-800 text-white font-medium' : 'hover:bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          {mode === 'auto' ? 'Automático' : mode === 'fill' ? 'Ajustar a marco' : mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PiP */}
            <button
              onClick={handleTogglePiP}
              className="p-2 hover:bg-white/10 rounded text-zinc-300 hover:text-white transition-colors"
              title="Mini reproductor (Picture-in-Picture)"
            >
              <PictureInPicture2 className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleToggleFullscreen}
              className="p-2 hover:bg-white/10 rounded text-zinc-300 hover:text-white transition-colors"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa (F)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
