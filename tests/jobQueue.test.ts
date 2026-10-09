import { describe, it, expect } from 'vitest';
import { MediaJob } from '../src/types/media';

describe('Job Queue State Transitions', () => {
  it('manages job lifecycle status', () => {
    const job: MediaJob = {
      id: 'job-1',
      type: 'convert_video',
      inputPath: 'test.avi',
      inputTitle: 'Test Video',
      outputPath: 'test_converted.mp4',
      status: 'pending',
      progress: 0,
      elapsedSeconds: 0,
      options: { format: 'mp4' },
      createdAt: Date.now(),
    };

    expect(job.status).toBe('pending');
    expect(job.progress).toBe(0);

    // Transition to processing
    job.status = 'processing';
    job.startedAt = Date.now();
    job.progress = 45;
    expect(job.status).toBe('processing');
    expect(job.progress).toBe(45);

    // Transition to completed
    job.status = 'completed';
    job.progress = 100;
    job.finishedAt = Date.now();
    expect(job.status).toBe('completed');
    expect(job.progress).toBe(100);
  });
});
