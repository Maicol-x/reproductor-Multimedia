import { create } from 'zustand';
import { MediaFile, SubtitleTrack, AudioTrack } from '../types/media';
import { db } from '../../core/database/db';
import { parseSubtitleText, SubtitleCue, getActiveCueText } from '../features/player/subtitles';

export type AspectRatioMode = 'auto' | '16:9' | '4:3' | '21:9' | 'fill';

interface PlayerState {
  currentMedia: MediaFile | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  aspectRatio: AspectRatioMode;
  isFullscreen: boolean;
  isMiniPlayer: boolean;
  isControlsVisible: boolean;
  
  // Resume dialog
  pendingResumeFile: MediaFile | null;
  resumeSeconds: number;

  // Subtitles
  subtitleTracks: SubtitleTrack[];
  activeSubtitleTrackId: string | null;
  subtitleCues: SubtitleCue[];
  currentSubtitleText: string | null;
  subtitleOffsetSeconds: number;
  subtitleSize: 'small' | 'medium' | 'large';

  // Audio Tracks
  audioTracks: AudioTrack[];
  activeAudioTrackId: string | null;

  // Next Episode Auto-play
  nextEpisode: MediaFile | null;
  showNextEpisodePrompt: boolean;
  nextEpisodeCountdown: number;

  // Actions
  playMedia: (file: MediaFile, forceFromStart?: boolean) => void;
  confirmResume: (resume: boolean) => void;
  pause: () => void;
  play: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  seekRelative: (deltaSeconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  setAspectRatio: (mode: AspectRatioMode) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setIsMiniPlayer: (mini: boolean) => void;
  setControlsVisible: (visible: boolean) => void;
  updateTime: (current: number, total: number) => void;
  
  // Subtitles & Audio
  setActiveSubtitleTrack: (trackId: string | null) => void;
  loadExternalSubtitles: (name: string, content: string) => void;
  setSubtitleOffset: (offset: number) => void;
  setSubtitleSize: (size: 'small' | 'medium' | 'large') => void;
  setActiveAudioTrack: (trackId: string) => void;
  
  // Next episode
  triggerNextEpisodePrompt: (next: MediaFile) => void;
  cancelNextEpisodePrompt: () => void;
  playNextEpisodeNow: () => void;
  closePlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentMedia: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.85,
  isMuted: false,
  playbackRate: 1.0,
  aspectRatio: 'auto',
  isFullscreen: false,
  isMiniPlayer: false,
  isControlsVisible: true,

  pendingResumeFile: null,
  resumeSeconds: 0,

  subtitleTracks: [
    { id: 'sub-none', label: 'Desactivados', language: 'none', isExternal: false }
  ],
  activeSubtitleTrackId: 'sub-none',
  subtitleCues: [],
  currentSubtitleText: null,
  subtitleOffsetSeconds: 0,
  subtitleSize: 'medium',

  audioTracks: [
    { id: 'audio-main', label: 'Pista Principal (Español)', language: 'es', codec: 'aac', channels: 2 },
    { id: 'audio-secondary', label: 'Audio Original (Inglés)', language: 'en', codec: 'aac', channels: 2 }
  ],
  activeAudioTrackId: 'audio-main',

  nextEpisode: null,
  showNextEpisodePrompt: false,
  nextEpisodeCountdown: 8,

  playMedia: (file: MediaFile, forceFromStart = false) => {
    const settings = db.getSettings();
    const shouldResume = !forceFromStart &&
      settings.resumePlayback &&
      file.playbackPosition > (settings.resumeThresholdSeconds || 15) &&
      !file.isWatched;

    if (shouldResume) {
      set({
        pendingResumeFile: file,
        resumeSeconds: file.playbackPosition,
      });
      return;
    }

    set({
      currentMedia: file,
      pendingResumeFile: null,
      currentTime: forceFromStart ? 0 : file.playbackPosition || 0,
      duration: file.duration || 0,
      isPlaying: true,
      currentSubtitleText: null,
      showNextEpisodePrompt: false,
    });
  },

  confirmResume: (resume: boolean) => {
    const file = get().pendingResumeFile;
    if (!file) return;

    set({
      currentMedia: file,
      pendingResumeFile: null,
      currentTime: resume ? file.playbackPosition : 0,
      duration: file.duration || 0,
      isPlaying: true,
      currentSubtitleText: null,
    });
  },

  pause: () => {
    const media = get().currentMedia;
    if (media) {
      db.updateMediaProgress(media.id, get().currentTime, get().duration);
    }
    set({ isPlaying: false });
  },

  play: () => set({ isPlaying: true }),

  togglePlay: () => {
    const isPlaying = get().isPlaying;
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  seek: (seconds: number) => {
    const duration = get().duration;
    const clamped = Math.max(0, Math.min(seconds, duration || seconds));
    set({ currentTime: clamped });
    const media = get().currentMedia;
    if (media) {
      db.updateMediaProgress(media.id, clamped, duration);
    }
  },

  seekRelative: (deltaSeconds: number) => {
    get().seek(get().currentTime + deltaSeconds);
  },

  setVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    set({ volume: clamped, isMuted: clamped === 0 });
  },

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  setPlaybackRate: (rate: number) => set({ playbackRate: rate }),

  setAspectRatio: (mode: AspectRatioMode) => set({ aspectRatio: mode }),

  setIsFullscreen: (fullscreen: boolean) => set({ isFullscreen: fullscreen }),

  setIsMiniPlayer: (mini: boolean) => set({ isMiniPlayer: mini }),

  setControlsVisible: (visible: boolean) => set({ isControlsVisible: visible }),

  updateTime: (current: number, total: number) => {
    const cues = get().subtitleCues;
    const offset = get().subtitleOffsetSeconds;
    const activeText = cues.length > 0 ? getActiveCueText(cues, current - offset) : null;

    set({
      currentTime: current,
      duration: total > 0 ? total : get().duration,
      currentSubtitleText: activeText,
    });

    const media = get().currentMedia;
    if (media && Math.floor(current) % 5 === 0) {
      db.updateMediaProgress(media.id, current, total || media.duration);
    }

    // Check if near end of episode (>95%) to trigger next episode countdown
    if (media && media.kind === 'episode' && total > 60 && current > total * 0.95 && !get().showNextEpisodePrompt) {
      // Find next episode in series
      const allFiles = db.getMediaFiles();
      const next = allFiles.find(f =>
        f.kind === 'episode' &&
        f.seriesTitle === media.seriesTitle &&
        f.seasonNumber === media.seasonNumber &&
        f.episodeNumber === (media.episodeNumber || 0) + 1
      );
      if (next) {
        get().triggerNextEpisodePrompt(next);
      }
    }
  },

  setActiveSubtitleTrack: (trackId: string | null) => {
    if (!trackId || trackId === 'sub-none') {
      set({
        activeSubtitleTrackId: 'sub-none',
        subtitleCues: [],
        currentSubtitleText: null,
      });
    } else {
      set({ activeSubtitleTrackId: trackId });
    }
  },

  loadExternalSubtitles: (name: string, content: string) => {
    const cues = parseSubtitleText(content);
    const newTrack: SubtitleTrack = {
      id: `sub-ext-${Date.now()}`,
      label: `Externo: ${name}`,
      language: 'custom',
      isExternal: true,
      content,
    };
    set((s) => ({
      subtitleTracks: [...s.subtitleTracks, newTrack],
      activeSubtitleTrackId: newTrack.id,
      subtitleCues: cues,
    }));
  },

  setSubtitleOffset: (offset: number) => set({ subtitleOffsetSeconds: offset }),

  setSubtitleSize: (size: 'small' | 'medium' | 'large') => set({ subtitleSize: size }),

  setActiveAudioTrack: (trackId: string) => set({ activeAudioTrackId: trackId }),

  triggerNextEpisodePrompt: (next: MediaFile) => {
    set({
      nextEpisode: next,
      showNextEpisodePrompt: true,
      nextEpisodeCountdown: 8,
    });
  },

  cancelNextEpisodePrompt: () => {
    set({ showNextEpisodePrompt: false, nextEpisode: null });
  },

  playNextEpisodeNow: () => {
    const next = get().nextEpisode;
    if (next) {
      set({ showNextEpisodePrompt: false, nextEpisode: null });
      get().playMedia(next, true);
    }
  },

  closePlayer: () => {
    const media = get().currentMedia;
    if (media) {
      db.updateMediaProgress(media.id, get().currentTime, get().duration);
    }
    set({
      currentMedia: null,
      isPlaying: false,
      currentTime: 0,
      showNextEpisodePrompt: false,
      nextEpisode: null,
    });
  },
}));
