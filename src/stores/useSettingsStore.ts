import { create } from 'zustand';
import { AppSettings } from '../types/media';
import { db } from '../../core/database/db';

interface SettingsState {
  settings: AppSettings;
  init: () => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  exportBackup: () => string;
  importBackup: (json: string) => boolean;
  clearAllDatabase: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: db.getSettings(),

  init: () => {
    set({ settings: db.getSettings() });
  },

  updateSettings: (partial: Partial<AppSettings>) => {
    db.saveSettings(partial);
    set({ settings: db.getSettings() });
  },

  exportBackup: () => {
    return db.exportBackupJson();
  },

  importBackup: (json: string) => {
    const success = db.importBackupJson(json);
    if (success) {
      set({ settings: db.getSettings() });
    }
    return success;
  },

  clearAllDatabase: () => {
    db.clearAllData();
    set({ settings: db.getSettings() });
  },
}));
