import { useEffect, useRef, useState } from 'react';
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
  const [submitted, setSubmitted] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const submittedOnceRef = useRef(false);

  if (!participant) {
    navigate('/');
    return null;
  }

  const summary = computeSummary(trials);

  async function doSubmit() {
    const p = participant;
    if (!p) return;
    setSubmitError(null);
    if (isBackendConfigured()) {
      setSubmitting(true);
      try {
        await submitToBackend(p, summary, copyResult ?? null);
        setSubmitted(true);
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : 'Failed to submit');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (isSheetSubmitConfigured()) {
      submitToGoogleSheet(p, summary, copyResult ?? null);
      setParticipant(null);
      setTrials([]);
      setCopyResult(null);
      navigate('/');
    } else {
      openFormInNewTab(p, summary);
      setParticipant(null);
      setTrials([]);
      setCopyResult(null);
      navigate('/');
    }
  }

  useEffect(() => {
    if (submittedOnceRef.current || !participant) return;
    if (!isBackendConfigured()) return;
    submittedOnceRef.current = true;
    doSubmit();
  }, [participant, trials, copyResult]);

  function handleTakeTestAgain() {
    setParticipant(null);
    setTrials([]);
    setCopyResult(null);
    navigate('/');
  }

  const dateStr = new Date(participant.timestamp).toLocaleString();
  const memoryPoints = summary.memoryPoints ?? 0;
  const highestLevel = summary.highestLevelPassed ?? 0;

  return (
    <div className="page">
      <h1>Thank you for completing the test</h1>

      <div className="results-section">
        <p><strong>Your score:</strong> {memoryPoints} / 31 memory points</p>
        <p><strong>Highest level passed:</strong> {highestLevel}</p>
      </div>

      <details
        className="results-details"
        open={detailsOpen}
        onToggle={(e) => setDetailsOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary>See detailed results</summary>
        <div className="results-section">
          <h3>Your information</h3>
          <p><strong>Name:</strong> {participant.name}</p>
          <p><strong>Age:</strong> {participant.age}</p>
          <p><strong>Gender:</strong> {participant.gender}</p>
          <p><strong>Education:</strong> {participant.education}</p>
          <p><strong>Date:</strong> {dateStr}</p>
        </div>
        <div className="results-section">
          <h3>Memory test</h3>
          <p><strong>Memory points:</strong> {memoryPoints} / 31</p>
          <p><strong>Highest level passed:</strong> {highestLevel}</p>
          <p><strong>Overall accuracy:</strong> {(summary.overallAccuracyPercent ?? 0).toFixed(1)}%</p>
          <p><strong>Mean reaction time:</strong> {Math.round(summary.meanReactionTimeMs ?? 0)} ms</p>
        </div>
        <div className="results-section">
          <h3>Copy task</h3>
          <p><strong>Copy score:</strong> {copyResult != null ? `${copyResult.score} / 16` : '—'}</p>
          <p><strong>Time:</strong> {copyResult ? `${(copyResult.timeMs / 1000).toFixed(1)} s` : '—'}</p>
        </div>
      </details>

      {submitError && <p className="form-error" style={{ marginTop: '1rem' }}>{submitError}</p>}

      <div className="results-actions">
        {submitted ? (
          <p className="results-success">Your results have been saved. Thank you for participating.</p>
        ) : submitting ? (
          <p className="results-saving">Saving your results…</p>
        ) : submitError && isBackendConfigured() ? (
          <button onClick={doSubmit}>Retry</button>
        ) : !isBackendConfigured() ? (
          <button onClick={doSubmit}>Submit results to study</button>
        ) : null}
        <button type="button" className="secondary link-style" onClick={handleTakeTestAgain}>
          Take the test again
        </button>
      </div>
    </div>
  );
}
