import { describe, it, expect } from 'vitest';
import {
  parseSubtitleText,
  parseTimestampToSeconds,
  adjustSubtitleOffset,
  getActiveCueText
} from '../src/features/player/subtitles';

describe('Subtitles Engine', () => {
  it('parses timestamps into seconds accurately', () => {
    expect(parseTimestampToSeconds('00:01:23.500')).toBe(83.5);
    expect(parseTimestampToSeconds('01:10,200')).toBe(70.2);
    expect(parseTimestampToSeconds('02:00:00.000')).toBe(7200);
  });

  it('parses multi-cue SRT content', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Hola mundo desde Monochrome Media.

2
00:00:05,500 --> 00:00:09,000
Reproducción local de alta fidelidad.`;

    const cues = parseSubtitleText(srt);
    expect(cues.length).toBe(2);
    expect(cues[0].startSeconds).toBe(1);
    expect(cues[0].endSeconds).toBe(4);
    expect(cues[0].text).toBe('Hola mundo desde Monochrome Media.');
    expect(cues[1].startSeconds).toBe(5.5);
  });

  it('adjusts subtitle sync offset correctly', () => {
    const original = [
      { id: '1', startSeconds: 10, endSeconds: 15, text: 'Test' }
    ];

    const delayed = adjustSubtitleOffset(original, 2.5);
    expect(delayed[0].startSeconds).toBe(12.5);
    expect(delayed[0].endSeconds).toBe(17.5);

    const advanced = adjustSubtitleOffset(original, -3.0);
    expect(advanced[0].startSeconds).toBe(7.0);
    expect(advanced[0].endSeconds).toBe(12.0);
  });

  it('retrieves active cue text for a specific time', () => {
    const cues = [
      { id: '1', startSeconds: 10, endSeconds: 20, text: 'Primer diálogo' },
      { id: '2', startSeconds: 25, endSeconds: 30, text: 'Segundo diálogo' },
    ];

    expect(getActiveCueText(cues, 15)).toBe('Primer diálogo');
    expect(getActiveCueText(cues, 22)).toBeNull();
    expect(getActiveCueText(cues, 27)).toBe('Segundo diálogo');
  });
});
