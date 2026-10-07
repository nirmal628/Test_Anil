import { useEffect, useState } from 'react';
import type { DiagnosisJob, DiagnosisResult } from '../types';

interface Props {
  result: DiagnosisResult;
  job: DiagnosisJob | null;
  onDone: () => void;
}

export default function ResultScreen({ result, job, onDone }: Props) {
  const [barWidth, setBarWidth] = useState(0);

  // Animate confidence bar on mount
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(result.confidence), 200);
    return () => clearTimeout(t);
  }, [result.confidence]);

  const severityLabel =
    result.confidence >= 85 ? '🔴 High confidence' :
    result.confidence >= 65 ? '🟡 Moderate confidence' :
    '🟢 Low confidence — manual check recommended';

  return (
    <main className="screen">
      <h1>Diagnosis Result</h1>
      <p className="subtitle">AI-powered analysis of your crop photo</p>

      <div className="result-card">
        <div className="result-icon">🔬</div>
        <h2>{result.disease}</h2>

        <div className="confidence">{result.confidence}% match</div>
        <div className="confidence-bar-wrap">
          <div className="confidence-bar" style={{ width: `${barWidth}%` }} />
        </div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>{severityLabel}</p>

        <div className="divider" />

        <p className="treatment-label">Recommended Treatment</p>
        <p className="treatment-text">{result.treatment}</p>

        <div className="status-line">
          ✓ Diagnosed
          {job ? ` — ${job.cropType}, ${job.affectedPart}` : ''}
        </div>
      </div>

      <button className="primary" style={{ marginTop: 16 }} onClick={onDone}>
        🌾 Diagnose another plant
      </button>
    </main>
  );
}
