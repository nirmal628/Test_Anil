import type { DiagnosisJob } from '../types';

interface Props {
  jobs: DiagnosisJob[];
  onRetry: (job: DiagnosisJob) => void;
  onDelete: (jobId: string) => void;
  onBack: () => void;
}

const fmtTime = (ts: number | null) =>
  ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const statusConfig: Record<string, { label: string; icon: string; cls: string }> = {
  QUEUED:    { label: 'Waiting for internet', icon: '📴', cls: 'queued' },
  RETRYING:  { label: 'Retrying now…',        icon: '🔄', cls: 'retrying' },
  UPLOADING: { label: 'Uploading…',           icon: '⬆️', cls: 'uploading' },
  FAILED:    { label: "Couldn't send",        icon: '❌', cls: 'failed' },
  SUCCESS:   { label: 'Sent ✓',              icon: '✅', cls: 'success' },
};

export default function OutboxScreen({ jobs, onRetry, onDelete, onBack }: Props) {
  const pendingCount = jobs.filter(j => j.status === 'QUEUED' || j.status === 'RETRYING').length;

  return (
    <main className="screen">
      <h1>📤 Outbox</h1>
      <p className="subtitle">
        {pendingCount > 0
          ? `${pendingCount} diagnosis${pendingCount > 1 ? 'es' : ''} waiting to send — they'll go automatically when you're back online.`
          : 'All diagnoses are sent. Nothing pending.'}
      </p>

      {jobs.length === 0 && (
        <div className="empty">
          <span className="empty-icon">🎉</span>
          No saved diagnoses.<br />Everything has been sent successfully!
        </div>
      )}

      {jobs.map((job) => {
        const cfg = statusConfig[job.status] ?? statusConfig['QUEUED'];
        return (
          <div key={job.jobId} className={`outbox-card ${cfg.cls}`}>
            <div className="thumb">🌿</div>
            <div className="outbox-info">
              <strong>{job.cropType} · {job.affectedPart}</strong>
              <span className={`status-badge ${cfg.cls}`}>
                {cfg.icon} {cfg.label}
              </span>
              {job.status === 'QUEUED' && job.nextRetryAt && (
                <span className="muted">Next retry at {fmtTime(job.nextRetryAt)}</span>
              )}
              {job.lastError && job.status === 'FAILED' && (
                <span className="muted" style={{ color: 'var(--red-600)' }}>{job.lastError}</span>
              )}
              <span className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                Attempt {job.attempts} · {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="outbox-actions">
              {(job.status === 'QUEUED' || job.status === 'FAILED') && (
                <button onClick={() => onRetry({ ...job, attempts: job.attempts })}>Retry</button>
              )}
              <button className="danger" onClick={() => onDelete(job.jobId)} title="Remove">✕</button>
            </div>
          </div>
        );
      })}

      <button className="secondary" onClick={onBack}>← Back to Diagnose</button>
    </main>
  );
}
