import { useRITState } from '../RITState';
import { getInstructions } from '../config/instructions';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';
import BatteryContinue from '../../components/brand/BatteryContinue';

export default function Debrief() {
  const { setPhase, visualMode, accessibility, protocolProfile } = useRITState();
  const copy = getInstructions(visualMode);
  const isDemo = protocolProfile === 'demo';

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page rit-page">
        <h1 className="game-title">Research debrief</h1>
        <BrandLine />
        <ExperimentalBanner />
        <div className="rit-consent">
          <p>
            Thank you for completing <strong>{copy.productName}</strong>. This task studies how
            people withhold automatic responses (response inhibition). Attention and speed also
            affect scores but are secondary process measures.
          </p>
          <p>
            Results are experimental. They are not a diagnosis, IQ estimate, or clinical
            classification. If you have questions about the study, contact your research team.
          </p>
          <p className="rit-muted">
            You may request withdrawal of your submission according to the consent and retention
            policy for this study.
          </p>
        </div>
        <BatteryContinue />
        {!isDemo && (
          <button type="button" onClick={() => setPhase('research_dashboard')}>
            Continue to research dashboard
          </button>
        )}
      </div>
    </ThemeShell>
  );
}
