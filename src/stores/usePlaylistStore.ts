import { create } from 'zustand';
import { Playlist, MediaFile } from '../types/media';
import { db } from '../../core/database/db';

interface PlaylistState {
  playlists: Playlist[];
  activePlaylistId: string | null;

  init: () => void;
  createPlaylist: (title: string, description?: string) => Playlist;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  addItemToPlaylist: (playlistId: string, mediaFileId: string) => void;
  removeItemFromPlaylist: (playlistId: string, mediaFileId: string) => void;
  reorderPlaylistItem: (playlistId: string, startIndex: number, endIndex: number) => void;
  setActivePlaylistId: (id: string | null) => void;
  getPlaylistMediaFiles: (playlist: Playlist) => MediaFile[];
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  activePlaylistId: null,

  init: () => {
    set({ playlists: db.getPlaylists() });
  },

  createPlaylist: (title: string, description?: string) => {
    const pl = db.createPlaylist(title, description);
    set({ playlists: db.getPlaylists(), activePlaylistId: pl.id });
    return pl;
  },

  updatePlaylist: (id: string, updates: Partial<Playlist>) => {
    db.updatePlaylist(id, updates);
    set({ playlists: db.getPlaylists() });
  },

  deletePlaylist: (id: string) => {
    db.deletePlaylist(id);
    set((s) => ({
      playlists: db.getPlaylists(),
      activePlaylistId: s.activePlaylistId === id ? null : s.activePlaylistId,
    }));
  },

  addItemToPlaylist: (playlistId: string, mediaFileId: string) => {
    db.addPlaylistItem(playlistId, mediaFileId);
    set({ playlists: db.getPlaylists() });
  },

  removeItemFromPlaylist: (playlistId: string, mediaFileId: string) => {
    db.removePlaylistItem(playlistId, mediaFileId);
    set({ playlists: db.getPlaylists() });
  },

  reorderPlaylistItem: (playlistId: string, startIndex: number, endIndex: number) => {
    db.reorderPlaylistItem(playlistId, startIndex, endIndex);
    set({ playlists: db.getPlaylists() });
  },

  setActivePlaylistId: (id: string | null) => set({ activePlaylistId: id }),

  getPlaylistMediaFiles: (playlist: Playlist): MediaFile[] => {
    const allFiles = db.getMediaFiles();
    if (playlist.isSmart) {
      if (playlist.smartType === 'favorites') {
        // Find items in smart-favorites playlist or highly rated
        return allFiles.filter(f => playlist.itemIds.includes(f.id));
      }
      if (playlist.smartType === 'history') {
        return allFiles.filter(f => f.lastPlayedAt && f.lastPlayedAt > 0)
          .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
      }
      if (playlist.smartType === 'in_progress') {
        return allFiles.filter(f => f.playbackPosition > 10 && !f.isWatched)
          .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
      }
      if (playlist.smartType === 'unwatched') {
        return allFiles.filter(f => !f.isWatched && (!f.playbackPosition || f.playbackPosition < 10));
      }
    }
    return playlist.itemIds
      .map(id => allFiles.find(f => f.id === id))
      .filter((f): f is MediaFile => Boolean(f));
  },
}));
