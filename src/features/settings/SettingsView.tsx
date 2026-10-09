import React, { useState, useRef } from 'react';
import {
  Settings,
  Tv,
  Subtitles,
  Sliders,
  Database,
  Key,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  Keyboard,
  HardDrive
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useLibraryStore } from '../../stores/useLibraryStore';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, exportBackup, importBackup, clearAllDatabase } = useSettingsStore();
  const { scanAllFolders, isScanning } = useLibraryStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(settings.tmdbApiKey || '');
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ tmdbApiKey: apiKeyInput });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult('Introduce una API key para probar la conexión.');
      return;
    }
    setTestResult('Probando conexión con api.themoviedb.org...');
    try {
      const res = await fetch(`https://api.themoviedb.org/3/authentication?api_key=${encodeURIComponent(apiKeyInput)}`);
      if (res.ok) {
        setTestResult('Conexión con TMDB exitosa (200 OK). Clave válida.');
      } else {
        setTestResult(`Error de validación TMDB (HTTP ${res.status}). Clave no autorizada.`);
      }
    } catch (e: any) {
      setTestResult(`Error de red o sin conexión a internet: ${e.message}`);
    }
  };

  const handleExportBackup = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monochrome_media_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importBackup(content);
        if (ok) {
          alert('Copia de seguridad restaurada correctamente.');
          window.location.reload();
        } else {
          alert('Error al restaurar: archivo JSON corrupto o inválido.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (confirm('¿Estás seguro de que deseas restablecer la base de datos a sus valores iniciales? No se borrarán los archivos físicos de tus discos.')) {
      clearAllDatabase();
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 bg-zinc-950 text-zinc-200">
      <div className="border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-zinc-300" />
          <h2 className="text-lg font-bold text-white">Configuración del Sistema</h2>
        </div>
        <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
          Preferencias de reproducción local, metadatos externos opcionales, cola FFmpeg y respaldo de base de datos.
        </p>
      </div>

      <div className="max-w-3xl flex flex-col gap-6 text-xs">
        {/* Reproducción y Episodios */}
        <section className="bg-zinc-900/30 border border-zinc-800/80 rounded p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-zinc-800 pb-2">
            <Tv className="w-4 h-4 text-zinc-400" />
            <span>Comportamiento del Reproductor</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoPlayNextEpisode}
                onChange={(e) => updateSettings({ autoPlayNextEpisode: e.target.checked })}
                className="mt-0.5 accent-white"
              />
              <div>
                <span className="font-medium text-white block">Reproducir siguiente episodio automáticamente</span>
                <span className="text-[11px] text-zinc-500">
                  Muestra la cuenta regresiva al superar el 95% del episodio actual.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.resumePlayback}
                onChange={(e) => updateSettings({ resumePlayback: e.target.checked })}
                className="mt-0.5 accent-white"
              />
              <div>
                <span className="font-medium text-white block">Recordar posición de reanudación</span>
                <span className="text-[11px] text-zinc-500">
                  Preguntar si continuar desde el punto guardado al reabrir un vídeo.
                </span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">
                Cuenta regresiva de siguiente episodio (segundos)
              </label>
              <input
                type="number"
                min={3}
                max={30}
                value={settings.nextEpisodeCountdownSeconds}
                onChange={(e) => updateSettings({ nextEpisodeCountdownSeconds: parseInt(e.target.value, 10) || 8 })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">
                Umbral para marcar como visto (%)
              </label>
              <input
                type="number"
                min={70}
                max={99}
                value={settings.markWatchedThresholdPercent}
                onChange={(e) => updateSettings({ markWatchedThresholdPercent: parseInt(e.target.value, 10) || 90 })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white font-mono"
              />
            </div>
          </div>
        </section>

        {/* Subtítulos y Audio */}
        <section className="bg-zinc-900/30 border border-zinc-800/80 rounded p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-zinc-800 pb-2">
            <Subtitles className="w-4 h-4 text-zinc-400" />
            <span>Subtítulos y Accesibilidad</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Tamaño predeterminado de subtítulos</label>
              <select
                value={settings.subtitleSize}
                onChange={(e) => updateSettings({ subtitleSize: e.target.value as any })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value="small">Pequeño (14px)</option>
                <option value="medium">Mediano (18px - Recomendado)</option>
                <option value="large">Grande (24px)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Idioma preferido de audio</label>
              <select
                value={settings.defaultAudioLanguage}
                onChange={(e) => updateSettings({ defaultAudioLanguage: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value="es">Español / Castellano</option>
                <option value="en">Inglés (Original)</option>
                <option value="lat">Español Latinoamericano</option>
              </select>
            </div>
          </div>
        </section>

        {/* Proveedor de Metadatos (TMDB) */}
        <section className="bg-zinc-900/30 border border-zinc-800/80 rounded p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-zinc-800 pb-2">
            <Key className="w-4 h-4 text-zinc-400" />
            <span>Proveedor Opcional de Metadatos (The Movie Database - TMDB)</span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            La aplicación funciona 100% sin conexión con portadas monocromáticas locales. Si deseas enriquecer sinopsis y portadas automáticamente, introduce una API Key gratuita de TMDB v3.
          </p>

          <form onSubmit={handleSaveGeneral} className="flex flex-col gap-2">
            <label className="text-[11px] text-zinc-400">TMDB API Key (v3 auth)</label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Ej: 3a2b1c4d5e6f7g8h9i0..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-400"
              />
              <button
                type="button"
                onClick={handleTestApiKey}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 whitespace-nowrap"
              >
                Probar conexión
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 font-medium rounded whitespace-nowrap"
              >
                Guardar
              </button>
            </div>

            {testResult && (
              <div className="text-[11px] font-mono text-zinc-400 mt-1 bg-zinc-950 p-2 rounded border border-zinc-800">
                {testResult}
              </div>
            )}
            {saveSuccess && (
              <div className="text-[11px] text-zinc-300 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Configuración guardada correctamente en SQLite local.</span>
              </div>
            )}
          </form>
        </section>

        {/* FFmpeg y Procesamiento */}
        <section className="bg-zinc-900/30 border border-zinc-800/80 rounded p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-zinc-800 pb-2">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <span>Motor FFmpeg y Concurrencia</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Tareas simultáneas máximas en cola</label>
              <select
                value={settings.maxConcurrentJobs}
                onChange={(e) => updateSettings({ maxConcurrentJobs: parseInt(e.target.value, 10) || 2 })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white font-mono"
              >
                <option value={1}>1 tarea (Bajo consumo de CPU)</option>
                <option value={2}>2 tareas (Equilibrado)</option>
                <option value={4}>4 tareas (Alto rendimiento)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Carpeta predeterminada de exportación</label>
              <input
                type="text"
                value={settings.defaultExportDirectory}
                onChange={(e) => updateSettings({ defaultExportDirectory: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white font-mono truncate"
              />
            </div>
          </div>
        </section>

        {/* Atajos de Teclado */}
        <section className="bg-zinc-900/30 border border-zinc-800/80 rounded p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-zinc-800 pb-2">
            <Keyboard className="w-4 h-4 text-zinc-400" />
            <span>Atajos de Teclado del Reproductor</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="flex justify-between bg-zinc-950 p-2 rounded border border-zinc-800/60">
              <span className="text-zinc-400">Espacio</span>
              <span className="text-white font-medium">Reproducir / Pausa</span>
            </div>
            <div className="flex justify-between bg-zinc-950 p-2 rounded border border-zinc-800/60">
              <span className="text-zinc-400">← / →</span>
              <span className="text-white font-medium">Saltar ±10 seg</span>
            </div>
            <div className="flex justify-between bg-zinc-950 p-2 rounded border border-zinc-800/60">
              <span className="text-zinc-400">↑ / ↓</span>
              <span className="text-white font-medium">Volumen ±5%</span>
            </div>
            <div className="flex justify-between bg-zinc-950 p-2 rounded border border-zinc-800/60">
              <span className="text-zinc-400">M</span>
              <span className="text-white font-medium">Silenciar audio</span>
            </div>
            <div className="flex justify-between bg-zinc-950 p-2 rounded border border-zinc-800/60">
              <span className="text-zinc-400">F</span>
              <span className="text-white font-medium">Pantalla completa</span>
            </div>
            <div className="flex justify-between bg-zinc-950 p-2 rounded border border-zinc-800/60">
              <span className="text-zinc-400">Esc</span>
              <span className="text-white font-medium">Salir / Cerrar</span>
            </div>
          </div>
        </section>

        {/* Respaldo y Base de Datos */}
        <section className="bg-zinc-900/30 border border-zinc-800/80 rounded p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-zinc-800 pb-2">
            <Database className="w-4 h-4 text-zinc-400" />
            <span>Persistencia SQLite y Copias de Seguridad</span>
          </div>

          <p className="text-[11px] text-zinc-400">
            Exporta tus metadatos personalizados, historial y listas a un archivo JSON seguro o restaura una copia previa.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json"
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportBackup}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded flex items-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Copia de Seguridad (.json)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded flex items-center gap-2 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restaurar Copia de Seguridad</span>
            </button>

            <button
              onClick={handleClearData}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-red-950/40 text-red-400 border border-zinc-800 hover:border-red-900/60 rounded flex items-center gap-2 transition-colors ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Restablecer Datos Locales</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
