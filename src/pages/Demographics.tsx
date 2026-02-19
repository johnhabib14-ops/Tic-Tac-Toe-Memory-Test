import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppState';
import type { Participant, Gender } from '../types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const GENDERS: Gender[] = [
  'Male',
  'Female',
  'Nonbinary',
  'Prefer not to say',
  'Self describe',
];

export default function Demographics() {
  const navigate = useNavigate();
  const { setParticipant, setTrials } = useAppState();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [location, setLocation] = useState('');

  const ageNum = age === '' ? NaN : parseInt(age, 10);
  const valid = name.trim() !== '' && !isNaN(ageNum) && ageNum >= 10 && ageNum <= 90 && gender !== '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const p: Participant = {
      id: generateId(),
      name: name.trim(),
      age: ageNum,
      gender: gender as Gender,
      location: location.trim(),
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
          Age *
          <input
            type="number"
            min={10}
            max={90}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </label>
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
          Location (optional)
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            autoComplete="address-level2"
          />
        </label>
        <button type="submit" disabled={!valid}>
          Start Test
        </button>
      </form>
    </div>
  );
}
