import type { DiagnosisJob, DiagnosisResult } from '../types';

interface Props {
  result: DiagnosisResult;
  job: DiagnosisJob | null;
  onDone: () => void;
}

export default function ResultScreen({ result, job, onDone }: Props) {
  return (
    <main className="screen">
      <h1>Diagnosis Result</h1>
      <div className="result-card success">
        <h2>{result.disease}</h2>
        <div className="confidence">Confidence: {result.confidence}%</div>
        <p>{result.treatment}</p>
        <div className="status-line">✓ Diagnosed{job ? ` — ${job.cropType}, ${job.affectedPart}` : ''}</div>
      </div>
      <button className="primary" onClick={onDone}>Diagnose another plant</button>
    </main>
  );
}
