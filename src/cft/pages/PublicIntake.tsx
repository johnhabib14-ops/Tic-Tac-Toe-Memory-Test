import { useState } from 'react';
import { useCFTState } from '../CFTState';
import { getInstructions } from '../config/instructions';
import { createAnonymousId } from '../lib/deviceCheck';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';

export default function PublicIntake() {
  const { setPhase, meta, setMeta, visualMode, accessibility } = useCFTState();
  const copy = getInstructions(visualMode);
  const [anonId] = useState(() => createAnonymousId());
  const [useSystemId, setUseSystemId] = useState(true);
  const [customId, setCustomId] = useState('');

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page cft-page">
        <h1 className="game-title">{copy.productName}</h1>
        <BrandLine />
        <ExperimentalBanner />
        <p className="subtitle">
          Public participation is anonymous by default. We do not ask for your name, address, or
          date of birth.
        </p>
        <form
          className="cft-form"
          onSubmit={(e) => {
            e.preventDefault();
            setMeta({
              ...meta,
              studyCode: 'CFT-PUBLIC',
              participantCode: useSystemId ? anonId : customId.trim() || anonId,
              examinerId: null,
            });
            setPhase('consent');
          }}
        >
          <label className="cft-check">
            <input
              type="checkbox"
              checked={useSystemId}
              onChange={(e) => setUseSystemId(e.target.checked)}
            />
            Use a system-generated anonymous ID
          </label>
          {!useSystemId && (
            <label className="cft-field">
              Your anonymous ID
              <input value={customId} onChange={(e) => setCustomId(e.target.value)} />
            </label>
          )}
          {useSystemId && <p className="cft-muted">ID: {anonId}</p>}
          <button type="submit">Continue</button>
          <button type="button" className="cft-secondary" onClick={() => setPhase('mode_select')}>
            Back
          </button>
        </form>
      </div>
    </ThemeShell>
  );
}
