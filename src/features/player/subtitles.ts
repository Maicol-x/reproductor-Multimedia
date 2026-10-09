export interface SubtitleCue {
  id: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

/**
 * Parses SRT (SubRip) or WebVTT subtitle string into timestamped cues.
 */
export function parseSubtitleText(content: string): SubtitleCue[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block || block === 'WEBVTT') continue;

    const lines = block.split('\n');
    let timeLineIndex = -1;

    for (let j = 0; j < lines.length; j++) {
      if (lines[j].includes('-->')) {
        timeLineIndex = j;
        break;
      }
    }

    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const [startRaw, endRaw] = timeLine.split('-->').map(s => s.trim());
    if (!startRaw || !endRaw) continue;

    const startSeconds = parseTimestampToSeconds(startRaw.split(' ')[0]);
    const endSeconds = parseTimestampToSeconds(endRaw.split(' ')[0]);

    const textLines = lines.slice(timeLineIndex + 1);
    const text = textLines.join('\n').replace(/<[^>]*>/g, '').trim();

    if (text && !isNaN(startSeconds) && !isNaN(endSeconds)) {
      cues.push({
        id: `cue-${i}`,
        startSeconds,
        endSeconds,
        text,
      });
    }
  }

  return cues;
}

/**
 * Converts timestamps like "00:01:20,500" (SRT) or "01:20.500" (VTT) to seconds.
 */
export function parseTimestampToSeconds(timestamp: string): number {
  const clean = timestamp.replace(',', '.');
  const parts = clean.split(':');

  if (parts.length === 3) {
    const h = parseFloat(parts[0]);
    const m = parseFloat(parts[1]);
    const s = parseFloat(parts[2]);
    return h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const m = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    return m * 60 + s;
  }
  return 0;
}

/**
 * Applies time offset in seconds to all subtitle cues (positive = delay, negative = advance).
 */
export function adjustSubtitleOffset(cues: SubtitleCue[], offsetSeconds: number): SubtitleCue[] {
  return cues.map(cue => ({
    ...cue,
    startSeconds: Math.max(0, cue.startSeconds + offsetSeconds),
    endSeconds: Math.max(0, cue.endSeconds + offsetSeconds),
  }));
}

/**
 * Finds the active cue text for a specific playback time in seconds.
 */
export function getActiveCueText(cues: SubtitleCue[], currentTimeSeconds: number): string | null {
  for (const cue of cues) {
    if (currentTimeSeconds >= cue.startSeconds && currentTimeSeconds <= cue.endSeconds) {
      return cue.text;
    }
  }
  return null;
}
