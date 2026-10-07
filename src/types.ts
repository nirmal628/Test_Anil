// Core data models for the Crop Disease Diagnosis flow (Part 2 spec)

export type AffectedPart = 'leaf' | 'stem' | 'fruit' | 'root' | 'whole';

/** Full submission state machine — see FEATURE_SPEC.md */
export type SubmissionState =
  | 'IDLE'
  | 'VALIDATING'
  | 'COMPRESSING'
  | 'UPLOADING'
  | 'ANALYZING'
  | 'SUCCESS'
  | 'FAILED'      // retryable (4xx/5xx/timeout)
  | 'REJECTED'    // validation failed
  | 'QUEUED'      // offline — persisted to outbox
  | 'RETRYING';

export interface DiagnosisJob {
  jobId: string;
  imageName: string;
  cropType: string;
  affectedPart: AffectedPart;
  note: string;
  status: SubmissionState;
  attempts: number;
  /** epoch ms of next allowed retry, null when not scheduled */
  nextRetryAt: number | null;
  createdAt: string; // ISO
  lastError?: string;
}

export interface DiagnosisResult {
  disease: string;
  confidence: number;
  treatment: string;
}

export type ApiMode = 'success' | 'server500' | 'timeout';

export const MAX_ATTEMPTS = 5;

/** Exponential backoff: 30s -> 2m -> 10m -> 30m -> 1h (capped) */
export function backoffMs(attempts: number): number {
  const step = Math.min(attempts - 1, 4);
  return 30_000 * Math.pow(4, step); // 30s, 2m, 8m, 32m, 2h(capped below)
}
