import React, { useState } from 'react';
import { Search, Minus, Square, X, Film, FolderSync, RefreshCw } from 'lucide-react';
import { useLibraryStore } from '../stores/useLibraryStore';

interface DesktopTitleBarProps {
  onOpenFolderModal: () => void;
}

export const DesktopTitleBar: React.FC<DesktopTitleBarProps> = ({ onOpenFolderModal }) => {
  const { searchQuery, setSearchQuery, scanAllFolders, isScanning, scanProgress } = useLibraryStore();
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () => {
    if ((window as any).electronAPI?.window?.minimize) {
      (window as any).electronAPI.window.minimize();
    }
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    if ((window as any).electronAPI?.window?.maximize) {
      (window as any).electronAPI.window.maximize();
    }
  };

  const handleClose = () => {
    if ((window as any).electronAPI?.window?.close) {
      (window as any).electronAPI.window.close();
    }
  };

  return (
    <header className="h-10 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between px-3 select-none text-xs text-zinc-400 shrink-0 z-50">
      {/* Brand & App Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold tracking-wider text-xs">
          <Film className="w-4 h-4 text-zinc-200" />
          <span className="font-mono tracking-tight text-white uppercase text-[11px]">Monochrome Media</span>
        </div>
        <span className="text-zinc-600" aria-hidden="true">|</span>
        <span className="text-[11px] text-zinc-400 hidden sm:inline">Windows Desktop Edition</span>
      </div>

      {/* Global Search & Scanning Indicator */}
      <div className="flex items-center gap-3 max-w-md w-full justify-center px-4">
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por título, serie o año..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 pl-8 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {isScanning && (
          <div className="flex items-center gap-2 text-[11px] text-zinc-300 animate-pulse whitespace-nowrap">
            <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
            <span>Escaneando {scanProgress?.scannedCount || 0}...</span>
          </div>
        )}
      </div>

      {/* Quick Actions & Window Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenFolderModal}
          title="Administrar carpetas supervisadas"
          className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded text-[11px] transition-colors"
        >
          <FolderSync className="w-3 h-3" />
          <span className="hidden md:inline">Carpetas</span>
        </button>

        <button
          onClick={() => scanAllFolders()}
          disabled={isScanning}
          title="Actualizar biblioteca (escaneo incremental)"
          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-colors disabled:opacity-50"
          aria-label="Actualizar biblioteca"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
        </button>

        <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

        {/* Windows Caption Buttons */}
        <div className="flex items-center">
          <button
            onClick={handleMinimize}
            className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Minimizar"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Maximizar"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-red-950/80 hover:text-red-200 text-zinc-400 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
