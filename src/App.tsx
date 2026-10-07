import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiMode, DiagnosisJob, DiagnosisResult } from './types';
import { MAX_ATTEMPTS, backoffMs } from './types';
import { NetworkError, ServerError, submitDiagnosis } from './mockApi';
import { dueJobs, loadOutbox, removeJob, upsertJob } from './outbox';
import DiagnoseForm from './screens/DiagnoseForm';
import OutboxScreen from './screens/OutboxScreen';
import ResultScreen from './screens/ResultScreen';

type Screen = 'form' | 'outbox' | 'result';

export default function App() {
  const [screen, setScreen] = useState<Screen>('form');
  const [jobs, setJobs] = useState<DiagnosisJob[]>(() => loadOutbox());
  const [online, setOnline] = useState(true);
  const [apiMode, setApiMode] = useState<ApiMode>('success');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const onlineRef = useRef(online);
  onlineRef.current = online;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  /** Submit a new job — idempotent by jobId, never destroys user data on failure. */
  const submit = useCallback(async (job: DiagnosisJob) => {
    setJobs((prev) => upsertJob(prev, { ...job, status: 'UPLOADING' }));
    try {
      const res = await submitDiagnosis({ mode: apiMode, isOnline: () => onlineRef.current });
      setJobs((prev) => upsertJob(prev, { ...job, status: 'SUCCESS', attempts: job.attempts }));
      setResult(res);
      setScreen('result');
    } catch (err) {
      if (err instanceof NetworkError) {
        const next = { ...job, status: 'QUEUED' as const, attempts: job.attempts, nextRetryAt: Date.now() + backoffMs(job.attempts), lastError: err.message };
        setJobs((prev) => upsertJob(prev, next));
        showToast('📴 No internet — diagnosis saved to Outbox. Will send automatically.');
        setScreen('outbox');
      } else if (err instanceof ServerError) {
        const exhausted = job.attempts >= MAX_ATTEMPTS;
        const next = { ...job, status: exhausted ? ('FAILED' as const) : ('QUEUED' as const), nextRetryAt: Date.now() + backoffMs(job.attempts + 1), attempts: job.attempts + 1, lastError: `Server error ${err.status}` };
        setJobs((prev) => upsertJob(prev, next));
        showToast(
          exhausted
            ? `Server problem (${err.status}) — max retries reached. Tap Retry in Outbox.`
            : `Server problem (${err.status}) — saved, retrying automatically.`,
        );
        setScreen('outbox');
      }
    }
  }, [apiMode]);

  /** Background worker: when back online, pick up due jobs (mirrors WorkManager). */
  useEffect(() => {
    if (!online) return;
    const tick = async () => {
      const due = dueJobs(jobsRef.current);
      for (const job of due) {
        setJobs((prev) => upsertJob(prev, { ...job, status: 'RETRYING' }));
        await submit({ ...job, status: 'RETRYING' });
      }
    };
    const t = window.setInterval(tick, 3000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;

  const queuedCount = jobs.filter((j) => j.status === 'QUEUED' || j.status === 'RETRYING').length;
  const activeJob = jobs.find((j) => j.jobId === activeJobId) ?? null;

  return (
    <div className="phone-frame">
      {/* Demo controls — not part of the farmer UI */}
      <div className="demo-bar">
        <label className="toggle">
          <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} />
          Online
        </label>
        <select value={apiMode} onChange={(e) => setApiMode(e.target.value as ApiMode)}>
          <option value="success">API: success</option>
          <option value="server500">API: 500 error</option>
          <option value="timeout">API: timeout</option>
        </select>
      </div>

      {!online && (
        <div className="offline-banner">⚠ No internet connection — {queuedCount} diagnosis{queuedCount === 1 ? '' : 'es'} waiting to send</div>
      )}
      {toast && <div className="toast">{toast}</div>}

      {screen === 'form' && (
        <DiagnoseForm
          submitting={activeJob?.status === 'UPLOADING' || activeJob?.status === 'RETRYING'}
          onSubmit={(job) => {
            setActiveJobId(job.jobId);
            void submit(job);
          }}
        />
      )}
      {screen === 'outbox' && (
        <OutboxScreen
          jobs={jobs}
          onRetry={(job) => void submit({ ...job, attempts: job.attempts })}
          onDelete={(jobId) => setJobs((prev) => removeJob(prev, jobId))}
          onBack={() => setScreen('form')}
        />
      )}
      {screen === 'result' && result && (
        <ResultScreen result={result} job={activeJob} onDone={() => {
          if (activeJobId) setJobs((prev) => removeJob(prev, activeJobId));
          setActiveJobId(null);
          setScreen('form');
        }} />
      )}

      <nav className="tab-bar">
        <button className={screen === 'form' ? 'active' : ''} onClick={() => setScreen('form')}>🌾 Diagnose</button>
        <button className={screen === 'outbox' ? 'active' : ''} onClick={() => setScreen('outbox')}>
          📤 Outbox{queuedCount > 0 && <span className="badge">{queuedCount}</span>}
        </button>
      </nav>
    </div>
  );
}
