import { useMemo, useState } from 'react';
import { useRITState } from '../RITState';
import { loadArchive, clearArchive, type ArchivedSession } from '../lib/sessionArchive';
import {
  downloadText,
  exportSessionCsv,
  exportTrialsCsv,
  exportJson,
  dataDictionary,
} from '../lib/DataExporter';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';

export default function ResearchDashboard() {
  const { setPhase, visualMode, accessibility, resetSession } = useRITState();
  const [archive, setArchive] = useState<ArchivedSession[]>(() => loadArchive());
  const [versionFilter, setVersionFilter] = useState('all');

  const filtered = useMemo(() => {
    if (versionFilter === 'all') return archive;
    return archive.filter((a) => a.session.taskVersion === versionFilter);
  }, [archive, versionFilter]);

  const versions = useMemo(
    () => Array.from(new Set(archive.map((a) => a.session.taskVersion))),
    [archive]
  );

  const stats = useMemo(() => {
    const n = filtered.length;
    const completed = filtered.filter((a) => a.session.completionStatus === 'completed').length;
    const valid = filtered.filter((a) => a.session.validityFlags.every((f) => !f.triggered)).length;
    const scores = filtered
      .map((a) => a.session.provisionalScore?.inhibitoryControlScore)
      .filter((s): s is number => s != null);
    const commissions = filtered
      .map((a) => a.session.secondaryScores?.commissionErrorRate)
      .filter((s): s is number => s != null);
    const omissions = filtered
      .map((a) => a.session.secondaryScores?.omissionErrorRate)
      .filter((s): s is number => s != null);
    const rts = filtered
      .map((a) => a.session.secondaryScores?.meanCorrectRtMs)
      .filter((s): s is number => s != null);
    const devices: Record<string, number> = {};
    const visualModes: Record<string, number> = {};
    for (const a of filtered) {
      const d = a.session.device.deviceType;
      devices[d] = (devices[d] ?? 0) + 1;
      const vm = a.session.visualMode;
      visualModes[vm] = (visualModes[vm] ?? 0) + 1;
    }
    const blockAcc: Record<string, number[]> = {};
    for (const a of filtered) {
      for (const b of a.session.blockSummaries) {
        if (!blockAcc[b.blockType]) blockAcc[b.blockType] = [];
        blockAcc[b.blockType].push(b.accuracy);
      }
    }
    return {
      n,
      completionRate: n ? completed / n : 0,
      validityRate: n ? valid / n : 0,
      meanIcs: mean(scores),
      meanCommission: mean(commissions),
      meanOmission: mean(omissions),
      meanRt: mean(rts),
      devices,
      visualModes,
      blockAcc,
      scoreDist: scores,
    };
  }, [filtered]);

  const exportAll = () => {
    const sessions = filtered.map((a) => a.session);
    const trials = filtered.flatMap((a) => a.trials);
    downloadText('rit_sessions.csv', exportSessionCsv(sessions), 'text/csv');
    downloadText('rit_trials.csv', exportTrialsCsv(trials), 'text/csv');
    if (filtered[0]) {
      downloadText(
        'rit_bundle.json',
        JSON.stringify(
          filtered.map((a) => JSON.parse(exportJson(a.session, a.trials))),
          null,
          2
        ),
        'application/json'
      );
    }
  };

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page rit-page rit-results">
        <h1 className="game-title">Research dashboard</h1>
        <BrandLine />
        <ExperimentalBanner />
        <p className="subtitle">Local archive of completed sessions (v0.1). Not a multi-site server.</p>

        <label className="rit-field">
          Task version filter
          <select value={versionFilter} onChange={(e) => setVersionFilter(e.target.value)}>
            <option value="all">All</option>
            {versions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <ul className="rit-device-list">
          <li>Participant sessions: {stats.n}</li>
          <li>Completion rate: {(stats.completionRate * 100).toFixed(1)}%</li>
          <li>Validity rate (no flags): {(stats.validityRate * 100).toFixed(1)}%</li>
          <li>Mean provisional ICS: {stats.meanIcs?.toFixed(1) ?? '—'}</li>
          <li>Mean commission rate: {stats.meanCommission?.toFixed(3) ?? '—'}</li>
          <li>Mean omission rate: {stats.meanOmission?.toFixed(3) ?? '—'}</li>
          <li>Mean correct RT (ms): {stats.meanRt?.toFixed(0) ?? '—'}</li>
        </ul>

        <h2>Device breakdown</h2>
        <ul className="rit-device-list">
          {Object.entries(stats.devices).map(([k, v]) => (
            <li key={k}>
              {k}: {v}
            </li>
          ))}
          {!Object.keys(stats.devices).length && <li>No sessions yet.</li>}
        </ul>

        <h2>Visual mode breakdown</h2>
        <ul className="rit-device-list">
          {Object.entries(stats.visualModes).map(([k, v]) => (
            <li key={k}>
              {k}: {v}
            </li>
          ))}
          {!Object.keys(stats.visualModes).length && <li>No sessions yet.</li>}
        </ul>

        <h2>Block-level mean accuracy</h2>
        <ul className="rit-device-list">
          {Object.entries(stats.blockAcc).map(([k, vals]) => (
            <li key={k}>
              {k}: {mean(vals)?.toFixed(3) ?? '—'} (n={vals.length})
            </li>
          ))}
          {!Object.keys(stats.blockAcc).length && <li>No block summaries yet.</li>}
        </ul>

        <h2>Score distribution (provisional ICS)</h2>
        <p className="rit-muted">
          {stats.scoreDist.length
            ? stats.scoreDist
                .slice()
                .sort((a, b) => a - b)
                .join(', ')
            : 'No scores'}
        </p>

        <div className="rit-export-row">
          <button type="button" onClick={exportAll}>
            Export filtered CSV/JSON
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
          <button
            type="button"
            className="rit-secondary"
            onClick={() => {
              clearArchive();
              setArchive([]);
            }}
          >
            Clear local archive
          </button>
          <button type="button" className="rit-secondary" onClick={() => setArchive(loadArchive())}>
            Refresh
          </button>
        </div>

        <button type="button" onClick={() => setPhase('session_replay')}>
          Session replay (dev)
        </button>
        <button type="button" className="rit-secondary" onClick={() => resetSession()}>
          New session
        </button>
      </div>
    </ThemeShell>
  );
}

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
