import type { DiagnosisJob } from './types';

const KEY = 'krishi-doctor-outbox-v1';

export function loadOutbox(): DiagnosisJob[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as DiagnosisJob[];
  } catch {
    return [];
  }
}

export function saveOutbox(jobs: DiagnosisJob[]): void {
  localStorage.setItem(KEY, JSON.stringify(jobs));
}

export function upsertJob(jobs: DiagnosisJob[], job: DiagnosisJob): DiagnosisJob[] {
  const i = jobs.findIndex((j) => j.jobId === job.jobId);
  const next = i >= 0 ? jobs.map((j) => (j.jobId === job.jobId ? job : j)) : [...jobs, job];
  saveOutbox(next);
  return next;
}

export function removeJob(jobs: DiagnosisJob[], jobId: string): DiagnosisJob[] {
  const next = jobs.filter((j) => j.jobId !== jobId);
  saveOutbox(next);
  return next;
}

/** Jobs due for auto-retry right now (QUEUED and nextRetryAt reached). */
export function dueJobs(jobs: DiagnosisJob[], now = Date.now()): DiagnosisJob[] {
  return jobs.filter((j) => j.status === 'QUEUED' && j.nextRetryAt !== null && j.nextRetryAt <= now);
}
