import { useState } from 'react';
import { useGMT2State } from '../GMT2State';
import type { GMT2Participant, GMT2Gender, GMT2DeviceType } from '../types';

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const GENDERS: GMT2Gender[] = [
  'Male',
  'Female',
  'Nonbinary',
  'Prefer not to say',
  'Self describe',
];

const EDUCATION_OPTIONS = [
  'Less than high school',
  'High school / GED',
  'Some college',
  "Bachelor's degree",
  "Master's degree",
  'Doctorate or professional degree',
  'Prefer not to say',
];

const DEVICE_TYPES: GMT2DeviceType[] = [
  'Desktop',
  'Tablet',
  'Phone',
  'Other',
  'Prefer not to say',
];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_BIRTH_YEAR = CURRENT_YEAR - 90;
const MAX_BIRTH_YEAR = CURRENT_YEAR - 10;

export default function GMT2Demographics() {
  const { setParticipant, setPhase } = useGMT2State();
  const [birthYear, setBirthYear] = useState<string>('');
  const [gender, setGender] = useState<GMT2Gender | ''>('');
  const [education, setEducation] = useState('');
  const [deviceType, setDeviceType] = useState<GMT2DeviceType | ''>('');

  const birthYearNum = birthYear.trim() === '' ? null : parseInt(birthYear, 10);
  const birthYearValid =
    birthYearNum !== null &&
    !Number.isNaN(birthYearNum) &&
    birthYearNum >= MIN_BIRTH_YEAR &&
    birthYearNum <= MAX_BIRTH_YEAR;
  const valid =
    birthYearValid &&
    gender !== '' &&
    education !== '' &&
    deviceType !== '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || birthYearNum === null) return;
    const p: GMT2Participant = {
      session_id: generateSessionId(),
      birth_year: birthYearNum,
      gender: gender as GMT2Gender,
      education: education.trim(),
      device_type: deviceType as GMT2DeviceType,
      session_seed: Date.now(),
    };
    setParticipant(p);
    setPhase('copy');
  }

  return (
    <div className="page">
      <h1>Your information</h1>
      <p className="subtitle">
        Please answer a few questions before starting. Your responses are anonymous.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Year of birth *
          <input
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            required
            min={MIN_BIRTH_YEAR}
            max={MAX_BIRTH_YEAR}
            placeholder="e.g. 1990"
          />
        </label>
        {birthYear.trim() !== '' && !birthYearValid && (
          <p className="form-error" style={{ marginTop: '-0.5rem', marginBottom: 0 }}>
            Year must be between {MIN_BIRTH_YEAR} and {MAX_BIRTH_YEAR}.
          </p>
        )}
        <label>
          Gender *
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as GMT2Gender | '')}
            required
          >
            <option value="">Select...</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>
        <label>
          Level of education *
          <select
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            required
          >
            <option value="">Select...</option>
            {EDUCATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
        <label>
          Device type *
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value as GMT2DeviceType | '')}
            required
          >
            <option value="">Select...</option>
            {DEVICE_TYPES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!valid}>
          Continue
        </button>
      </form>
    </div>
  );
}
