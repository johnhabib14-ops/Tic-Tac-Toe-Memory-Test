import { useState } from 'react';
import { useCFTState } from '../CFTState';
import { getInstructions } from '../config/instructions';
import type { Demographics } from '../types';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';

const empty: Demographics = {
  ageYears: null,
  ageBand: null,
  educationLevel: null,
  dominantHand: null,
  primaryLanguage: null,
  region: null,
  sleepEstimateHours: null,
  recentCaffeine: null,
  visionCorrection: null,
  colorVisionDifficulty: null,
  neurologicalHistoryOptIn: null,
};

export default function Demographics() {
  const {
    setPhase,
    demographics,
    setDemographics,
    visualMode,
    accessibility,
    administrationMode,
  } = useCFTState();
  const copy = getInstructions(visualMode);
  const [form, setForm] = useState<Demographics>({ ...empty, ...demographics });

  const set = <K extends keyof Demographics>(key: K, value: Demographics[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const skipSensitive = administrationMode === 'public';

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page cft-page">
        <h1 className="game-title">{copy.productName}</h1>
        <BrandLine />
        <ExperimentalBanner />
        <p className="subtitle">
          Optional background questions help research context. You may skip any item.
        </p>
        <form
          className="cft-form cft-form-wide"
          onSubmit={(e) => {
            e.preventDefault();
            setDemographics(form);
            setPhase('device_check');
          }}
        >
          <label className="cft-field">
            Age (years)
            <input
              type="number"
              min={18}
              max={120}
              value={form.ageYears ?? ''}
              onChange={(e) =>
                set('ageYears', e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </label>
          <label className="cft-field">
            Age band (if preferred over exact years)
            <select
              value={form.ageBand ?? ''}
              onChange={(e) => set('ageBand', e.target.value || null)}
            >
              <option value="">Prefer not to say</option>
              <option value="18-24">18–24</option>
              <option value="25-34">25–34</option>
              <option value="35-44">35–44</option>
              <option value="45-54">45–54</option>
              <option value="55-64">55–64</option>
              <option value="65+">65+</option>
            </select>
          </label>
          <label className="cft-field">
            Education level
            <select
              value={form.educationLevel ?? ''}
              onChange={(e) => set('educationLevel', e.target.value || null)}
            >
              <option value="">Prefer not to say</option>
              <option value="high_school">High school or less</option>
              <option value="some_college">Some college</option>
              <option value="bachelors">Bachelor&apos;s</option>
              <option value="graduate">Graduate degree</option>
            </select>
          </label>
          <label className="cft-field">
            Dominant hand
            <select
              value={form.dominantHand ?? ''}
              onChange={(e) => set('dominantHand', e.target.value || null)}
            >
              <option value="">Prefer not to say</option>
              <option value="right">Right</option>
              <option value="left">Left</option>
              <option value="ambidextrous">Ambidextrous</option>
            </select>
          </label>
          <label className="cft-field">
            Primary language
            <input
              value={form.primaryLanguage ?? ''}
              onChange={(e) => set('primaryLanguage', e.target.value || null)}
            />
          </label>
          <label className="cft-field">
            Country / region
            <input
              value={form.region ?? ''}
              onChange={(e) => set('region', e.target.value || null)}
            />
          </label>
          <label className="cft-field">
            Sleep last night (hours, estimate)
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={form.sleepEstimateHours ?? ''}
              onChange={(e) =>
                set(
                  'sleepEstimateHours',
                  e.target.value === '' ? null : Number(e.target.value)
                )
              }
            />
          </label>
          <label className="cft-field">
            Recent caffeine
            <select
              value={form.recentCaffeine ?? ''}
              onChange={(e) => set('recentCaffeine', e.target.value || null)}
            >
              <option value="">Prefer not to say</option>
              <option value="none">None today</option>
              <option value="some">Some today</option>
              <option value="a_lot">A lot today</option>
            </select>
          </label>
          <label className="cft-field">
            Vision correction
            <select
              value={form.visionCorrection ?? ''}
              onChange={(e) => set('visionCorrection', e.target.value || null)}
            >
              <option value="">Prefer not to say</option>
              <option value="none">None</option>
              <option value="glasses">Glasses</option>
              <option value="contacts">Contacts</option>
            </select>
          </label>
          <label className="cft-field">
            Color-vision difficulty
            <select
              value={form.colorVisionDifficulty ?? ''}
              onChange={(e) => set('colorVisionDifficulty', e.target.value || null)}
            >
              <option value="">Prefer not to say</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
              <option value="unsure">Unsure</option>
            </select>
          </label>
          {!skipSensitive && (
            <label className="cft-field">
              Neurological / psychiatric history (protocol-approved studies only)
              <select
                value={form.neurologicalHistoryOptIn ?? ''}
                onChange={(e) => set('neurologicalHistoryOptIn', e.target.value || null)}
              >
                <option value="">Skip</option>
                <option value="none_reported">None reported</option>
                <option value="reported">Reported (details collected offline)</option>
                <option value="prefer_not">Prefer not to say</option>
              </select>
            </label>
          )}
          <button type="submit">Continue</button>
          <button
            type="button"
            className="cft-secondary"
            onClick={() => {
              setDemographics(form);
              setPhase('device_check');
            }}
          >
            Skip remaining
          </button>
        </form>
      </div>
    </ThemeShell>
  );
}
