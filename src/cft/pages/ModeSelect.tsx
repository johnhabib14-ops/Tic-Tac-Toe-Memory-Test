import { useMemo } from 'react';
import { useCFTState } from '../CFTState';
import { getInstructions } from '../config/instructions';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';
import HubLink from '../../components/brand/HubLink';
import { isBatterySessionActive, isFullBatteryActive } from '../../lib/batterySession';
import {
  isLinkedAdministration,
  linkModeToEngineMode,
  readAssessmentLinkContext,
} from '../../lib/assessmentLink';
import type { AdministrationMode, VisualMode } from '../types';

export default function ModeSelect() {
  const {
    setPhase,
    setVisualMode,
    setAdministrationMode,
    visualMode,
    accessibility,
    protocolProfile,
  } = useCFTState();
  const copy = getInstructions(visualMode);
  const isDemo = protocolProfile === 'demo';
  const inFullBattery = isFullBatteryActive();
  const inBattery = isBatterySessionActive();
  const linked = isLinkedAdministration();
  const linkCtx = readAssessmentLinkContext();
  const quickStart = isDemo || inFullBattery || linked;

  const options = useMemo(
    () =>
      [
        {
          admin: 'supervised_clinical' as AdministrationMode,
          label: 'Supervised clinical',
          detail: 'Examiner starts the session. Scores hidden during administration.',
        },
        {
          admin: 'research' as AdministrationMode,
          label: 'Research',
          detail: 'Study codes, consent, demographics, export-ready data.',
        },
        {
          admin: 'public' as AdministrationMode,
          label: 'Public data collection',
          detail: 'Anonymous participation. No diagnosis or clinical claims.',
        },
      ] as const,
    []
  );

  const start = (admin: AdministrationMode, visual: VisualMode) => {
    const resolved =
      linked && linkCtx ? linkModeToEngineMode(linkCtx.mode) : admin;
    setAdministrationMode(resolved);
    setVisualMode(visual);
    if (quickStart) {
      setPhase('orientation');
      return;
    }
    if (resolved === 'supervised_clinical') setPhase('admin_setup');
    else if (resolved === 'research') setPhase('research_intake');
    else setPhase('public_intake');
  };

  return (
    <ThemeShell
      mode={visualMode}
      highContrast={accessibility.highContrast}
      scalableText={accessibility.scalableText}
    >
      <div className="page cft-page">
        <h1 className="game-title">{copy.productName}</h1>
        <BrandLine />
        <ExperimentalBanner />
        {isDemo && (
          <p className="hl-demo-badge" role="status">
            Demo protocol — short blocks. Same rules and scoring formula.
          </p>
        )}
        {inFullBattery && !isDemo && (
          <p className="hl-demo-badge" role="status">
            Full battery — task 3 of 3. Full protocol length.
          </p>
        )}
        {linked && linkCtx && (
          <p className="hl-demo-badge" role="status">
            Linked administration ({linkCtx.mode}). Mode is set by your assessment link.
          </p>
        )}
        <p className="subtitle">
          {linked
            ? 'Pick a look, then begin. Administration mode comes from your link.'
            : isDemo
              ? 'Pick a look, then begin the short demo.'
              : inFullBattery
                ? 'Pick a look, then continue the battery.'
                : 'Choose how this session will be administered and how it should look. Trial structure and scoring stay the same in both visual modes.'}
        </p>

        <div className="cft-mode-grid">
          <label className="cft-field">
            Visual presentation
            <select
              value={visualMode}
              onChange={(e) => setVisualMode(e.target.value as VisualMode)}
            >
              <option value="clinical">Clinical Mode</option>
              <option value="game">Game Mode</option>
            </select>
          </label>
        </div>

        {quickStart ? (
          <button
            type="button"
            onClick={() =>
              start(
                linked && linkCtx
                  ? linkModeToEngineMode(linkCtx.mode)
                  : 'research',
                visualMode
              )
            }
          >
            {isDemo ? 'Begin demo' : linked ? 'Begin assessment' : 'Continue battery'}
          </button>
        ) : (
          <div className="cft-admin-options">
            {options.map((o) => (
              <button
                key={o.admin}
                type="button"
                className="cft-option-btn"
                onClick={() => start(o.admin, visualMode)}
              >
                <strong>{o.label}</strong>
                <span>{o.detail}</span>
              </button>
            ))}
          </div>
        )}
        {!inBattery && !linked && <HubLink />}
      </div>
    </ThemeShell>
  );
}
