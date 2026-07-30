import { useNavigate } from 'react-router-dom';
import BrandLine from '../components/brand/BrandLine';
import BrandMark from '../components/brand/BrandMark';
import ExperimentalBanner from '../components/brand/ExperimentalBanner';
import HubLink from '../components/brand/HubLink';
import {
  batteryStepLabel,
  batteryStepPath,
  clearBatterySession,
  startBatterySession,
  type BatteryStep,
} from '../lib/batterySession';

const STEPS: { key: BatteryStep; detail: string }[] = [
  {
    key: 'gmt',
    detail: 'Visual-spatial working memory — encode and reconstruct symbol grids.',
  },
  {
    key: 'rit',
    detail: 'Inhibitory control — respond to go signals and withhold on stop cues.',
  },
  {
    key: 'cft',
    detail: 'Cognitive flexibility — sort by changing rules.',
  },
];

export default function BatteryIntro() {
  const navigate = useNavigate();

  const begin = () => {
    clearBatterySession();
    startBatterySession('full');
    navigate(batteryStepPath('gmt', 'full'));
  };

  return (
    <div className="page hl-hub">
      <div className="hl-hub-hero">
        <BrandMark size="md" />
        <p className="hl-hub-eyebrow">Full protocol</p>
        <h1 className="hl-hub-title">EF Assessment Battery</h1>
        <BrandLine />
        <p className="subtitle hl-hub-lead">
          Three tasks in a fixed order. Full lengths — not the short demo. There is no combined EF
          score; each task is scored on its own.
        </p>

        <ol className="hl-battery-steps">
          {STEPS.map((s) => (
            <li key={s.key}>
              <strong>{batteryStepLabel(s.key)}</strong>
              <span className="hl-muted">{s.detail}</span>
            </li>
          ))}
        </ol>

        <p className="hl-muted" style={{ marginBottom: 16 }}>
          Expect a substantial session. You can exit between tasks.
        </p>

        <div className="hl-hub-ctas">
          <button type="button" onClick={begin}>
            Begin full battery
          </button>
        </div>
        <ExperimentalBanner />
      </div>

      <HubLink />
    </div>
  );
}
