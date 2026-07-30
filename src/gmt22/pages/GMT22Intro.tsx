import { useGMT22State } from '../GMT22State';
import BrandLine from '../../components/brand/BrandLine';
import ExperimentalBanner from '../../components/brand/ExperimentalBanner';
import HubLink from '../../components/brand/HubLink';
import { getBatteryId, isFullBatteryActive } from '../../lib/batterySession';
import type { GMT22Participant } from '../types';

function demoParticipant(): GMT22Participant {
  return {
    session_id: `demo-${Date.now()}`,
    participant_id: 'DEMO',
    birth_year: 1990,
    age: 35,
    gender: 'Prefer not to say',
    education: '16',
    device_type: 'Desktop',
    session_seed: Date.now() % 1_000_000,
    condition_order: 'A',
    battery_id: getBatteryId(),
  };
}

export default function GMT22Intro() {
  const { setPhase, setParticipant, demoMode } = useGMT22State();
  const inFullBattery = isFullBatteryActive();

  const beginDemo = () => {
    setParticipant(demoParticipant());
    setPhase('practice');
  };

  return (
    <div className="page">
      <h1 className="game-title">
        Grid Memory Task{demoMode ? ' (Demo)' : ''}
      </h1>
      <BrandLine />
      <ExperimentalBanner />
      {demoMode && (
        <p className="hl-demo-badge" role="status">
          Demo protocol — two conditions, spans 2–3, one trial each. Copy block skipped.
        </p>
      )}
      {inFullBattery && !demoMode && (
        <p className="hl-demo-badge" role="status">
          Full battery — task 1 of 3. Full protocol length.
        </p>
      )}
      <p className="subtitle">
        Visual-spatial working memory: briefly view symbol grids, then reconstruct them from memory.
      </p>
      {!demoMode && (
        <>
          <p>
            <strong>Session overview</strong>
          </p>
          <ul className="hl-instruction-list">
            <li>
              <strong>Warm-up:</strong> Match a visible grid (no memory load).
            </li>
            <li>
              <strong>Memory blocks:</strong> Encode, then place symbols. Some rounds include only X and
              O; others also use +. Each screen states which shapes apply.
            </li>
          </ul>
          <p className="hl-muted">Typically a few minutes. Results are for research use only.</p>
          <button type="button" onClick={() => setPhase('consent')}>
            Next
          </button>
        </>
      )}
      {demoMode && (
        <>
          <p className="hl-muted">
            Short showcase of encoding and reconstruction. Not a full research session.
          </p>
          <button type="button" onClick={beginDemo}>
            Begin demo
          </button>
        </>
      )}
      {!inFullBattery && <HubLink />}
    </div>
  );
}
