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

const today = new Date();

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function ageFromDateOfBirth(birthDate: Date, referenceDate: Date = today): number {
  const b = toDateOnly(birthDate);
  const r = toDateOnly(referenceDate);
  let age = r.getFullYear() - b.getFullYear();
  if (r.getMonth() < b.getMonth() || (r.getMonth() === b.getMonth() && r.getDate() < b.getDate())) {
    age -= 1;
  }
  return age;
}

function isoDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const MIN_BIRTH_DATE = new Date(today.getFullYear() - 90, today.getMonth(), today.getDate());
const MAX_BIRTH_DATE = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
const MIN_DATE_STR = isoDateString(MIN_BIRTH_DATE);
const MAX_DATE_STR = isoDateString(MAX_BIRTH_DATE);

export default function GMT22Demographics() {
  const { setParticipant, setPhase } = useGMT22State();
  const [participantId, setParticipantId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<GMT22Gender | ''>('');
  const [genderSelfDescribe, setGenderSelfDescribe] = useState('');
  const [education, setEducation] = useState('');
  const [deviceType, setDeviceType] = useState<GMT22DeviceType | ''>('');

  const birthDate = dateOfBirth.trim() === '' ? null : new Date(dateOfBirth + 'T12:00:00');
  const dateOfBirthValid =
    birthDate !== null &&
    !Number.isNaN(birthDate.getTime()) &&
    birthDate >= MIN_BIRTH_DATE &&
    birthDate <= MAX_BIRTH_DATE;
  const age = birthDate && dateOfBirthValid ? ageFromDateOfBirth(birthDate) : null;
  const ageValid = age !== null && age >= 10 && age <= 90;
  const educationNum = education === '' ? null : parseInt(education, 10);
  const educationValid = educationNum !== null && educationNum >= 10 && educationNum <= 20;
  const valid =
    participantId.trim() !== '' &&
    dateOfBirthValid &&
    ageValid &&
    gender !== '' &&
    educationValid &&
    (gender !== 'Self describe' || genderSelfDescribe.trim() !== '') &&
    deviceType !== '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !birthDate) return;
    const submitAge = ageFromDateOfBirth(birthDate);
    if (submitAge < 10 || submitAge > 90) {
      return;
    }
    const genderValue =
      gender === 'Self describe'
        ? (genderSelfDescribe.trim() ? `Self describe: ${genderSelfDescribe.trim()}` : 'Self describe')
        : gender;
    const birth_year = birthDate.getFullYear();
    const age = submitAge;
    const p: GMT22Participant = {
      session_id: generateSessionId(),
      participant_id: participantId.trim(),
      birth_year,
      age,
      gender: genderValue,
      education: education.trim(),
      device_type: deviceType as GMT22DeviceType,
      session_seed: Date.now(),
      condition_order: Math.random() < 0.5 ? 'A' : 'B',
    };
    setParticipant(p);
    setPhase('practice');
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
          Date of birth *
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
            min={MIN_DATE_STR}
            max={MAX_DATE_STR}
            aria-describedby={dateOfBirth.trim() !== '' && !dateOfBirthValid ? 'dob-error' : undefined}
          />
        </label>
        {dateOfBirth.trim() !== '' && !dateOfBirthValid && (
          <p id="dob-error" className="form-error" style={{ marginTop: '-0.5rem', marginBottom: 0 }}>
            Date must be between {MIN_DATE_STR} and {MAX_DATE_STR} (age 10–90).
          </p>
        )}
        {dateOfBirth.trim() !== '' && dateOfBirthValid && age !== null && (age < 10 || age > 90) && (
          <p id="age-error" className="form-error" style={{ marginTop: '-0.5rem', marginBottom: 0 }}>
            Age must be between 10 and 90.
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
