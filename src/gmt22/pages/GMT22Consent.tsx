import { useGMT22State } from '../GMT22State';
import BrandLine from '../../components/brand/BrandLine';
import ExperimentalBanner from '../../components/brand/ExperimentalBanner';
import HubLink from '../../components/brand/HubLink';

export default function GMT22Consent() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1 className="game-title">Consent</h1>
      <BrandLine />
      <ExperimentalBanner />
      <p className="subtitle">
        This is an experimental research task. It is not a diagnostic test and has not been
        clinically validated or normed.
      </p>
      <p>
        By continuing, you agree that your anonymous responses may be used for research. You may
        stop at any time.
      </p>
      <p className="hl-muted">Warm-up, then memory rounds.</p>
      <button type="button" onClick={() => setPhase('demographics')}>
        I agree — continue
      </button>
      <HubLink />
    </div>
  );
}
