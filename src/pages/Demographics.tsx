import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppState';
import type { Participant, Gender } from '../types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Compute age in full years from date of birth (YYYY-MM-DD). */
function ageFromDob(dob: string): number | null {
  if (!dob || dob.length < 10) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

const GENDERS: Gender[] = [
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

export default function Demographics() {
  const navigate = useNavigate();
  const { setParticipant, setTrials } = useAppState();
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [education, setEducation] = useState('');

  const age = dateOfBirth ? ageFromDob(dateOfBirth) : null;
  const ageValid = age !== null && age >= 10 && age <= 90;
  const valid = name.trim() !== '' && ageValid && gender !== '' && education !== '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || age === null) return;
    const p: Participant = {
      id: generateId(),
      name: name.trim(),
      age,
      gender: gender as Gender,
      education: education.trim(),
      timestamp: new Date().toISOString(),
      sessionSeed: Date.now(),
    };
    setParticipant(p);
    setTrials([]);
    navigate('/intro');
  }

  return (
    <div className="page">
      <h1>Your information</h1>
      <p className="subtitle">
        Please enter your details before starting the test.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Name *
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </label>
        <label>
          Date of birth *
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().slice(0, 10)}
            min={new Date(new Date().setFullYear(new Date().getFullYear() - 90)).toISOString().slice(0, 10)}
          />
        </label>
        {dateOfBirth && age !== null && !ageValid && (
          <p className="form-error" style={{ marginTop: '-0.5rem', marginBottom: 0 }}>
            Age must be between 10 and 90.
          </p>
        )}
        <label>
          Gender *
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender | '')}
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
        <button type="submit" disabled={!valid}>
          Start Test
        </button>
      </form>
    </div>
  );
}
