import { useState } from 'react';
import { useRITState } from '../RITState';
import { getInstructions } from '../config/instructions';
import { createAnonymousId } from '../lib/deviceCheck';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';

export default function PublicIntake() {
  const { setPhase, meta, setMeta, visualMode, accessibility } = useRITState();
  const copy = getInstructions(visualMode);
  const [anonId] = useState(() => createAnonymousId());
  const [useSystemId, setUseSystemId] = useState(true);
  const [customId, setCustomId] = useState('');

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page rit-page">
        <h1 className="game-title">{copy.productName}</h1>
        <BrandLine />
        <ExperimentalBanner />
        <p className="subtitle">
          Public participation is anonymous by default. We do not ask for your name, address, or
          date of birth.
        </p>
        <form
          className="rit-form"
          onSubmit={(e) => {
            e.preventDefault();
            setMeta({
              ...meta,
              studyCode: 'RIT-PUBLIC',
              participantCode: useSystemId ? anonId : customId.trim() || anonId,
              examinerId: null,
            });
            setPhase('consent');
          }}
        >
          <label className="rit-check">
            <input
              type="checkbox"
              checked={useSystemId}
              onChange={(e) => setUseSystemId(e.target.checked)}
            />
            Use a system-generated anonymous ID
          </label>
          {!useSystemId && (
            <label className="rit-field">
              Your anonymous ID
              <input value={customId} onChange={(e) => setCustomId(e.target.value)} />
            </label>
          )}
          {useSystemId && <p className="rit-muted">ID: {anonId}</p>}
          <button type="submit">Continue</button>
          <button type="button" className="rit-secondary" onClick={() => setPhase('mode_select')}>
            Back
          </button>
        </form>
      </div>
    </ThemeShell>
  );
}
