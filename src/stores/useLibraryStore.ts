import { create } from 'zustand';
import { MediaFile, WatchFolder, MediaKind } from '../types/media';
import { db } from '../../core/database/db';
import { libraryScanner, ScanProgress } from '../../core/library/scanner';

export type SortField = 'dateAdded' | 'title' | 'duration' | 'year' | 'size';

interface LibraryState {
  files: MediaFile[];
  folders: WatchFolder[];
  filterKind: 'all' | MediaKind;
  searchQuery: string;
  sortBy: SortField;
  sortDirection: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  isScanning: boolean;
  scanProgress: ScanProgress | null;
  editingFile: MediaFile | null;
  inspectingFile: MediaFile | null;

  // Actions
  init: () => Promise<void>;
  setFilterKind: (kind: 'all' | MediaKind) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (field: SortField) => void;
  toggleSortDirection: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setEditingFile: (file: MediaFile | null) => void;
  setInspectingFile: (file: MediaFile | null) => void;
  
  // Library operations
  scanFolder: (folderId: string) => Promise<void>;
  scanAllFolders: () => Promise<void>;
  cancelScan: () => void;
  addWatchFolder: (path: string, name?: string) => void;
  removeWatchFolder: (folderId: string) => void;
  updateMediaFile: (file: MediaFile) => void;
  deleteMediaFile: (id: string) => void;
  resetProgress: (id: string) => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  files: [],
  folders: [],
  filterKind: 'all',
  searchQuery: '',
  sortBy: 'dateAdded',
  sortDirection: 'desc',
  viewMode: 'grid',
  isScanning: false,
  scanProgress: null,
  editingFile: null,
  inspectingFile: null,

  init: async () => {
    await db.init();
    const files = db.getMediaFiles();
    const folders = db.getWatchLocations();

    set({ files, folders });

    // If database is empty on first load, seed with demo scan
    if (files.length === 0 && folders.length > 0) {
      await get().scanFolder(folders[0].id);
    }
  },

  setFilterKind: (kind) => set({ filterKind: kind }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sortBy) => set({ sortBy }),
  toggleSortDirection: () => set((s) => ({ sortDirection: s.sortDirection === 'asc' ? 'desc' : 'asc' })),
  setViewMode: (viewMode) => set({ viewMode }),
  setEditingFile: (editingFile) => set({ editingFile }),
  setInspectingFile: (inspectingFile) => set({ inspectingFile }),

  scanFolder: async (folderId: string) => {
    const folder = get().folders.find(f => f.id === folderId);
    if (!folder) return;

    set({ isScanning: true });
    try {
      await libraryScanner.scanFolder(folder, (progress) => {
        set({ scanProgress: progress });
      });
      set({
        files: db.getMediaFiles(),
        folders: db.getWatchLocations(),
        isScanning: false,
        scanProgress: null,
      });
    } catch (e: any) {
      console.warn('Scan terminated or cancelled', e.message);
      set({ isScanning: false, scanProgress: null });
    }
  },

  scanAllFolders: async () => {
    const folders = get().folders;
    for (const folder of folders) {
      if (folder.isEnabled) {
        await get().scanFolder(folder.id);
      }
    }
  },

  cancelScan: () => {
    libraryScanner.cancelScan();
    set({ isScanning: false, scanProgress: null });
  },

  addWatchFolder: (path: string, name?: string) => {
    const folder = db.addWatchLocation(path, name || '');
    set({ folders: db.getWatchLocations() });
    get().scanFolder(folder.id);
  },

  removeWatchFolder: (folderId: string) => {
    db.removeWatchLocation(folderId);
    set({ folders: db.getWatchLocations() });
  },

  updateMediaFile: (file: MediaFile) => {
    const updated = db.upsertMediaFile(file);
    set({
      files: db.getMediaFiles(),
      editingFile: null,
    });
  },

  deleteMediaFile: (id: string) => {
    db.deleteMediaFile(id);
    set({ files: db.getMediaFiles() });
  },

  resetProgress: (id: string) => {
    db.resetMediaProgress(id);
    set({ files: db.getMediaFiles() });
  },
}));
