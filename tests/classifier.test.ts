import { describe, it, expect } from 'vitest';
import { classifyMedia, cleanReleaseName } from '../core/library/classifier';

describe('Media Classifier & Filename Parser', () => {
  it('correctly classifies standard SxxExx episode', () => {
    const result = classifyMedia('D:/Series/Severance/Severance.S01E03.1080p.WEBRip.x265.mkv');
    expect(result.kind).toBe('episode');
    expect(result.seriesTitle).toBe('Severance');
    expect(result.seasonNumber).toBe(1);
    expect(result.episodeNumber).toBe(3);
    expect(result.extension).toBe('mkv');
  });

  it('correctly classifies 1x05 pattern', () => {
    const result = classifyMedia('C:/Videos/Breaking.Bad.02x04.HDTV.x264.mp4');
    expect(result.kind).toBe('episode');
    expect(result.seasonNumber).toBe(2);
    expect(result.episodeNumber).toBe(4);
    expect(result.extension).toBe('mp4');
  });

  it('correctly classifies folder structure with Season and Episode name', () => {
    const result = classifyMedia('C:/Media/The Bear/Temporada 2/Episodio 06.mkv');
    expect(result.kind).toBe('episode');
    expect(result.seasonNumber).toBe(2);
    expect(result.episodeNumber).toBe(6);
  });

  it('correctly identifies movies with release year', () => {
    const result = classifyMedia('C:/Peliculas/Inception (2010) [1080p BluRay].mp4');
    expect(result.kind).toBe('movie');
    expect(result.year).toBe(2010);
    expect(result.cleanTitle).toContain('Inception');
  });

  it('correctly classifies audio files', () => {
    const result = classifyMedia('C:/Musica/Nils Frahm - Spaces/01 An Echo.flac');
    expect(result.kind).toBe('audio');
    expect(result.extension).toBe('flac');
  });

  it('cleans scene release tags properly', () => {
    const cleaned = cleanReleaseName('Interstellar.2014.2160p.UHD.HDR.DTS-HD.MA.x265-GROUP');
    expect(cleaned).not.toContain('2160p');
    expect(cleaned).not.toContain('UHD');
    expect(cleaned).not.toContain('x265');
    expect(cleaned).toContain('Interstellar');
  });
});
