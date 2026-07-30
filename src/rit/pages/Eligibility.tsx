import { useState } from 'react';
import { useRITState } from '../RITState';
import { getInstructions } from '../config/instructions';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';

export default function Eligibility() {
  const { setPhase, visualMode, accessibility, administrationMode } = useRITState();
  const copy = getInstructions(visualMode);
  const [ageOk, setAgeOk] = useState(false);
  const [visionOk, setVisionOk] = useState(false);
  const [understood, setUnderstood] = useState(false);

  if (administrationMode !== 'research') {
    // Safety: non-research should not land here
    return null;
  }

  const canContinue = ageOk && visionOk && understood;

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page rit-page">
        <h1 className="game-title">{copy.productName}</h1>
        <BrandLine />
        <ExperimentalBanner />
        <p className="subtitle">Research eligibility (brief). Skip any item only if your protocol allows.</p>
        <div className="rit-consent">
          <label className="rit-check">
            <input type="checkbox" checked={ageOk} onChange={(e) => setAgeOk(e.target.checked)} />
            I confirm I meet the study age requirement (typically 18+ unless your protocol states otherwise).
          </label>
          <label className="rit-check">
            <input
              type="checkbox"
              checked={visionOk}
              onChange={(e) => setVisionOk(e.target.checked)}
            />
            I can see shapes and colors on this screen well enough to try the task (with correction if needed).
          </label>
          <label className="rit-check">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
            />
            I understand this is an experimental research task, not a medical diagnosis.
          </label>
        </div>
        <button type="button" disabled={!canContinue} onClick={() => setPhase('demographics')}>
          Continue
        </button>
        <button type="button" className="rit-secondary" onClick={() => setPhase('consent')}>
          Back
        </button>
      </div>
    </ThemeShell>
  );
}
