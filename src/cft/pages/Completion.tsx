import { useEffect, useState } from 'react';
import { useCFTState } from '../CFTState';
import { getInstructions } from '../config/instructions';
import { saveToArchive, type SubmitStatus } from '../lib/sessionArchive';
import { submitCftSession } from '../lib/submitCft';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';
import HubLink from '../../components/brand/HubLink';
import BatteryContinue from '../../components/brand/BatteryContinue';
import { isBatterySessionActive } from '../../lib/batterySession';

export default function Completion() {
  const {
    setPhase,
    visualMode,
    accessibility,
    administrationMode,
    buildSessionRecord,
    trials,
    setCompletionTime,
    setCompletionStatus,
    completionStatus,
    demographics,
    protocolProfile,
  } = useCFTState();
  const copy = getInstructions(visualMode);
  const [saved, setSaved] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus | null>(null);
  const isDemo = protocolProfile === 'demo';
  const inBattery = isBatterySessionActive();
  const skipPostFlow = isDemo || inBattery;

  useEffect(() => {
    if (completionStatus === 'withdrawn') {
      setSaved(true);
      setSubmitStatus('local_only');
      return;
    }
    const completionTime = new Date().toISOString();
    setCompletionTime(completionTime);
    setCompletionStatus('completed');
    const session = buildSessionRecord();
    const finalized = {
      ...session,
      completionStatus: 'completed' as const,
      completionTime,
    };
    // Always archive locally first, then attempt server submit.
    saveToArchive(finalized, trials, { submitStatus: 'pending', submitted: false });
    setSaved(true);

    if (isDemo) {
      setSubmitStatus('local_only');
      return;
    }

    void (async () => {
      const result = await submitCftSession({
        session: finalized,
        trials,
        demographics: demographics as unknown as Record<string, unknown>,
      });
      setSubmitStatus(result.submitStatus);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  const goResults = () => {
    if (administrationMode === 'supervised_clinical') setPhase('clinical_results');
    else if (administrationMode === 'research') setPhase('debrief');
    else setPhase('locked');
  };

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page cft-page">
        <h1 className="game-title">{copy.productName}</h1>
        <BrandLine />
        <ExperimentalBanner />
        {isDemo && (
          <p className="hl-demo-badge" role="status">
            Demo protocol finished.
          </p>
        )}
        {inBattery && !isDemo && (
          <p className="hl-demo-badge" role="status">
            Battery task finished — continue to the next task when ready.
          </p>
        )}
        {completionStatus === 'withdrawn' ? (
          <p className="subtitle">You withdrew before finishing. No scored session was locked.</p>
        ) : (
          <>
            <p className="subtitle">{copy.completionThanks}</p>
            <p>{copy.completionExplain}</p>
          </>
        )}
        <p className="cft-muted">
          No diagnosis, impairment label, IQ comparison, or percentile rank is provided.
        </p>
        {submitStatus === 'submitted' && (
          <p className="cft-muted">Session saved to the research server.</p>
        )}
        {submitStatus === 'local_only' && !skipPostFlow && (
          <p className="cft-muted">
            Session saved on this device only (no API configured). Export from results if needed.
          </p>
        )}
        {submitStatus === 'failed' && (
          <p className="cft-warn" role="status">
            Server save failed. A local copy remains on this device — you can export from results.
          </p>
        )}
        {submitStatus === 'pending' && <p className="cft-muted">Saving…</p>}

        <BatteryContinue />

        {saved && !skipPostFlow && administrationMode !== 'public' && (
          <button type="button" onClick={goResults}>
            {administrationMode === 'supervised_clinical'
              ? 'Open clinical results'
              : 'Open research dashboard'}
          </button>
        )}
        {saved && !skipPostFlow && administrationMode === 'public' && (
          <button type="button" onClick={() => setPhase('locked')}>
            Done
          </button>
        )}
        <HubLink />
      </div>
    </ThemeShell>
  );
}
