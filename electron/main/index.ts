import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { IPC_CHANNELS } from '../ipc/channels';

// In desktop Electron environment:
export async function createMainWindow(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { app, BrowserWindow, ipcMain, dialog } = require('electron');

    await app.whenReady();

    const win = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 960,
      minHeight: 600,
      frame: false,
      backgroundColor: '#000000',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      await win.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      await win.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    // Window controls
    ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => win.minimize());
    ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    });
    ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => win.close());

    // Native Directory Picker
    ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async () => {
      const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
        title: 'Seleccionar carpeta de biblioteca',
      });
      return result.filePaths[0] || null;
    });

    // Native FFmpeg Execution
    const activeProcesses = new Map<string, ChildProcess>();

    ipcMain.handle(IPC_CHANNELS.FFMPEG_EXECUTE_JOB, async (_event: any, { jobId, commandArgs }: { jobId: string; commandArgs: string[] }) => {
      return new Promise<void>((resolve, reject) => {
        // Look for bundled ffmpeg.exe or PATH
        const ffmpegBinary = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
        const proc = spawn(ffmpegBinary, commandArgs, { windowsHide: true });
        activeProcesses.set(jobId, proc);

        proc.stderr?.on('data', (chunk: Buffer) => {
          const text = chunk.toString();
          // Parse time and speed progress
          const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
          if (timeMatch) {
            win.webContents.send('ffmpeg:progress', { jobId, rawProgress: text });
          }
        });

        proc.on('close', (code: number) => {
          activeProcesses.delete(jobId);
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`FFmpeg finalizó con código de salida ${code}`));
          }
        });

        proc.on('error', (err: Error) => {
          activeProcesses.delete(jobId);
          reject(err);
        });
      });
    });

    ipcMain.handle(IPC_CHANNELS.FFMPEG_CANCEL_JOB, (_event: any, jobId: string) => {
      const proc = activeProcesses.get(jobId);
      if (proc) {
        proc.kill('SIGTERM');
        activeProcesses.delete(jobId);
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  } catch (err) {
    // In browser/node test runner, quietly skip
  }
}
