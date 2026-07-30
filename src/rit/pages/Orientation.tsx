import { useState } from 'react';
import { useRITState } from '../RITState';
import { getInstructions } from '../config/instructions';
import StimulusRenderer from '../components/StimulusRenderer';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';
import HubLink from '../../components/brand/HubLink';
import type { StimulusProperties } from '../types';

const DEMO_GO_A: StimulusProperties = {
  kind: 'go_a',
  shape: 'diamond',
  colorToken: 'signal_blue',
  hasStopCue: false,
  hasReverseFrame: false,
  label: 'go_a_blue_diamond',
};
const DEMO_GO_B: StimulusProperties = {
  kind: 'go_b',
  shape: 'hexagon',
  colorToken: 'signal_amber',
  hasStopCue: false,
  hasReverseFrame: false,
  label: 'go_b_amber_hexagon',
};
const DEMO_NOGO: StimulusProperties = {
  kind: 'nogo',
  shape: 'diamond',
  colorToken: 'signal_blue',
  hasStopCue: true,
  hasReverseFrame: false,
  label: 'nogo_stop_cue',
};
const DEMO_REVERSE: StimulusProperties = {
  kind: 'go_a',
  shape: 'diamond',
  colorToken: 'signal_blue',
  hasStopCue: false,
  hasReverseFrame: true,
  label: 'go_a_reversed',
};

const STEPS = ['goa', 'gob', 'nogo', 'controls', 'interference'] as const;

export default function Orientation() {
  const { setPhase, visualMode, accessibility, setStartTime } = useRITState();
  const copy = getInstructions(visualMode);
  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const id = STEPS[step];

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    if (!confirmed) return;
    setStartTime(new Date().toISOString());
    setPhase('practice');
  };

  return (
    <ThemeShell
      mode={visualMode}
      highContrast={accessibility.highContrast}
      scalableText={accessibility.scalableText}
    >
      <div className="page rit-page">
        <h1 className="game-title">{copy.productName}</h1>
        {step === 0 && (
          <>
            <BrandLine />
            <ExperimentalBanner />
            <p className="subtitle">{copy.shortGoal}</p>
          </>
        )}
        <div className="hl-step-dots" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <span key={s} className={`hl-step-dot${i === step ? ' is-active' : ''}`} />
          ))}
        </div>

        {id === 'goa' && (
          <div className="hl-orient-stage">
            <StimulusRenderer
              stimulus={DEMO_GO_A}
              visualMode={visualMode}
              highContrast={accessibility.highContrast}
            />
            <p className="hl-orient-line">{copy.ruleGoA}</p>
          </div>
        )}
        {id === 'gob' && (
          <div className="hl-orient-stage">
            <StimulusRenderer
              stimulus={DEMO_GO_B}
              visualMode={visualMode}
              highContrast={accessibility.highContrast}
            />
            <p className="hl-orient-line">{copy.ruleGoB}</p>
          </div>
        )}
        {id === 'nogo' && (
          <div className="hl-orient-stage">
            <StimulusRenderer
              stimulus={DEMO_NOGO}
              visualMode={visualMode}
              highContrast={accessibility.highContrast}
            />
            <p className="hl-orient-line">{copy.ruleNoGo}</p>
          </div>
        )}
        {id === 'controls' && (
          <div className="hl-orient-stage">
            <p className="hl-orient-line">{copy.controlsKeyboard}</p>
            <p className="hl-orient-line">{copy.controlsTouch}</p>
          </div>
        )}
        {id === 'interference' && (
          <div className="hl-orient-stage">
            <StimulusRenderer
              stimulus={DEMO_REVERSE}
              visualMode={visualMode}
              highContrast={accessibility.highContrast}
            />
            <p className="hl-orient-line">
              <strong>Double frame:</strong> {copy.ruleInterference}
            </p>
            <label className="rit-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              {copy.confirmUnderstood}
            </label>
          </div>
        )}

        <button type="button" onClick={next} disabled={id === 'interference' && !confirmed}>
          {step < STEPS.length - 1 ? 'Next' : 'Start practice'}
        </button>
        <HubLink />
      </div>
    </ThemeShell>
  );
}
