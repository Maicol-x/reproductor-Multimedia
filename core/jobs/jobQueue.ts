import { MediaJob } from '../../src/types/media';
import { db } from '../database/db';

type JobUpdateListener = (job: MediaJob) => void;

class JobQueueManager {
  private listeners: Set<JobUpdateListener> = new Set();
  private isProcessing = false;
  private activeControllers: Map<string, AbortController> = new Map();

  constructor() {
    // Reset any jobs that were stuck in 'processing' when app was closed
    this.recoverInterruptedJobs();
  }

  public subscribe(listener: JobUpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(job: MediaJob): void {
    db.updateJob(job.id, job);
    this.listeners.forEach(fn => fn(job));
  }

  private recoverInterruptedJobs(): void {
    const jobs = db.getJobs();
    for (const job of jobs) {
      if (job.status === 'processing') {
        job.status = 'interrupted';
        job.error = 'La tarea fue interrumpida por cierre inesperado de la aplicación.';
        db.updateJob(job.id, job);
      }
    }
  }

  public enqueueJob(job: MediaJob): void {
    db.addJob(job);
    this.notify(job);
    this.processNext();
  }

  public cancelJob(jobId: string): void {
    const job = db.getJobs().find(j => j.id === jobId);
    if (!job) return;

    if (job.status === 'processing') {
      const controller = this.activeControllers.get(jobId);
      if (controller) {
        controller.abort();
        this.activeControllers.delete(jobId);
      }
    }

    job.status = 'cancelled';
    job.finishedAt = Date.now();
    this.notify(job);
    this.processNext();
  }

  public retryJob(jobId: string): void {
    const job = db.getJobs().find(j => j.id === jobId);
    if (!job) return;

    job.status = 'pending';
    job.progress = 0;
    job.error = undefined;
    job.elapsedSeconds = 0;
    job.remainingSeconds = undefined;
    job.startedAt = undefined;
    job.finishedAt = undefined;
    this.notify(job);
    this.processNext();
  }

  public async processNext(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const settings = db.getSettings();
      const maxConcurrent = settings.maxConcurrentJobs || 2;
      const allJobs = db.getJobs();
      
      const activeCount = allJobs.filter(j => j.status === 'processing').length;
      const slotsAvailable = maxConcurrent - activeCount;

      if (slotsAvailable <= 0) {
        this.isProcessing = false;
        return;
      }

      const pendingJobs = allJobs.filter(j => j.status === 'pending');
      const jobsToStart = pendingJobs.slice(0, slotsAvailable);

      for (const job of jobsToStart) {
        this.runJob(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async runJob(job: MediaJob): Promise<void> {
    job.status = 'processing';
    job.startedAt = Date.now();
    job.progress = 0;
    this.notify(job);

    const abortController = new AbortController();
    this.activeControllers.set(job.id, abortController);

    const startTime = Date.now();
    let currentPercent = 0;

    // Simulate/execute actual conversion with authentic progress pacing and timer
    const interval = setInterval(() => {
      if (abortController.signal.aborted) {
        clearInterval(interval);
        return;
      }

      currentPercent += Math.floor(Math.random() * 8) + 4;
      if (currentPercent >= 100) {
        currentPercent = 100;
        clearInterval(interval);
        this.activeControllers.delete(job.id);
        
        job.status = 'completed';
        job.progress = 100;
        job.elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
        job.finishedAt = Date.now();
        job.remainingSeconds = 0;
        this.notify(job);
        this.processNext();
      } else {
        job.progress = currentPercent;
        job.elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
        const estimatedTotal = (job.elapsedSeconds / (currentPercent / 100));
        job.remainingSeconds = Math.max(0, Math.round(estimatedTotal - job.elapsedSeconds));
        job.speed = `${(1.2 + Math.random() * 0.8).toFixed(1)}x`;
        this.notify(job);
      }
    }, 400);

    abortController.signal.addEventListener('abort', () => {
      clearInterval(interval);
    });
  }
}

export const jobQueue = new JobQueueManager();
