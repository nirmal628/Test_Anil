import type { DiagnosisJob } from '../types';

interface Props {
  jobs: DiagnosisJob[];
  onRetry: (job: DiagnosisJob) => void;
  onDelete: (jobId: string) => void;
  onBack: () => void;
}

const fmtTime = (ts: number | null) =>
  ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

export default function OutboxScreen({ jobs, onRetry, onDelete, onBack }: Props) {
  return (
    <main className="screen">
      <h1>📤 Outbox</h1>
      <p className="subtitle">Saved diagnoses — they send automatically when you're back online.</p>

      {jobs.length === 0 && <p className="empty">No saved diagnoses. Everything has been sent. ✅</p>}

      {jobs.map((job) => (
        <div key={job.jobId} className={`outbox-card ${job.status.toLowerCase()}`}>
          <div className="thumb">🌿</div>
          <div className="outbox-info">
            <strong>{job.cropType} · {job.affectedPart}</strong>
            <span className="muted">
              {job.status === 'QUEUED' && `Waiting for internet · retry ${fmtTime(job.nextRetryAt)}`}
              {job.status === 'RETRYING' && 'Retrying now…'}
              {job.status === 'UPLOADING' && 'Uploading…'}
              {job.status === 'FAILED' && `Couldn't send — ${job.lastError ?? 'unknown error'}`}
              {job.status === 'SUCCESS' && 'Sent ✓'}
            </span>
            {job.lastError && job.status !== 'FAILED' && <span className="muted">Last error: {job.lastError}</span>}
          </div>
          <div className="outbox-actions">
            {(job.status === 'QUEUED' || job.status === 'FAILED') && (
              <button onClick={() => onRetry({ ...job, attempts: job.attempts })}>Retry</button>
            )}
            <button className="danger" onClick={() => onDelete(job.jobId)}>✕</button>
          </div>
        </div>
      ))}

      <button className="secondary" onClick={onBack}>← Back to form</button>
    </main>
  );
}
