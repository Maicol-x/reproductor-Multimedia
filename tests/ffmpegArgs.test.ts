import { describe, it, expect } from 'vitest';
import {
  buildFFmpegArgs,
  buildFFprobeArgs,
  parseFFmpegProgressLine,
  generateSafeOutputPath
} from '../core/media/ffmpeg';

describe('FFmpeg Arguments & Progress Parser', () => {
  it('constructs safe audio extraction arguments without string concatenation', () => {
    const args = buildFFmpegArgs(
      'extract_audio',
      'C:/Videos/video.mkv',
      'C:/Videos/output.mp3',
      { format: 'mp3', bitrate: '320k', sampleRate: 48000 }
    );

    expect(args).toContain('-i');
    expect(args).toContain('C:/Videos/video.mkv');
    expect(args).toContain('-vn');
    expect(args).toContain('-c:a');
    expect(args).toContain('libmp3lame');
    expect(args).toContain('-b:a');
    expect(args).toContain('320k');
    expect(args).toContain('-ar');
    expect(args).toContain('48000');
    expect(args[args.length - 1]).toBe('C:/Videos/output.mp3');
  });

  it('constructs video conversion arguments with resolution scaling and CRF', () => {
    const args = buildFFmpegArgs(
      'convert_video',
      'D:/input.avi',
      'D:/output.mp4',
      {
        videoCodec: 'libx264',
        audioCodec: 'aac',
        resolution: '1280x720',
        crf: 22,
        qualityPreset: 'medium',
      }
    );

    expect(args).toContain('-c:v');
    expect(args).toContain('libx264');
    expect(args).toContain('-crf');
    expect(args).toContain('22');
    expect(args).toContain('-preset');
    expect(args).toContain('medium');
    expect(args).toContain('-c:a');
    expect(args).toContain('aac');
  });

  it('parses stderr progress line correctly', () => {
    const progress = parseFFmpegProgressLine('frame= 1200 fps= 48 q=22.0 size= 14500kB time=00:01:30.00 bitrate=1310.2kbits/s speed=2.0x', 180);
    expect(progress).not.toBeNull();
    expect(progress?.percent).toBe(50);
    expect(progress?.speed).toBe('2.0x');
    expect(progress?.fps).toBe(48);
  });

  it('generates safe output paths without overwriting input', () => {
    const out = generateSafeOutputPath('C:/Videos/Pelicula.mkv', 'extract_audio', 'mp3');
    expect(out).toBe('C:/Videos/Pelicula_audio.mp3');

    const compressed = generateSafeOutputPath('D:/Films/Clip.mp4', 'compress_video');
    expect(compressed).toBe('D:/Films/Clip.compressed.mp4');
  });
});
