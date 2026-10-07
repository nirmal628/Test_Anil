import type { ApiMode, DiagnosisResult } from './types';

export class NetworkError extends Error {
  constructor(message = 'No internet connection') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ServerError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ServerError';
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock diagnosis API. Simulates 2.5s upload + 1.5s analysis latency.
 * `isOnline` is read at the moment the "request would hit the wire",
 * which is what lets the demo interrupt mid-upload by toggling offline.
 */
export async function submitDiagnosis(opts: {
  mode: ApiMode;
  isOnline: () => boolean;
}): Promise<DiagnosisResult> {
  await delay(2500); // upload
  if (!opts.isOnline()) throw new NetworkError();
  if (opts.mode === 'timeout') {
    await delay(4000); // server hangs past the 60s prod timeout, shortened for demo
    throw new NetworkError('Request timed out');
  }
  if (opts.mode === 'server500') throw new ServerError(500, 'Internal Server Error');
  await delay(1500); // analyze
  return {
    disease: 'Early Blight (Alternaria solani)',
    confidence: 87,
    treatment:
      'Remove infected lower leaves. Apply copper-based fungicide every 7–10 days. ' +
      'Avoid overhead irrigation and rotate crops next season.',
  };
}
