import React, { useEffect, useState } from 'react';
import { DesktopTitleBar } from './components/DesktopTitleBar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { HomeView } from './features/home/HomeView';
import { ContinueWatchingView } from './features/continue/ContinueWatchingView';
import { MoviesView } from './features/movies/MoviesView';
import { SeriesView } from './features/series/SeriesView';
import { VideosView } from './features/videos/VideosView';
import { AudioView } from './features/audio/AudioView';
import { PlaylistsView } from './features/playlists/PlaylistsView';
import { ConverterView } from './features/converter/ConverterView';
import { HistoryView } from './features/history/HistoryView';
import { SettingsView } from './features/settings/SettingsView';

import { PlayerView } from './features/player/PlayerView';
import { ResumeDialog } from './components/ResumeDialog';
import { MediaInspectorModal } from './components/MediaInspectorModal';
import { MetadataEditorModal } from './components/MetadataEditorModal';
import { LibraryScannerModal } from './components/LibraryScannerModal';

import { useLibraryStore } from './stores/useLibraryStore';
import { usePlaylistStore } from './stores/usePlaylistStore';
import { useJobsStore } from './stores/useJobsStore';
import { useSettingsStore } from './stores/useSettingsStore';
import { usePlayerStore } from './stores/usePlayerStore';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  const { init: initLibrary, inspectingFile, setInspectingFile, editingFile, setEditingFile } = useLibraryStore();
  const { init: initPlaylists } = usePlaylistStore();
  const { init: initJobs } = useJobsStore();
  const { init: initSettings } = useSettingsStore();
  const { currentMedia } = usePlayerStore();

  useEffect(() => {
    initLibrary();
    initPlaylists();
    initJobs();
    initSettings();
  }, [initLibrary, initPlaylists, initJobs, initSettings]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home': return <HomeView />;
      case 'continue_watching': return <ContinueWatchingView />;
      case 'movies': return <MoviesView />;
      case 'series': return <SeriesView />;
      case 'videos': return <VideosView />;
      case 'audio': return <AudioView />;
      case 'playlists': return <PlaylistsView />;
      case 'converter': return <ConverterView />;
      case 'history': return <HistoryView />;
      case 'settings': return <SettingsView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black text-zinc-100 font-sans antialiased selection:bg-zinc-800 selection:text-white">
      {/* Frameless Desktop Titlebar */}
      <DesktopTitleBar onOpenFolderModal={() => setIsFolderModalOpen(true)} />

      {/* Main Workspace: Sidebar + Viewport */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          {renderActiveView()}
        </main>
      </div>

      {/* Overlays and Modals */}
      {currentMedia && <PlayerView />}
      <ResumeDialog />
      <MediaInspectorModal file={inspectingFile} onClose={() => setInspectingFile(null)} />
      <MetadataEditorModal file={editingFile} onClose={() => setEditingFile(null)} />
      <LibraryScannerModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} />
    </div>
  );
}

export default App;
