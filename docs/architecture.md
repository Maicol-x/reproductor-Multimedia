# Documentación Técnica y Arquitectura — Monochrome Media

## 1. Esquema Relacional de Base de Datos (SQLite)

El sistema utiliza un esquema normalizado estructurado en SQLite con soporte para claves foráneas y cascada de eliminación (`ON DELETE CASCADE`):

### `watch_locations`
- `id` (TEXT, PK): Identificador único de la ubicación.
- `path` (TEXT, UNIQUE): Ruta absoluta local de la carpeta supervisada.
- `name` (TEXT): Nombre descriptivo de la carpeta.
- `is_enabled` (INTEGER): Estado activo/inactivo (1/0).
- `last_scanned_at` (INTEGER): Marca temporal del último escaneo completado.
- `item_count` (INTEGER): Número de archivos detectados.

### `media_files`
- `id` (TEXT, PK): Hash o ID basado en la ruta absoluta.
- `path` (TEXT, UNIQUE): Ruta absoluta normalizada del archivo.
- `filename` (TEXT): Nombre base del archivo con extensión.
- `size` (INTEGER): Tamaño del archivo en bytes.
- `extension` (TEXT): Extensión en minúsculas (ej: `mkv`, `mp4`, `flac`).
- `duration` (REAL): Duración en segundos obtenida vía inspección.
- `width`, `height` (INTEGER): Dimensiones de fotograma en píxeles.
- `video_codec`, `audio_codec` (TEXT): Códecs decodificados.
- `playback_position` (REAL): Posición en segundos donde se pausó el archivo.
- `is_watched` (INTEGER): Booleano que indica si se superó el umbral de marcado (90%).
- `kind` (TEXT): Clasificación (`movie`, `series`, `episode`, `video`, `audio`, `unknown`).
- `title` (TEXT): Título limpio obtenido por el analizador léxico.
- `user_modified` (INTEGER): Bandera booleana (1/0). Cuando es 1, futuros escaneos incrementales tienen estrictamente prohibido sobrescribir las correcciones hechas por el usuario.

### `playback_history`
- Registro cronológico de sesiones de visualización con marca temporal (`played_at`), progreso alcanzado y duración total.

### `playlists` y `playlist_items`
- Listas personalizadas y listas inteligentes dinámicas (`Favoritos`, `Vistos recientemente`, `En progreso`, `Por ver`) con ordenación reconfigurable (`sort_order`).

### `media_jobs`
- Cola persistente para tareas de extracción, conversión y compresión FFmpeg con opciones serializadas en JSON, estados explícitos (`pending`, `processing`, `completed`, `failed`, `cancelled`, `interrupted`) y progreso acumulado.

---

## 2. Seguridad IPC en Electron

Siguiendo las mejores prácticas de seguridad de Electron:
1. `contextIsolation: true`: Aislamiento estricto del contexto del renderizador frente a Node.js.
2. `nodeIntegration: false`: Impide la invocación directa de primitivas de Node en los componentes React.
3. `sandbox: true`: Ejecución en espacio aislado en navegadores Chromium.
4. **Validación de llamadas**: No se expone `ipcRenderer` crudo al objeto `window`. Únicamente se expone `window.electronAPI` con métodos fuertemente tipados que invocan canales verificados (`dialog:open-directory`, `ffmpeg:execute-job`, etc.).

---

## 3. Integración Segura de FFmpeg

Los comandos hacia los binarios `ffmpeg` y `ffprobe` se construyen como listas de argumentos separadas (`string[]`) mediante la función `buildFFmpegArgs()`, evitando la concatenación directa de cadenas y neutralizando cualquier riesgo de inyección de comandos en el intérprete de comandos del sistema operativo (shell).
