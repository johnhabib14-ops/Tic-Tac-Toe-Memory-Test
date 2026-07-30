import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BrandLine from '../components/brand/BrandLine';
import BrandMark from '../components/brand/BrandMark';
import ExperimentalBanner from '../components/brand/ExperimentalBanner';
import {
  setAssessmentLinkContext,
  type LinkAdministrationMode,
} from '../lib/assessmentLink';
import { startBatterySession } from '../lib/batterySession';
import { recordConsent, validateAssessmentLink } from '../lib/platformAuth';

const CONSENT_COPY =
  'I understand this is an experimental cognitive assessment, not a medical diagnosis. ' +
  'My responses may be stored according to the study or clinical protocol associated with this link.';

export default function AssessmentLinkEntry() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<LinkAdministrationMode | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setStatus('error');
        setError('Missing assessment token.');
        return;
      }
      const result = await validateAssessmentLink(token);
      if (cancelled) return;
      if (result.error || !result.link) {
        setStatus('error');
        setError(result.error || 'Invalid link');
        return;
      }
      setMode(result.link.mode);
      setAssessmentLinkContext({
        token: result.link.token,
        linkId: result.link.id,
        mode: result.link.mode,
        metadata: result.link.metadata || {},
        startedAt: new Date().toISOString(),
      });
      setStatus('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onStart = async () => {
    if (!accepted || !token || !mode) return;
    setBusy(true);
    await recordConsent({ token });
    startBatterySession('full');
    setBusy(false);
    navigate('/battery');
  };

  return (
    <div className="page hl-hub">
      <div className="hl-hub-hero">
        <BrandMark size="hero" />
        <h1 className="hl-hub-title">Assessment invitation</h1>
        <BrandLine />
        <ExperimentalBanner />
      </div>

      {status === 'loading' && <p className="hl-muted">Validating link…</p>}

      {status === 'error' && (
        <>
          <p className="hl-muted" role="alert">
            {error || 'This assessment link is invalid or expired.'}
          </p>
          <p className="hl-hub-link">
            <Link to="/">Return to hub</Link>
          </p>
        </>
      )}

      {status === 'ready' && mode && (
        <>
          <p className="subtitle hl-hub-lead">
            You have been invited to complete the EF Assessment Battery
            {mode === 'clinical'
              ? ' for a clinical administration.'
              : mode === 'research'
                ? ' as part of a research study.'
                : ' as a public cognitive wellness check-in.'}
          </p>
          <p className="hl-muted">
            You will run the same three tasks used across all modes: Grid Memory, Response
            Inhibition, and Cognitive Flexibility.
          </p>
          <label className="hl-auth-check">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>{CONSENT_COPY}</span>
          </label>
          <div className="hl-hub-ctas">
            <button type="button" disabled={!accepted || busy} onClick={onStart}>
              {busy ? 'Starting…' : 'Start full battery'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
