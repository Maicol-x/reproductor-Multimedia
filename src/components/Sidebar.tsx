import React from 'react';
import {
  Home,
  PlayCircle,
  Film,
  Tv,
  Video,
  Music2,
  ListMusic,
  Sliders,
  History,
  Settings,
  HardDrive
} from 'lucide-react';
import { useLibraryStore } from '../stores/useLibraryStore';

export type ActiveTab =
  | 'home'
  | 'continue_watching'
  | 'movies'
  | 'series'
  | 'videos'
  | 'audio'
  | 'playlists'
  | 'converter'
  | 'history'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { files, folders } = useLibraryStore();

  const moviesCount = files.filter(f => f.kind === 'movie').length;
  const seriesCount = new Set(files.filter(f => f.kind === 'episode' && f.seriesTitle).map(f => f.seriesTitle)).size;
  const videosCount = files.filter(f => f.kind === 'video').length;
  const audioCount = files.filter(f => f.kind === 'audio').length;
  const continueCount = files.filter(f => f.playbackPosition > 10 && !f.isWatched).length;

  const navItems = [
    { id: 'home' as ActiveTab, label: 'Inicio', icon: Home, count: null },
    { id: 'continue_watching' as ActiveTab, label: 'Continuar viendo', icon: PlayCircle, count: continueCount },
    { id: 'movies' as ActiveTab, label: 'Películas', icon: Film, count: moviesCount },
    { id: 'series' as ActiveTab, label: 'Series y Episodios', icon: Tv, count: seriesCount },
    { id: 'videos' as ActiveTab, label: 'Vídeos', icon: Video, count: videosCount },
    { id: 'audio' as ActiveTab, label: 'Música y Audio', icon: Music2, count: audioCount },
    { id: 'playlists' as ActiveTab, label: 'Listas de reproducción', icon: ListMusic, count: null },
    { id: 'converter' as ActiveTab, label: 'Herramientas FFmpeg', icon: Sliders, count: null },
    { id: 'history' as ActiveTab, label: 'Historial', icon: History, count: null },
    { id: 'settings' as ActiveTab, label: 'Configuración', icon: Settings, count: null },
  ];

  return (
    <aside className="w-60 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between shrink-0 select-none text-zinc-400">
      <div className="py-3 px-2 flex flex-col gap-0.5">
        <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">
          Biblioteca Local
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-colors ${
                isActive
                  ? 'bg-zinc-800/80 text-white font-medium border border-zinc-700/60'
                  : 'hover:bg-zinc-900/80 hover:text-zinc-200 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.count !== null && item.count > 0 && (
                <span className="text-[11px] font-mono tabular-nums text-zinc-400">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Storage and library summary at bottom */}
      <div className="p-3 border-t border-zinc-900 text-[11px] flex flex-col gap-1.5 text-zinc-500">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Almacenamiento</span>
          </span>
          <span className="font-mono tabular-nums text-zinc-400">{files.length} archivos</span>
        </div>
        <div className="text-[10px] text-zinc-600 truncate">
          {folders.filter(f => f.isEnabled).length} ubicaciones supervisadas
        </div>
      </div>
    </aside>
  );
};
