import { useState } from 'react';
import { useGMT22State } from '../GMT22State';
import { computeGMT22Summary } from '../lib/summary';
import {
  buildGMT22Payload,
  submitGMT22,
  isGMT22BackendConfigured,
} from '../lib/submitGmt22';
import { GMT22_CONDITIONS } from '../types';
import { COPY_NUM_TARGETS } from '../types';

const CONDITION_LABELS: Record<string, string> = {
  baseline: 'Baseline',
  ignore_distractor: 'Ignore Distractor',
  remember_distractor: 'Remember Distractor',
  delay: 'Delay',
};

export default function GMT22Results() {
  const { participant, copyResult, memoryTrials } = useGMT22State();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!participant) return null;

  const summary = computeGMT22Summary(memoryTrials);

  async function handleSubmit() {
    if (!isGMT22BackendConfigured()) {
      setSubmitError('Backend not configured (VITE_API_URL).');
      return;
    }
    if (!participant) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = buildGMT22Payload(participant, copyResult, memoryTrials, summary);
      await submitGMT22(payload);
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
        <h1 className="results-title">Thank you for completing GMT 2.2</h1>

        <div className="results-score-block">
          <h3>Copy</h3>
          <p>
            Correct: {copyResult?.copy_hits ?? 0} out of {COPY_NUM_TARGETS}
          </p>
          <p>
            Time: {copyResult != null ? (copyResult.copy_total_rt_ms / 1000).toFixed(1) : '—'} seconds
          </p>
        </div>

        <div className="results-score-block">
          <h3>Memory</h3>
          {GMT22_CONDITIONS.map((condition) => (
            <p key={condition}>
              <strong>{CONDITION_LABELS[condition] ?? condition}:</strong>{' '}
              Mean accuracy {(summary.mean_accuracy_per_condition[condition] * 100).toFixed(1)}%,{' '}
              Mean RT {(summary.mean_rt_per_condition[condition] / 1000).toFixed(1)}s,{' '}
              Clean trial rate {(summary.clean_trial_rate_per_condition[condition] * 100).toFixed(1)}%
            </p>
          ))}
        </div>

        <div className="results-score-block">
          <h3>Overall</h3>
          <p><strong>Participant ID:</strong> {participant.participant_id}</p>
          <p>Total trials completed: {memoryTrials.length}</p>
          <p><strong>Overall accuracy:</strong> {(summary.global_accuracy * 100).toFixed(1)}%</p>
          <p><strong>Mean RT:</strong> {(summary.global_mean_rt / 1000).toFixed(1)}s</p>
          <p><strong>Clean trial rate:</strong> {(summary.global_clean_trial_rate * 100).toFixed(1)}%</p>
        </div>

        {isGMT22BackendConfigured() && (
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
