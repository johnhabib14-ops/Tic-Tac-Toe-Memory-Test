import { useMemo, useState } from 'react';
import { useCFTState } from '../CFTState';
import { getInstructions } from '../config/instructions';
import {
  downloadText,
  exportJson,
  exportSessionCsv,
  exportTrialsCsv,
  dataDictionary,
} from '../lib/DataExporter';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';
import HubLink from '../../components/brand/HubLink';

export default function ClinicalResults() {
  const {
    buildSessionRecord,
    trials,
    examinerNotes,
    setExaminerNotes,
    setSessionLocked,
    setPhase,
    visualMode,
    accessibility,
    sessionLocked,
  } = useCFTState();
  const copy = getInstructions(visualMode);
  const session = useMemo(() => buildSessionRecord(), [buildSessionRecord]);
  const [showTrials, setShowTrials] = useState(false);
  const c = session.provisionalScore?.components;
  const archiveHint =
    typeof localStorage !== 'undefined'
      ? (() => {
          try {
            const raw = localStorage.getItem('cft_session_archive_v1');
            if (!raw) return null;
            const list = JSON.parse(raw) as Array<{
              session: { sessionId: string };
              submitStatus?: string;
            }>;
            return list.find((e) => e.session.sessionId === session.sessionId)?.submitStatus ?? null;
          } catch {
            return null;
          }
        })()
      : null;

  const lock = () => {
    setSessionLocked(true);
    setPhase('locked');
  };

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page cft-page cft-results">
        <h1 className="game-title">Clinical results</h1>
        <BrandLine />
        <ExperimentalBanner compact />
        {archiveHint === 'failed' && (
          <p className="cft-warn" role="status">
            Server save failed earlier; local archive is available for export.
          </p>
        )}
        {archiveHint === 'local_only' && (
          <p className="cft-muted">Stored locally only (no API configured).</p>
        )}
        {archiveHint === 'submitted' && (
          <p className="cft-muted">Also saved to the research server.</p>
        )}

        <section className="cft-score-panel">
          <h2>Provisional Cognitive Flexibility Score</h2>
          <p className="cft-cfs">
            {session.provisionalScore?.cognitiveFlexibilityScore ?? '—'}
          </p>
          <p className="cft-muted">
            {session.provisionalScore?.scoringVersion} / {session.provisionalScore?.weightsId}
          </p>
        </section>

        <section>
          <h2>Component scores</h2>
          <ul className="cft-device-list">
            <li>Switch accuracy: {fmt(c?.switchAccuracy)}</li>
            <li>Stay accuracy: {fmt(c?.stayAccuracy)}</li>
            <li>Switch cost RT (ms): {fmtNum(c?.switchCostRtMs)}</li>
            <li>Switch cost accuracy: {fmt(c?.switchCostAccuracy)}</li>
            <li>Perseverative error rate: {fmt(c?.perseverativeErrorRate)}</li>
            <li>Rule-maintenance error rate: {fmt(c?.ruleMaintenanceErrorRate)}</li>
            <li>Cue-processing error rate: {fmt(c?.cueProcessingErrorRate)}</li>
            <li>Conflict accuracy: {fmt(c?.conflictAccuracy)}</li>
            <li>Omission error rate: {fmt(c?.omissionErrorRate)}</li>
            <li>Mean correct RT (ms): {fmtNum(c?.meanCorrectRtMs)}</li>
            <li>RT CV: {fmt(c?.rtCv)}</li>
            <li>Post-error recovery: {fmt(c?.postErrorRecovery)}</li>
            <li>High-interference accuracy: {fmt(c?.highInterferenceAccuracy)}</li>
          </ul>
        </section>

        <section>
          <h2>Blocks</h2>
          <ul className="cft-device-list">
            {session.blockSummaries.map((b) => (
              <li key={b.blockType}>
                {b.blockType}: acc {fmt(b.accuracy)}, switch {fmt(b.switchAccuracy)}, stay{' '}
                {fmt(b.stayAccuracy)}, mean RT {fmtNum(b.meanCorrectRtMs)}, n={b.trialCount}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Timing & validity</h2>
          <p>Timing quality: {session.timingQuality}</p>
          <ul className="cft-device-list">
            {session.validityFlags
              .filter((f) => f.triggered)
              .map((f) => (
                <li key={f.code}>{f.message}</li>
              ))}
            {session.validityFlags.every((f) => !f.triggered) && (
              <li>No validity flags triggered.</li>
            )}
          </ul>
        </section>

        <section>
          <h2>Examiner notes</h2>
          <textarea
            className="cft-notes"
            value={examinerNotes}
            disabled={sessionLocked}
            onChange={(e) => setExaminerNotes(e.target.value)}
            rows={4}
          />
        </section>

        <section>
          <button type="button" className="cft-secondary" onClick={() => setShowTrials((v) => !v)}>
            {showTrials ? 'Hide' : 'Show'} trial inspector
          </button>
          {showTrials && (
            <div className="cft-trial-table-wrap">
              <table className="cft-trial-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Block</th>
                    <th>Rule</th>
                    <th>Switch</th>
                    <th>Cong</th>
                    <th>Exp</th>
                    <th>Act</th>
                    <th>Err</th>
                    <th>Acc</th>
                    <th>RT</th>
                  </tr>
                </thead>
                <tbody>
                  {trials.map((t) => (
                    <tr key={`${t.blockId}-${t.trialNumber}`}>
                      <td>{t.trialNumber}</td>
                      <td>{t.blockType}</td>
                      <td>{t.rule}</td>
                      <td>{t.isSwitch ? 'Y' : 'N'}</td>
                      <td>{t.congruency}</td>
                      <td>{t.expectedResponse}</td>
                      <td>{t.actualResponse}</td>
                      <td>{t.errorType ?? ''}</td>
                      <td>{t.accuracy}</td>
                      <td>{t.reactionTimeMs ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="cft-export-row">
          <button
            type="button"
            onClick={() =>
              downloadText(
                `cft_session_${session.sessionId}.csv`,
                exportSessionCsv([session]),
                'text/csv'
              )
            }
          >
            Export session CSV
          </button>
          <button
            type="button"
            onClick={() =>
              downloadText(
                `cft_trials_${session.sessionId}.csv`,
                exportTrialsCsv(trials),
                'text/csv'
              )
            }
          >
            Export trials CSV
          </button>
          <button
            type="button"
            onClick={() =>
              downloadText(
                `cft_session_${session.sessionId}.json`,
                exportJson(session, trials),
                'application/json'
              )
            }
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() =>
              downloadText(
                'cft_data_dictionary.json',
                JSON.stringify(dataDictionary(), null, 2),
                'application/json'
              )
            }
          >
            Data dictionary
          </button>
        </div>

        <p className="cft-muted">{copy.completionExplain}</p>

        {!sessionLocked && (
          <button type="button" onClick={lock}>
            Lock session
          </button>
        )}
        <button type="button" className="cft-secondary" onClick={() => setPhase('debrief')}>
          Back to debrief
        </button>
        <HubLink />
      </div>
    </ThemeShell>
  );
}

function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toFixed(3);
}

function fmtNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return Math.round(n).toString();
}
