import { useState } from 'react';
import { useGMT2State } from '../GMT2State';
import { computeGMT2Summary } from '../lib/summary';
import {
  buildGMT2Payload,
  submitGMT2,
  isGMT2BackendConfigured,
} from '../lib/submitGmt2';
import { GMT2_CONDITIONS } from '../types';

const CONDITION_LABELS: Record<string, string> = {
  baseline: 'Baseline',
  ignore_distractor: 'Ignore Distractor',
  remember_distractor: 'Remember Distractor',
  delay: 'Delay',
};

export default function GMT2Results() {
  const { participant, copyResult, memoryTrials } = useGMT2State();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!participant) return null;

  const summary = computeGMT2Summary(memoryTrials);

  async function handleSubmit() {
    if (!isGMT2BackendConfigured()) {
      setSubmitError('Backend not configured (VITE_API_URL).');
      return;
    }
    if (!participant) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = buildGMT2Payload(participant, copyResult, memoryTrials, summary);
      await submitGMT2(payload);
      setSubmitted(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="results-card">
        <h1 className="results-title">Thank you for completing GMT 2.1</h1>

        <div className="results-score-block">
          <h3>Copy</h3>
          <p>
            Correct: {copyResult?.copy_hits ?? 0} out of 6
          </p>
          <p>
            Time: {copyResult != null ? (copyResult.copy_total_rt_ms / 1000).toFixed(1) : '—'} seconds
          </p>
        </div>

        <div className="results-score-block">
          <h3>Memory</h3>
          {GMT2_CONDITIONS.map((condition) => (
            <p key={condition}>
              <strong>{CONDITION_LABELS[condition] ?? condition}:</strong>{' '}
              Mean accuracy {(summary.mean_accuracy_per_condition[condition] * 100).toFixed(1)}%,{' '}
              Mean RT {(summary.mean_rt_per_condition[condition] / 1000).toFixed(1)}s
            </p>
          ))}
        </div>

        <div className="results-score-block">
          <h3>Overall</h3>
          <p>Total trials completed: {memoryTrials.length}</p>
        </div>

        {isGMT2BackendConfigured() && (
          <>
            {submitError && <p className="form-error">{submitError}</p>}
            {submitted ? (
              <p>Your responses have been submitted.</p>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit results'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
