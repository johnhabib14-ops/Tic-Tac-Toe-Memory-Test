import { useState } from 'react';
import { useCFTState } from '../CFTState';
import { getInstructions } from '../config/instructions';
import CueBanner from '../components/CueBanner';
import StimulusRenderer from '../components/StimulusRenderer';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';
import HubLink from '../../components/brand/HubLink';
import type { RuleFeature, StimulusProperties } from '../types';

const DEMO_SHAPE: StimulusProperties = {
  features: { shape: 'circle', pattern: 'solid', number: 'one' },
  label: 'shape_circle_solid_one',
};
const DEMO_PATTERN: StimulusProperties = {
  features: { shape: 'square', pattern: 'striped', number: 'one' },
  label: 'pattern_square_striped_one',
};
const DEMO_NUMBER: StimulusProperties = {
  features: { shape: 'circle', pattern: 'solid', number: 'two' },
  label: 'number_circle_solid_two',
};
const DEMO_CONFLICT: StimulusProperties = {
  features: { shape: 'circle', pattern: 'striped', number: 'one' },
  label: 'conflict_circle_striped_one',
};

const STEPS = ['shape', 'pattern', 'number', 'controls', 'conflict'] as const;

export default function Orientation() {
  const { setPhase, visualMode, accessibility, setStartTime } = useCFTState();
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

  const demo = (rule: RuleFeature, stimulus: StimulusProperties, text: string) => (
    <div className="hl-orient-stage">
      <CueBanner rule={rule} visualMode={visualMode} />
      <StimulusRenderer
        stimulus={stimulus}
        visualMode={visualMode}
        highContrast={accessibility.highContrast}
      />
      <p className="hl-orient-line">{text}</p>
    </div>
  );

  return (
    <ThemeShell
      mode={visualMode}
      highContrast={accessibility.highContrast}
      scalableText={accessibility.scalableText}
    >
      <div className="page cft-page">
        <h1 className="game-title">{copy.productName}</h1>
        {step === 0 && (
          <>
            <BrandLine />
            <ExperimentalBanner />
          </>
        )}
        <div className="hl-step-dots" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`hl-step-dot${i === step ? ' is-active' : ''}`}
            />
          ))}
        </div>
        {step === 0 && <p className="subtitle">{copy.shortGoal}</p>}

        {id === 'shape' && demo('shape', DEMO_SHAPE, copy.ruleShape)}
        {id === 'pattern' && demo('pattern', DEMO_PATTERN, copy.rulePattern)}
        {id === 'number' && demo('number', DEMO_NUMBER, copy.ruleNumber)}
        {id === 'controls' && (
          <div className="hl-orient-stage">
            <p className="hl-orient-line">{copy.controlsKeyboard}</p>
            <p className="hl-orient-line">{copy.controlsTouch}</p>
            <p className="hl-orient-line">{copy.ruleSwitch}</p>
          </div>
        )}
        {id === 'conflict' && (
          <>
            {demo('shape', DEMO_CONFLICT, copy.ruleConflict)}
            <label className="cft-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              {copy.confirmUnderstood}
            </label>
          </>
        )}

        <button type="button" onClick={next} disabled={id === 'conflict' && !confirmed}>
          {step < STEPS.length - 1 ? 'Next' : 'Start practice'}
        </button>
        <HubLink />
      </div>
    </ThemeShell>
  );
}
