import { useCFTState } from '../CFTState';
import { getInstructions } from '../config/instructions';
import { ThemeShell, BrandLine } from '../components/ThemeShell';
import HubLink from '../../components/brand/HubLink';
import BatteryContinue from '../../components/brand/BatteryContinue';

export default function Locked() {
  const { resetSession, visualMode, accessibility, sessionLocked, administrationMode } =
    useCFTState();
  const copy = getInstructions(visualMode);

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page cft-page">
        <h1 className="game-title">{copy.productName}</h1>
        <BrandLine />
        <p className="subtitle">
          {sessionLocked || administrationMode === 'supervised_clinical'
            ? 'Session locked.'
            : 'Session finished.'}
        </p>
        <p>Thank you. You may close this window.</p>
        <BatteryContinue />
        <button type="button" onClick={() => resetSession()}>
          Start another session
        </button>
        <HubLink />
      </div>
    </ThemeShell>
  );
}
