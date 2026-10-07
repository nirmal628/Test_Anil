import { useState } from 'react';
import type { AffectedPart, DiagnosisJob } from '../types';

const CROPS = ['Tomato', 'Potato', 'Rice', 'Maize', 'Wheat', 'Cabbage', 'Cauliflower', 'Chili'];
const PARTS: AffectedPart[] = ['leaf', 'stem', 'fruit', 'root', 'whole'];

interface Props {
  submitting: boolean;
  onSubmit: (job: DiagnosisJob) => void;
}

export default function DiagnoseForm({ submitting, onSubmit }: Props) {
  const [imageName, setImageName] = useState('');
  const [cropType, setCropType] = useState('');
  const [affectedPart, setAffectedPart] = useState<AffectedPart | null>(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!imageName) e.image = 'Please add a photo of the affected plant part';
    if (!cropType) e.cropType = 'Please select the crop';
    if (!affectedPart) e.part = 'Please select which part is affected';
    if (note.length > 500) e.note = 'Note must be under 500 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || submitting) return;
    onSubmit({
      jobId: crypto.randomUUID(), // idempotency key — retries never double-count
      imageName,
      cropType,
      affectedPart: affectedPart!,
      note,
      status: 'VALIDATING',
      attempts: 1,
      nextRetryAt: null,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <main className="screen">
      <h1>🌾 Krishi Doctor</h1>
      <p className="subtitle">Diagnose a crop disease from a photo</p>

      <label className={`photo-picker ${errors.image ? 'invalid' : ''}`}>
        {imageName ? `📷 ${imageName}` : '📷 Tap to add a photo of the affected plant part'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => setImageName(e.target.files?.[0]?.name ?? '')}
        />
      </label>
      {errors.image && <p className="field-error">{errors.image}</p>}

      <label className="label">Crop type</label>
      <select className={errors.cropType ? 'invalid' : ''} value={cropType} onChange={(e) => setCropType(e.target.value)}>
        <option value="">Select crop…</option>
        {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      {errors.cropType && <p className="field-error">{errors.cropType}</p>}

      <label className="label">Which part is affected?</label>
      <div className="chips">
        {PARTS.map((p) => (
          <button key={p} className={`chip ${affectedPart === p ? 'selected' : ''}`} onClick={() => setAffectedPart(p)}>
            {p}
          </button>
        ))}
      </div>
      {errors.part && <p className="field-error">{errors.part}</p>}

      <label className="label">Note (optional)</label>
      <textarea rows={3} maxLength={500} placeholder="e.g. yellow spots on lower leaves" value={note} onChange={(e) => setNote(e.target.value)} />
      <p className="char-count">{note.length}/500</p>
      {errors.note && <p className="field-error">{errors.note}</p>}

      <button className="primary" disabled={submitting} onClick={handleSubmit}>
        {submitting ? '⏳ Uploading… (try toggling Offline!)' : 'Submit Diagnosis'}
      </button>
    </main>
  );
}
