# Monochrome Media — Reproductor Multimedia para Windows

**Monochrome Media** es una aplicación de escritorio completa diseñada para Windows que combina reproducción multimedia de alta fidelidad, organización automática de películas y series de televisión, persistencia local con SQLite y herramientas reales de procesamiento de vídeo y audio basadas en **FFmpeg**.

Diseñado bajo una rigurosa estética monocromática (negro profundo, tonos carbón y acentos blancos), sin elementos superfluos ni colores llamativos. 100% privado, sin suscripciones, sin telemetría y completamente funcional sin conexión a Internet.

---

## 1. Características Principales

### Reproducción Multimedia Real
- **Controles completos**: Reproducir, pausar, avance y retroceso rápido (±10s), paso de fotograma, barra de navegación temporal con vista previa y volumen con silenciamiento instantáneo.
- **Modos de visualización**: Modo ventana sin marcos, pantalla completa nativa y modo mini reproductor flotante (*Picture-in-Picture*).
- **Control de velocidad**: Ajuste entre 0.5x, 0.75x, 1.0x, 1.25x, 1.5x y 2.0x.
- **Relaciones de aspecto**: Automático, 16:9, 4:3, 21:9 y ajuste al marco de pantalla.
- **Audio y subtítulos**:
  - Detección y selección de pistas de audio (doblaje, audio original).
  - Carga de subtítulos externos en formatos `.srt` y `.vtt`.
  - Ajuste de sincronización temporal de subtítulos (*offset* de ±0.5s en tiempo real).
  - Configuración de tamaño de subtítulos (Pequeño, Mediano, Grande).
- **Continuar viendo (*Resume Playback*)**: Guarda automáticamente la posición exacta de cada archivo. Al reabrir un vídeo, ofrece continuar desde el punto guardado o reiniciar desde el principio.
- **Reproducción continua de series**: Al terminar un episodio (>95%), detecta el siguiente episodio disponible de la misma temporada y ofrece una cuenta regresiva configurable con opción de reproducir de inmediato.
- **Inspección técnica (FFprobe)**: Ventana modal con análisis exhaustivo del contenedor, códecs de vídeo/audio, tasas de bits (kbps), canales, frecuencia de muestreo y pistas de subtítulos integradas.

### Organización Inteligente de la Biblioteca
- **Clasificación automática**: Motor de análisis léxico y expresiones regulares capaz de reconocer convenciones estándar:
  - Formatos de episodio: `S01E03`, `s01e03`, `1x03`, `Temporada 02 / Episodio 05`, `Serie - 103`.
  - Películas con año: `Inception (2010)`, `The.Matrix.1999.1080p`.
  - Archivos de audio: `.flac`, `.mp3`, `.wav`, `.aac`, `.m4a`.
  - Limpieza de etiquetas de la *scene* (1080p, 2160p, BluRay, WEBRip, x264, x265, HEVC, DTS, etc.).
- **Escaneo incremental**: Detecta archivos nuevos, modificados o eliminados sin necesidad de recalcular toda la biblioteca en cada apertura.
- **Ubicaciones supervisadas**: Posibilidad de añadir o remover múltiples carpetas del sistema (ej. `D:\Peliculas`, `E:\Series`, `C:\Users\Default\Music`).
- **Gestión y edición manual**: Formulario integrado para corregir título, año, serie, temporada, número de episodio y sinopsis. Todas las correcciones manuales quedan protegidas contra sobreescrituras automáticas en futuros escaneos (`userModified: true`).

### Identificación de Metadatos (TMDB Opcional)
- **Modo sin conexión predeterminado**: Generación instantánea de portadas monocromáticas vectoriales (SVG estilizado de alta resolución con monogramas y tipografía editorial) para cada archivo.
- **Integración opcional con The Movie Database (TMDB)**: Si el usuario configura una API Key gratuita en Ajustes, permite buscar películas y series, descargar sinopsis oficiales y aplicar portadas en alta resolución con un solo clic.

### Herramientas Multimedia Integradas (FFmpeg)
- **Extracción de audio**: Extrae el audio de vídeos a formatos MP3, AAC, FLAC o WAV, con bitrates configurables (128 kbps a 320 kbps) y frecuencias de muestreo (44.1 kHz, 48 kHz, 96 kHz).
- **Conversión de vídeo**: Convierte entre contenedores MP4 y MKV utilizando códecs H.264 (`libx264`), H.265 (`libx265`) o VP9 (`libvpx-vp9`), con reescalado opcional (1080p, 720p, 480p) y factor de calidad CRF.
- **Conversión de audio**: Transcodificación entre formatos de audio compatibles.
- **Compresión inteligente**: Reduce entre un 40% y 70% el peso de vídeos mediante codificación adaptativa CRF.
- **Cola de procesamiento no bloqueante**:
  - Control de concurrencia configurable (1 a 4 tareas simultáneas).
  - Cálculo de porcentaje real, velocidad de procesamiento (ej: `1.8x`) y tiempo estimado restante.
  - Cancelación cooperativa de trabajos en ejecución.
  - Recuperación de tareas interrumpidas tras reiniciar la aplicación.
  - Generación de nombres seguros que impiden la sobreescritura accidental de los archivos originales.

### Persistencia y Base de Datos (SQLite)
- **Arquitectura SQLite**: Esquema normalizado con claves foráneas, índices de alto rendimiento y migraciones versionadas.
- **Tablas gestionadas**: `watch_locations`, `media_files`, `movies`, `series`, `seasons`, `episodes`, `playback_history`, `playlists`, `playlist_items`, `media_jobs`, `settings` y `exclusions`.
- **Copia de seguridad y restauración**: Exportación e importación completa de la base de datos y configuraciones en formato JSON.

---

## 2. Arquitectura del Sistema

```
monochrome-media/
├── electron/
│   ├── main/          # Ciclo de vida de Electron, ventanas frameless y procesos FFmpeg
│   ├── preload/       # ContextBridge con API segura y validada
│   └── ipc/           # Canales y contratos tipados entre main y renderer
├── core/
│   ├── database/      # Esquema SQLite, migraciones versionadas y gestor de persistencia
│   ├── library/       # Clasificador de nombres de episodios/películas y escáner incremental
│   ├── media/         # Generador de argumentos seguros para FFmpeg y analizador FFprobe
│   ├── metadata/      # Cliente TMDB y generador de carátulas monocromáticas vectoriales
│   └── jobs/          # Cola de trabajos persistente, máquina de estados y cancelaciones
├── src/
│   ├── components/    # Barra de título Windows, barra lateral, tarjetas de medios, inspectores
│   ├── features/      # Módulos: home, movies, series, audio, playlists, converter, history, settings
│   ├── stores/        # Almacenes de estado reactivo con Zustand
│   └── types/         # Definiciones TypeScript de entidades multimedia
├── tests/             # Batería de pruebas automatizadas con Vitest
└── electron-builder.json # Configuración de empaquetado para Windows (NSIS e instalador portable)
```

---

## 3. Requisitos del Sistema (Windows)

- **Sistema Operativo**: Windows 10 o Windows 11 (64-bit).
- **Entorno de desarrollo**: Node.js v18 o superior, npm v9 o superior.
- **Binarios multimedia**: `ffmpeg.exe` y `ffprobe.exe` en la ruta de ejecución o en el `PATH` de Windows.

---

## 4. Instalación y Puesta en Marcha

### Instalación de dependencias
```bash
npm install
```

### Ejecutar en modo desarrollo
Inicia el entorno de desarrollo con recarga inmediata en el puerto local 3000:
```bash
npm run dev
```

### Ejecutar las pruebas automatizadas
Ejecuta la suite completa de pruebas unitarias e integración con Vitest:
```bash
npm test
```

### Comprobación de tipos y sintaxis TypeScript
```bash
npm run lint
```

### Compilar la aplicación web y preparar los artefactos
```bash
npm run build
```

---

## 5. Empaquetado para Windows

La aplicación está configurada mediante `electron-builder` para generar dos tipos de binarios de escritorio:

1. **Instalador NSIS (`.exe`)**: Instalador guiado de Windows con selección de directorio, accesos directos en el menú Inicio y Escritorio, y desinstalador limpio.
2. **Versión Portable (`.exe`)**: Ejecutable único autónomo que no requiere instalación en el sistema.

Para generar los instaladores en un entorno Windows:
```bash
npm run electron:build
```
Los archivos compilados se generarán en la carpeta `dist-electron/`.

---

## 6. Atajos de Teclado del Reproductor

| Tecla | Acción |
| :--- | :--- |
| **Espacio** | Reproducir / Pausar |
| **Flecha Izquierda (←)** | Retroceder 10 segundos |
| **Flecha Derecha (→)** | Avanzar 10 segundos |
| **Flecha Arriba (↑)** | Aumentar volumen (+5%) |
| **Flecha Abajo (↓)** | Disminuir volumen (-5%) |
| **M** | Silenciar / Activar sonido |
| **F** | Activar / Desactivar pantalla completa |
| **Esc** | Salir de pantalla completa / Cerrar reproductor |

---

## 7. Licencias y Dependencias

- **React & Vite**: Licencia MIT.
- **Tailwind CSS**: Licencia MIT.
- **Zustand & Zod**: Licencia MIT.
- **Lucide Icons**: Licencia ISC.
- **FFmpeg**: Licencia LGPL 2.1+ / GPL (respetando la distribución separada de binarios mediante llamada por procesos).
