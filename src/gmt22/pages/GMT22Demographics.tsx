import { useState } from 'react';
import { useGMT22State } from '../GMT22State';
import type { GMT22Participant, GMT22Gender, GMT22DeviceType } from '../types';

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const GENDERS: GMT22Gender[] = [
  'Male',
  'Female',
  'Nonbinary',
  'Prefer not to say',
  'Self describe',
];

const EDUCATION_YEARS = Array.from({ length: 11 }, (_, i) => 10 + i);

const DEVICE_TYPES: GMT22DeviceType[] = [
  'Desktop',
  'Tablet',
  'Phone',
  'Other',
  'Prefer not to say',
];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_BIRTH_YEAR = CURRENT_YEAR - 90;
const MAX_BIRTH_YEAR = CURRENT_YEAR - 10;

export default function GMT22Demographics() {
  const { setParticipant, setPhase } = useGMT22State();
  const [participantId, setParticipantId] = useState('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [gender, setGender] = useState<GMT22Gender | ''>('');
  const [genderSelfDescribe, setGenderSelfDescribe] = useState('');
  const [education, setEducation] = useState('');
  const [deviceType, setDeviceType] = useState<GMT22DeviceType | ''>('');

  const birthYearNum = birthYear.trim() === '' ? null : parseInt(birthYear, 10);
  const birthYearValid =
    birthYearNum !== null &&
    !Number.isNaN(birthYearNum) &&
    birthYearNum >= MIN_BIRTH_YEAR &&
    birthYearNum <= MAX_BIRTH_YEAR;
  const educationNum = education === '' ? null : parseInt(education, 10);
  const educationValid = educationNum !== null && educationNum >= 10 && educationNum <= 20;
  const valid =
    participantId.trim() !== '' &&
    birthYearValid &&
    gender !== '' &&
    educationValid &&
    (gender !== 'Self describe' || genderSelfDescribe.trim() !== '') &&
    deviceType !== '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || birthYearNum === null) return;
    const genderValue =
      gender === 'Self describe'
        ? (genderSelfDescribe.trim() ? `Self describe: ${genderSelfDescribe.trim()}` : 'Self describe')
        : gender;
    const p: GMT22Participant = {
      session_id: generateSessionId(),
      participant_id: participantId.trim(),
      birth_year: birthYearNum,
      gender: genderValue,
      education: education.trim(),
      device_type: deviceType as GMT22DeviceType,
      session_seed: Date.now(),
    };
    setParticipant(p);
    setPhase('copy_instructions');
  }

  return (
    <div className="page">
      <h1>Your information</h1>
      <p className="subtitle">
        Please answer a few questions before starting. Your responses are anonymous.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Participant ID *
          <input
            type="text"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            required
            placeholder="e.g. P001 or your study ID"
            autoComplete="off"
          />
        </label>
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
            onChange={(e) => setGender(e.target.value as GMT22Gender | '')}
            required
          >
            <option value="">Select...</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>
        {gender === 'Self describe' && (
          <label>
            Please describe *
            <input
              type="text"
              value={genderSelfDescribe}
              onChange={(e) => setGenderSelfDescribe(e.target.value)}
              placeholder="e.g. non-binary, other"
              autoComplete="off"
            />
          </label>
        )}
        <label>
          Years of education (10–20) *
          <select
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            required
          >
            <option value="">Select...</option>
            {EDUCATION_YEARS.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </label>
        {education !== '' && !educationValid && (
          <p className="form-error" style={{ marginTop: '-0.5rem', marginBottom: 0 }}>
            Please select between 10 and 20 years.
          </p>
        )}
        <label>
          Device type *
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value as GMT22DeviceType | '')}
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
