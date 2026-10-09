import { IPC_CHANNELS } from '../ipc/channels';

// Safe renderer bridge definition
export interface ElectronBridgeAPI {
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  };
  dialog: {
    openDirectory: () => Promise<string | null>;
    openFile: (filters?: Array<{ name: string; extensions: string[] }>) => Promise<string | null>;
  };
  ffmpeg: {
    probe: (filepath: string) => Promise<unknown>;
    executeJob: (jobId: string, commandArgs: string[]) => Promise<void>;
    cancelJob: (jobId: string) => Promise<void>;
    onProgress: (callback: (data: { jobId: string; percent: number; speed?: string }) => void) => () => void;
  };
  db: {
    query: (sql: string, params?: unknown[]) => Promise<unknown[]>;
    execute: (sql: string, params?: unknown[]) => Promise<void>;
  };
}

// In standard Electron execution, contextBridge exposes this to window.electronAPI:
export const initializePreload = () => {
  try {
    // Dynamically access electron in Electron runtime
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { contextBridge, ipcRenderer } = require('electron');

    const api: ElectronBridgeAPI = {
      window: {
        minimize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
        maximize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
        close: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
      },
      dialog: {
        openDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY),
        openFile: (filters) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE, filters),
      },
      ffmpeg: {
        probe: (filepath: string) => ipcRenderer.invoke(IPC_CHANNELS.FFMPEG_PROBE, filepath),
        executeJob: (jobId: string, commandArgs: string[]) => ipcRenderer.invoke(IPC_CHANNELS.FFMPEG_EXECUTE_JOB, { jobId, commandArgs }),
        cancelJob: (jobId: string) => ipcRenderer.invoke(IPC_CHANNELS.FFMPEG_CANCEL_JOB, jobId),
        onProgress: (callback) => {
          const handler = (_event: any, data: any) => callback(data);
          ipcRenderer.on('ffmpeg:progress', handler);
          return () => ipcRenderer.removeListener('ffmpeg:progress', handler);
        },
      },
      db: {
        query: (sql: string, params?: unknown[]) => ipcRenderer.invoke(IPC_CHANNELS.DB_QUERY, { sql, params }),
        execute: (sql: string, params?: unknown[]) => ipcRenderer.invoke(IPC_CHANNELS.DB_EXECUTE, { sql, params }),
      },
    };

    contextBridge.exposeInMainWorld('electronAPI', api);
  } catch (err) {
    // In web preview or browser environment, gracefully ignored
  }
};

initializePreload();
