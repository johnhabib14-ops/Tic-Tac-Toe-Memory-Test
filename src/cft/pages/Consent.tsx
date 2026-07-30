import { useState } from 'react';
import { useCFTState } from '../CFTState';
import { getInstructions } from '../config/instructions';
import { TASK_CONFIG } from '../config/taskConfig';
import { CFT_CONSENT_VERSION } from '../types';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';

export default function Consent() {
  const {
    setPhase,
    setConsent,
    visualMode,
    accessibility,
    administrationMode,
    setCompletionStatus,
  } = useCFTState();
  const copy = getInstructions(visualMode);
  const [accepted, setAccepted] = useState(false);
  const [recontact, setRecontact] = useState(false);

  const withdraw = () => {
    setCompletionStatus('withdrawn');
    setPhase('completion');
  };

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page cft-page">
        <h1 className="game-title">{copy.productName}</h1>
        <BrandLine />
        <ExperimentalBanner />
        <div className="cft-consent">
          <p>
            You will complete a short computer task about how people respond to signals and
            sometimes hold back a response. This is research under development — not a medical
            diagnosis or clinical evaluation.
          </p>
          <p>
            Responses may be stored for research. {TASK_CONFIG.dataRetentionPolicyDefault}
          </p>
          {administrationMode === 'public' && (
            <p>
              Public mode uses an anonymous ID. We do not collect names or addresses here. Optional
              recontact permission is kept separate from task scores.
            </p>
          )}
          <p className="cft-muted">Consent version: {CFT_CONSENT_VERSION}</p>
          <label className="cft-check">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            I agree to take part and understand I can stop before submitting.
          </label>
          {administrationMode === 'public' && (
            <label className="cft-check">
              <input
                type="checkbox"
                checked={recontact}
                onChange={(e) => setRecontact(e.target.checked)}
              />
              Optional: I may be contacted later for related research (stored separately from scores).
            </label>
          )}
        </div>
        <button
          type="button"
          disabled={!accepted}
          onClick={() => {
            setConsent({
              consentVersion: CFT_CONSENT_VERSION,
              acceptedAt: new Date().toISOString(),
              anonymousParticipation: administrationMode === 'public',
              recontactPermission: recontact,
              recontactContactSeparated: true,
              withdrawBeforeSubmit: true,
            });
            setPhase(administrationMode === 'research' ? 'eligibility' : 'demographics');
          }}
        >
          Continue
        </button>
        <button type="button" className="cft-secondary" onClick={withdraw}>
          Withdraw
        </button>
      </div>
    </ThemeShell>
  );
}
