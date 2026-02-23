import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppState';
import { computeSummary } from '../lib/summary';
import { openFormInNewTab } from '../lib/formUrl';
import { isBackendConfigured, isSheetSubmitConfigured, submitToBackend, submitToGoogleSheet } from '../lib/submitToSheet';

export default function Results() {
  const navigate = useNavigate();
  const { participant, trials, copyResult, setTrials, setCopyResult, setParticipant } = useAppState();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!participant) {
    navigate('/');
    return null;
  }

  const summary = computeSummary(trials);

  function handleDownloadJSON() {
    if (!participant) return;
    const data = { participant, trials, copyResult };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-test-${participant.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadCSV() {
    if (!participant) return;
    const headers = [
      'participantId', 'level', 'trialIndex', 'gridIndex', 'correctPlacements',
      'commissionErrors', 'wrongShapeInTarget', 'omissionErrors', 'accuracyPercent', 'reactionTimeMs', 'trialCorrectBinary',
    ];
    const rows = trials.map((t) =>
      [t.participantId, t.level, t.trialIndex, t.gridIndex, t.correctPlacements,
        t.commissionErrors, t.wrongShapeInTarget ?? 0, t.omissionErrors, (t.accuracyPercent ?? 0).toFixed(1), t.reactionTimeMs, t.trialCorrectBinary].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-test-${participant.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmitToStudy() {
    if (!participant) return;
    setSubmitError(null);
    if (isBackendConfigured()) {
      setSubmitting(true);
      try {
        await submitToBackend(participant, summary, copyResult ?? null);
        setParticipant(null);
        setTrials([]);
        setCopyResult(null);
        navigate('/');
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : 'Failed to submit');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (isSheetSubmitConfigured()) {
      submitToGoogleSheet(participant, summary, copyResult ?? null);
      setParticipant(null);
      setTrials([]);
      setCopyResult(null);
      navigate('/');
    } else {
      openFormInNewTab(participant, summary);
      setParticipant(null);
      setTrials([]);
      setCopyResult(null);
      navigate('/');
    }
  }

  function handleTakeTestAgain() {
    setTrials([]);
    setCopyResult(null);
    navigate('/intro');
  }

  const dateStr = new Date(participant.timestamp).toLocaleString();

  return (
    <div className="page">
      <h1>Results</h1>
      <div className="results-section">
        <h3>Your information</h3>
        <p><strong>Name:</strong> {participant.name}</p>
        <p><strong>Age:</strong> {participant.age}</p>
        <p><strong>Gender:</strong> {participant.gender}</p>
        <p><strong>Date:</strong> {dateStr}</p>
      </div>
      <div className="results-section">
        <h3>Memory test</h3>
        <p><strong>Memory points:</strong> {summary.memoryPoints ?? 0} / 31</p>
        <p><strong>Highest level passed:</strong> {summary.highestLevelPassed ?? 0}</p>
        <p><strong>Overall accuracy:</strong> {(summary.overallAccuracyPercent ?? 0).toFixed(1)}%</p>
        <p><strong>Mean reaction time:</strong> {Math.round(summary.meanReactionTimeMs ?? 0)} ms</p>
      </div>
      <div className="results-section">
        <h3>Copy task</h3>
        <p><strong>Copy score:</strong> {copyResult != null ? `${copyResult.score} / 16` : '—'}</p>
        <p><strong>Time:</strong> {copyResult ? `${(copyResult.timeMs / 1000).toFixed(1)} s` : '—'}</p>
      </div>
      <div className="results-section">
        <h3>Comparison</h3>
        <p>Normative comparison not available yet. This tool requires a larger validation sample.</p>
      </div>
      {submitError && <p className="form-error" style={{ marginTop: '1rem' }}>{submitError}</p>}
      <div className="results-actions">
        <button onClick={handleSubmitToStudy} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit results to study'}
        </button>
        <button onClick={handleTakeTestAgain}>Take the test again</button>
        <button className="secondary" onClick={handleDownloadJSON}>Download results as JSON</button>
        <button className="secondary" onClick={handleDownloadCSV}>Download results as CSV</button>
      </div>
    </div>
  );
}
