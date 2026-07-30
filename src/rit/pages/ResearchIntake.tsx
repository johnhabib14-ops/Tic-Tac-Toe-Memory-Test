import { useState } from 'react';
import { useRITState } from '../RITState';
import { getInstructions } from '../config/instructions';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';
import type { ProtocolProfile } from '../config/taskConfig';

export default function ResearchIntake() {
  const {
    setPhase,
    meta,
    setMeta,
    visualMode,
    accessibility,
    protocolProfile,
    setProtocolProfile,
  } = useRITState();
  const copy = getInstructions(visualMode);
  const [study, setStudy] = useState(meta.studyCode || 'RIT-STUDY');
  const [participant, setParticipant] = useState('');

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page rit-page">
        <h1 className="game-title">{copy.productName}</h1>
        <BrandLine />
        <ExperimentalBanner />
        <p className="subtitle">Enter study and participant codes for this research session.</p>
        <form
          className="rit-form"
          onSubmit={(e) => {
            e.preventDefault();
            setMeta({
              ...meta,
              studyCode: study.trim(),
              participantCode: participant.trim(),
              examinerId: null,
            });
            setPhase('consent');
          }}
        >
          <label className="rit-field">
            Protocol profile
            <select
              value={protocolProfile}
              onChange={(e) => setProtocolProfile(e.target.value as ProtocolProfile)}
            >
              <option value="full">Full (0.2.0)</option>
              <option value="pilot">Pilot shorter blocks (0.2.0-pilot)</option>
              <option value="demo">Demo showcase (shortest)</option>
            </select>
          </label>
          <label className="rit-field">
            Study code
            <input value={study} onChange={(e) => setStudy(e.target.value)} required />
          </label>
          <label className="rit-field">
            Participant code
            <input value={participant} onChange={(e) => setParticipant(e.target.value)} required />
          </label>
          <button type="submit">Continue</button>
          <button type="button" className="rit-secondary" onClick={() => setPhase('mode_select')}>
            Back
          </button>
        </form>
      </div>
    </ThemeShell>
  );
}
