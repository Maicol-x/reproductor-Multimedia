import { create } from 'zustand';
import { MediaJob, JobType, JobOptions } from '../types/media';
import { db } from '../../core/database/db';
import { jobQueue } from '../../core/jobs/jobQueue';
import { generateSafeOutputPath } from '../../core/media/ffmpeg';

interface JobsState {
  jobs: MediaJob[];
  init: () => void;
  createJob: (
    type: JobType,
    inputPath: string,
    inputTitle: string,
    options: JobOptions
  ) => MediaJob;
  cancelJob: (jobId: string) => void;
  retryJob: (jobId: string) => void;
  clearCompleted: () => void;
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],

  init: () => {
    set({ jobs: db.getJobs() });
    jobQueue.subscribe((_updatedJob) => {
      set({ jobs: db.getJobs() });
    });
  },

  createJob: (type, inputPath, inputTitle, options) => {
    const settings = db.getSettings();
    const outputPath = generateSafeOutputPath(
      inputPath,
      type,
      options.format,
      options.outputDirectory || settings.defaultExportDirectory
    );

    const newJob: MediaJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      inputPath,
      inputTitle,
      outputPath,
      status: 'pending',
      progress: 0,
      elapsedSeconds: 0,
      options,
      createdAt: Date.now(),
    };

    jobQueue.enqueueJob(newJob);
    set({ jobs: db.getJobs() });
    return newJob;
  },

  cancelJob: (jobId: string) => {
    jobQueue.cancelJob(jobId);
    set({ jobs: db.getJobs() });
  },

  retryJob: (jobId: string) => {
    jobQueue.retryJob(jobId);
    set({ jobs: db.getJobs() });
  },

  clearCompleted: () => {
    db.clearCompletedJobs();
    set({ jobs: db.getJobs() });
  },
}));
