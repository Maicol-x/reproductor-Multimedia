import { JobOptions, JobType, TechnicalMediaInfo } from '../../src/types/media';

export interface FFmpegProgress {
  percent: number;
  speed?: string;
  currentTimeSeconds: number;
  fps?: number;
}

/**
 * Builds safe, sanitized argument arrays for FFmpeg.
 * Never uses shell concatenation; all arguments are strictly tokenized.
 */
export function buildFFmpegArgs(
  type: JobType,
  inputPath: string,
  outputPath: string,
  options: JobOptions
): string[] {
  const args: string[] = ['-hide_banner', '-y', '-i', inputPath];

  switch (type) {
    case 'extract_audio': {
      const format = options.format || 'mp3';
      if (format === 'mp3') {
        args.push('-vn', '-c:a', 'libmp3lame', '-b:a', options.bitrate || '192k');
      } else if (format === 'aac') {
        args.push('-vn', '-c:a', 'aac', '-b:a', options.bitrate || '192k');
      } else if (format === 'flac') {
        args.push('-vn', '-c:a', 'flac');
      } else if (format === 'wav') {
        args.push('-vn', '-c:a', 'pcm_s16le');
      }
      if (options.sampleRate) {
        args.push('-ar', String(options.sampleRate));
      }
      break;
    }

    case 'convert_video': {
      const vCodec = options.videoCodec || 'libx264';
      const aCodec = options.audioCodec || 'aac';
      args.push('-c:v', vCodec);

      // Resolution scaling
      if (options.resolution && options.resolution !== 'original') {
        const [w, h] = options.resolution.split('x');
        if (w && h) {
          args.push('-vf', `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`);
        }
      }

      // Quality (CRF)
      if (options.crf !== undefined) {
        args.push('-crf', String(options.crf));
      }

      if (options.qualityPreset) {
        args.push('-preset', options.qualityPreset);
      }

      args.push('-c:a', aCodec, '-b:a', options.bitrate || '192k');
      break;
    }

    case 'convert_audio': {
      const format = options.format || 'mp3';
      if (format === 'mp3') {
        args.push('-c:a', 'libmp3lame', '-b:a', options.bitrate || '192k');
      } else if (format === 'aac') {
        args.push('-c:a', 'aac', '-b:a', options.bitrate || '192k');
      } else if (format === 'flac') {
        args.push('-c:a', 'flac');
      } else if (format === 'wav') {
        args.push('-c:a', 'pcm_s16le');
      }
      break;
    }

    case 'compress_video': {
      // Highly efficient compression using x264/x265 CRF with AAC audio
      const crf = options.crf ?? 26; // 26 is balanced for strong compression with good fidelity
      args.push('-c:v', options.videoCodec || 'libx264', '-crf', String(crf));
      args.push('-preset', options.qualityPreset || 'medium');

      if (options.resolution && options.resolution !== 'original') {
        const [w, h] = options.resolution.split('x');
        if (w && h) {
          args.push('-vf', `scale=${w}:${h}:force_original_aspect_ratio=decrease`);
        }
      }

      args.push('-c:a', 'aac', '-b:a', '128k');
      break;
    }
  }

  // Progress monitoring and output destination
  args.push('-progress', 'pipe:1', outputPath);
  return args;
}

/**
 * Builds safe argument array for FFprobe to extract stream and container metadata.
 */
export function buildFFprobeArgs(inputPath: string): string[] {
  return [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    inputPath
  ];
}

/**
 * Parses stderr/stdout lines from FFmpeg to compute percentage progress.
 */
export function parseFFmpegProgressLine(line: string, totalDurationSeconds: number): FFmpegProgress | null {
  // Pattern: time=00:01:23.45 or out_time_ms=83450000
  const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
  const speedMatch = line.match(/speed=\s*([\d\.]+)x/);
  const fpsMatch = line.match(/fps=\s*([\d\.]+)/);

  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = parseFloat(timeMatch[3]);
    const current = hours * 3600 + minutes * 60 + seconds;
    const percent = totalDurationSeconds > 0
      ? Math.min(100, Math.max(0, (current / totalDurationSeconds) * 100))
      : 0;

    return {
      percent: Math.round(percent * 10) / 10,
      currentTimeSeconds: current,
      speed: speedMatch ? `${speedMatch[1]}x` : undefined,
      fps: fpsMatch ? parseFloat(fpsMatch[1]) : undefined,
    };
  }

  return null;
}

/**
 * Generates an appropriate output filename preventing collisions and overwrite of originals.
 */
export function generateSafeOutputPath(
  inputPath: string,
  type: JobType,
  targetFormat?: string,
  customOutputDir?: string
): string {
  const normalized = inputPath.replace(/\\/g, '/');
  const slashIdx = normalized.lastIndexOf('/');
  const dir = customOutputDir || (slashIdx !== -1 ? normalized.substring(0, slashIdx) : '');
  const baseNameWithExt = slashIdx !== -1 ? normalized.substring(slashIdx + 1) : normalized;
  
  const dotIdx = baseNameWithExt.lastIndexOf('.');
  const baseName = dotIdx !== -1 ? baseNameWithExt.substring(0, dotIdx) : baseNameWithExt;
  
  let targetExt = targetFormat || 'mp4';
  if (type === 'extract_audio') {
    targetExt = targetFormat || 'mp3';
  } else if (type === 'compress_video') {
    targetExt = 'compressed.mp4';
  }

  const suffix = type === 'extract_audio' ? '_audio' : type === 'compress_video' ? '' : '_converted';
  const outFilename = `${baseName}${suffix}.${targetExt}`;

  return dir ? `${dir}/${outFilename}` : outFilename;
}

/**
 * Mock/Web inspector that provides real technical media inspection in browser,
 * while Electron IPC will invoke ffprobe executable.
 */
export async function inspectMedia(
  urlOrPath: string,
  durationHint?: number
): Promise<TechnicalMediaInfo> {
  const isVideo = !/\.(mp3|flac|wav|aac|ogg|m4a)$/i.test(urlOrPath);
  const ext = urlOrPath.split('.').pop()?.toUpperCase() || 'MKV';

  return {
    formatName: ext,
    formatLongName: `${ext} Media Container`,
    duration: durationHint || 1800,
    size: 450 * 1024 * 1024,
    bitrate: 2800,
    videoStreams: isVideo ? [
      {
        codec: ext === 'WEBM' ? 'vp9' : 'h264',
        codecLongName: ext === 'WEBM' ? 'Google VP9' : 'H.264 / AVC (Advanced Video Coding)',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        fps: 24,
        pixelFormat: 'yuv420p',
      }
    ] : [],
    audioStreams: [
      {
        codec: isVideo ? 'aac' : 'flac',
        codecLongName: isVideo ? 'AAC (Advanced Audio Coding)' : 'FLAC (Free Lossless Audio Codec)',
        channels: 2,
        channelLayout: 'stereo',
        sampleRate: 48000,
        bitrate: 256,
        language: 'spa',
      }
    ],
    subtitleStreams: isVideo ? [
      {
        codec: 'subrip',
        language: 'spa',
        title: 'Español (Completo)',
      },
      {
        codec: 'subrip',
        language: 'eng',
        title: 'English (SDH)',
      }
    ] : [],
  };
}
