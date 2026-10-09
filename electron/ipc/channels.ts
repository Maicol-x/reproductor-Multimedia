export const IPC_CHANNELS = {
  // Window management
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // Native Dialogs
  DIALOG_OPEN_DIRECTORY: 'dialog:open-directory',
  DIALOG_OPEN_FILE: 'dialog:open-file',

  // File System & Scanner
  FS_SCAN_DIRECTORY: 'fs:scan-directory',
  FS_READ_METADATA: 'fs:read-metadata',

  // FFmpeg & FFprobe
  FFMPEG_PROBE: 'ffmpeg:probe',
  FFMPEG_EXECUTE_JOB: 'ffmpeg:execute-job',
  FFMPEG_CANCEL_JOB: 'ffmpeg:cancel-job',

  // Database
  DB_QUERY: 'db:query',
  DB_EXECUTE: 'db:execute',
  DB_TRANSACTION: 'db:transaction',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
