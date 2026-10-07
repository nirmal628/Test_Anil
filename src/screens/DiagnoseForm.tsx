import { useState } from 'react';
import type { AffectedPart, DiagnosisJob } from '../types';

const CROPS = ['Tomato', 'Potato', 'Rice', 'Maize', 'Wheat', 'Cabbage', 'Cauliflower', 'Chili'];
const PARTS: { value: AffectedPart; label: string; icon: string }[] = [
  { value: 'leaf',  label: 'Leaf',       icon: '🍃' },
  { value: 'stem',  label: 'Stem',       icon: '🌿' },
  { value: 'fruit', label: 'Fruit',      icon: '🍅' },
  { value: 'root',  label: 'Root',       icon: '🌱' },
  { value: 'whole', label: 'Whole Plant',icon: '🌾' },
];

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
    if (!imageName)     e.image    = 'Please add a photo of the affected plant part';
    if (!cropType)      e.cropType = 'Please select the crop';
    if (!affectedPart)  e.part     = 'Please select which part is affected';
    if (note.length > 500) e.note  = 'Note must be under 500 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || submitting) return;
    onSubmit({
      jobId: crypto.randomUUID(),
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
      <p className="subtitle">Upload a photo to diagnose a crop disease instantly using AI</p>

      {/* Photo picker */}
      <div className="section-card">
        <p className="section-title">📷 Plant Photo</p>
        <label className={`photo-picker ${imageName ? 'has-photo' : ''} ${errors.image ? 'invalid' : ''}`}>
          <span className="photo-picker-icon">{imageName ? '✅' : '📸'}</span>
          <span className="photo-picker-text">
            {imageName ? imageName : 'Tap to add a photo'}
          </span>
          <span className="photo-picker-hint">
            {imageName ? 'Tap to change photo' : 'JPG, PNG or WebP · max 10 MB'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              setImageName(e.target.files?.[0]?.name ?? '');
              setErrors((prev) => ({ ...prev, image: '' }));
            }}
          />
        </label>
        {errors.image && <p className="field-error">{errors.image}</p>}
      </div>

      {/* Crop type */}
      <div className="section-card">
        <p className="section-title">🌱 Crop Details</p>
        <label className="label label-required">Crop Type</label>
        <select
          className={errors.cropType ? 'invalid' : ''}
          value={cropType}
          onChange={(e) => { setCropType(e.target.value); setErrors((prev) => ({ ...prev, cropType: '' })); }}
        >
          <option value="">Select crop…</option>
          {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.cropType && <p className="field-error">{errors.cropType}</p>}

        <label className="label label-required" style={{ marginTop: 14 }}>Which part is affected?</label>
        <div className="chips">
          {PARTS.map((p) => (
            <button
              key={p.value}
              className={`chip ${affectedPart === p.value ? 'selected' : ''}`}
              onClick={() => { setAffectedPart(p.value); setErrors((prev) => ({ ...prev, part: '' })); }}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
        {errors.part && <p className="field-error">{errors.part}</p>}
      </div>

      {/* Note */}
      <div className="section-card">
        <p className="section-title">📝 Additional Notes</p>
        <label className="label">Describe the symptoms <span style={{ color: 'var(--gray-500)', fontWeight: 400 }}>(optional)</span></label>
        <textarea
          rows={3}
          maxLength={500}
          placeholder="e.g. yellow spots on lower leaves, wilting in the morning…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ resize: 'none' }}
        />
        <p className="char-count">{note.length} / 500</p>
        {errors.note && <p className="field-error">{errors.note}</p>}
      </div>

      <button className="primary" disabled={submitting} onClick={handleSubmit}>
        {submitting ? (
          <>
            <span className="spinner" />
            Analysing… (toggle Offline to test!)
          </>
        ) : (
          '🔬 Submit for Diagnosis'
        )}
      </button>
    </main>
  );
}
