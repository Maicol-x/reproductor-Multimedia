import React, { useState } from 'react';
import { X, FolderPlus, Folder, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useLibraryStore } from '../stores/useLibraryStore';

interface LibraryScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LibraryScannerModal: React.FC<LibraryScannerModalProps> = ({ isOpen, onClose }) => {
  const {
    folders,
    addWatchFolder,
    removeWatchFolder,
    scanFolder,
    cancelScan,
    isScanning,
    scanProgress,
  } = useLibraryStore();

  const [newFolderPath, setNewFolderPath] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  if (!isOpen) return null;

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderPath.trim()) return;
    addWatchFolder(newFolderPath.trim(), newFolderName.trim());
    setNewFolderPath('');
    setNewFolderName('');
  };

  const handlePickDirectory = async () => {
    // Check if Electron native dialog exists
    if ((window as any).electronAPI?.dialog?.openDirectory) {
      const selected = await (window as any).electronAPI.dialog.openDirectory();
      if (selected) {
        setNewFolderPath(selected);
        const name = selected.split(/[\\/]/).pop();
        if (name) setNewFolderName(name);
      }
      return;
    }

    // Check if HTML5 Directory Picker is available
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker();
        if (handle && handle.name) {
          const simulatedPath = `C:\\Media\\${handle.name}`;
          setNewFolderPath(simulatedPath);
          setNewFolderName(handle.name);
        }
      } catch (err) {
        // User cancelled picker
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-950 border border-zinc-800 rounded max-w-xl w-full p-6 shadow-2xl flex flex-col gap-5 text-zinc-300 max-h-[85vh] overflow-y-auto text-xs">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Administración de Ubicaciones Supervisadas</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Configura las carpetas locales de Windows donde Monochrome Media buscará tus vídeos, películas, series y música.
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scan Status Banner */}
        {isScanning && (
          <div className="bg-zinc-900 border border-zinc-700 p-3 rounded flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-white font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-300" />
                <span>Analizando biblioteca...</span>
              </span>
              <button
                onClick={cancelScan}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] transition-colors"
              >
                Cancelar escaneo
              </button>
            </div>
            {scanProgress && (
              <div className="flex flex-col gap-1">
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-200"
                    style={{
                      width: `${
                        scanProgress.totalFound > 0
                          ? (scanProgress.scannedCount / scanProgress.totalFound) * 100
                          : 30
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                  <span className="truncate max-w-xs">{scanProgress.currentFile || scanProgress.currentFolder}</span>
                  <span className="tabular-nums">
                    {scanProgress.scannedCount} / {scanProgress.totalFound || '...'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Folder Form */}
        <form onSubmit={handleAddFolder} className="bg-zinc-900/40 p-3 rounded border border-zinc-800/80 flex flex-col gap-2.5">
          <span className="font-semibold text-white text-xs flex items-center gap-1.5">
            <FolderPlus className="w-4 h-4 text-zinc-400" />
            <span>Añadir nueva ubicación</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 flex gap-1">
              <input
                type="text"
                placeholder="Ruta (ej: D:\Peliculas o C:\Series)..."
                value={newFolderPath}
                onChange={(e) => setNewFolderPath(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
              />
              <button
                type="button"
                onClick={handlePickDirectory}
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs border border-zinc-700 whitespace-nowrap"
                title="Examinar carpetas nativas"
              >
                Examinar...
              </button>
            </div>
            <input
              type="text"
              placeholder="Nombre amigable (opcional)..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
            />
          </div>
          <div className="flex justify-end mt-1">
            <button
              type="submit"
              disabled={!newFolderPath.trim()}
              className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 font-medium rounded text-xs transition-colors disabled:opacity-40"
            >
              Añadir y Escanear
            </button>
          </div>
        </form>

        {/* Existing Monitored Folders List */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
            Carpetas Configuradas ({folders.length})
          </span>
          <div className="flex flex-col gap-2">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center justify-between p-3 bg-zinc-900/30 border border-zinc-800/60 rounded"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <Folder className="w-5 h-5 text-zinc-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-white truncate flex items-center gap-2">
                      <span>{folder.name}</span>
                      {folder.lastScannedAt && (
                        <span title="Escaneo completado">
                          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono truncate">{folder.path}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {folder.itemCount} archivos identificados
                      {folder.lastScannedAt && ` · Último escaneo: ${new Date(folder.lastScannedAt).toLocaleTimeString()}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => scanFolder(folder.id)}
                    disabled={isScanning}
                    title="Reescanear esta carpeta"
                    className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeWatchFolder(folder.id)}
                    title="Eliminar de carpetas supervisadas"
                    className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded text-xs transition-colors border border-zinc-800"
          >
            Aceptar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
