import { useMemo, useState } from 'react';
import { useRITState } from '../RITState';
import { getInstructions } from '../config/instructions';
import {
  downloadText,
  exportJson,
  exportSessionCsv,
  exportTrialsCsv,
  dataDictionary,
} from '../lib/DataExporter';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';

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
  } = useRITState();
  const copy = getInstructions(visualMode);
  const session = useMemo(() => buildSessionRecord(), [buildSessionRecord]);
  const [showTrials, setShowTrials] = useState(false);
  const c = session.provisionalScore?.components;
  const archiveHint =
    typeof localStorage !== 'undefined'
      ? (() => {
          try {
            const raw = localStorage.getItem('rit_session_archive_v1');
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
      <div className="page rit-page rit-results">
        <h1 className="game-title">Clinical results</h1>
        <BrandLine />
        <ExperimentalBanner />
        {archiveHint === 'failed' && (
          <p className="rit-warn" role="status">
            Server save failed earlier; local archive is available for export.
          </p>
        )}
        {archiveHint === 'local_only' && (
          <p className="rit-muted">Stored locally only (no API configured).</p>
        )}
        {archiveHint === 'submitted' && (
          <p className="rit-muted">Also saved to the research server.</p>
        )}
        <p className="rit-warn" role="note">
          Provisional experimental scores only. Not diagnostic or normed.
        </p>

        <section className="rit-score-panel">
          <h2>Provisional Inhibitory Control Score</h2>
          <p className="rit-ics">
            {session.provisionalScore?.inhibitoryControlScore ?? '—'}
          </p>
          <p className="rit-muted">
            {session.provisionalScore?.scoringVersion} / {session.provisionalScore?.weightsId}
          </p>
        </section>

        <section>
          <h2>Component scores</h2>
          <ul className="rit-device-list">
            <li>Commission error rate: {fmt(c?.commissionErrorRate)}</li>
            <li>Omission error rate: {fmt(c?.omissionErrorRate)}</li>
            <li>Mean correct RT (ms): {fmtNum(c?.meanCorrectRtMs)}</li>
            <li>Median correct RT (ms): {fmtNum(c?.medianCorrectRtMs)}</li>
            <li>RT SD (ms): {fmtNum(c?.rtSdMs)}</li>
            <li>RT CV: {fmt(c?.rtCv)}</li>
            <li>Anticipatory responses: {c?.anticipatoryCount ?? 0}</li>
            <li>Post-error slowing (ms): {fmtNum(c?.postErrorSlowingMs)}</li>
            <li>High-interference accuracy: {fmt(c?.highInterferenceAccuracy)}</li>
            <li>High-interference mean RT: {fmtNum(c?.highInterferenceMeanRtMs)}</li>
            <li>Speed–accuracy tradeoff indicator: {fmt(c?.speedAccuracyTradeoff)}</li>
          </ul>
        </section>

        <section>
          <h2>Blocks</h2>
          <ul className="rit-device-list">
            {session.blockSummaries.map((b) => (
              <li key={b.blockType}>
                {b.blockType}: acc {fmt(b.accuracy)}, mean RT {fmtNum(b.meanCorrectRtMs)}, n=
                {b.trialCount}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Timing & validity</h2>
          <p>Timing quality: {session.timingQuality}</p>
          <ul className="rit-device-list">
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
            className="rit-notes"
            value={examinerNotes}
            disabled={sessionLocked}
            onChange={(e) => setExaminerNotes(e.target.value)}
            rows={4}
          />
        </section>

        <section>
          <button type="button" className="rit-secondary" onClick={() => setShowTrials((v) => !v)}>
            {showTrials ? 'Hide' : 'Show'} trial inspector
          </button>
          {showTrials && (
            <div className="rit-trial-table-wrap">
              <table className="rit-trial-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Block</th>
                    <th>Go/NoGo</th>
                    <th>Exp</th>
                    <th>Act</th>
                    <th>Acc</th>
                    <th>RT</th>
                  </tr>
                </thead>
                <tbody>
                  {trials.map((t) => (
                    <tr key={`${t.blockId}-${t.trialNumber}`}>
                      <td>{t.trialNumber}</td>
                      <td>{t.blockType}</td>
                      <td>{t.goNoGo}</td>
                      <td>{t.expectedResponse}</td>
                      <td>{t.actualResponse}</td>
                      <td>{t.accuracy}</td>
                      <td>{t.reactionTimeMs ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="rit-export-row">
          <button
            type="button"
            onClick={() =>
              downloadText(
                `rit_session_${session.sessionId}.csv`,
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
                `rit_trials_${session.sessionId}.csv`,
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
                `rit_${session.sessionId}.json`,
                exportJson(session, trials),
                'application/json'
              )
            }
          >
            Export JSON
          </button>
          <button
            type="button"
            className="rit-secondary"
            onClick={() =>
              downloadText(
                'rit_data_dictionary.json',
                JSON.stringify(dataDictionary(), null, 2),
                'application/json'
              )
            }
          >
            Data dictionary
          </button>
        </div>

        <p className="rit-muted">{copy.productName} — examiner view</p>
        {!sessionLocked && (
          <button type="button" onClick={lock}>
            Lock session
          </button>
        )}
        <button type="button" className="rit-secondary" onClick={() => setPhase('session_replay')}>
          Session replay (dev)
        </button>
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
