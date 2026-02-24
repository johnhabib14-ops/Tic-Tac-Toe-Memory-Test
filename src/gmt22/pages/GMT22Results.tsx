import { useState } from 'react';
import { useGMT22State } from '../GMT22State';
import { computeGMT22Summary } from '../lib/summary';
import {
  buildGMT22Payload,
  submitGMT22,
  isGMT22BackendConfigured,
} from '../lib/submitGmt22';
import { GMT22_CONDITIONS } from '../types';
import type { GMT22Condition } from '../types';
import { COPY_NUM_TARGETS } from '../types';

const CONDITION_LABELS: Record<string, string> = {
  baseline: 'Baseline',
  ignore_distractor: 'Ignore Distractor',
  remember_distractor: 'Remember Distractor',
  delay: 'Delay',
};

export default function GMT22Results() {
  const {
    participant,
    copyResult,
    memoryTrials,
    practiceTrials,
    practiceFailed,
    practicePassedFirstTry,
    attentionCheckFailed,
  } = useGMT22State();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!participant) return null;

  const summary = computeGMT22Summary(memoryTrials, {
    practice_failed: practiceFailed,
    practice_passed_first_try: practicePassedFirstTry,
    attention_check_failed: attentionCheckFailed,
    condition_order: participant.condition_order,
  });

  async function handleSubmit() {
    if (!isGMT22BackendConfigured()) {
      setSubmitError('Backend not configured (VITE_API_URL).');
      return;
    }
    if (!participant) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = buildGMT22Payload(
        participant,
        copyResult,
        memoryTrials,
        practiceTrials,
        summary
      );
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
        <h1 className="results-title">Thank you for completing GMT 2</h1>

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
          {GMT22_CONDITIONS.map((condition) => {
            const c = summary.by_condition[condition as GMT22Condition];
            if (!c) return null;
            return (
              <p key={condition}>
                <strong>{CONDITION_LABELS[condition] ?? condition}:</strong>{' '}
                Span estimate {c.span_estimate}, span consistency {c.span_consistency_flag ? 'yes' : 'no'}. Mean accuracy{' '}
                {(c.mean_accuracy * 100).toFixed(1)}%, Mean RT {(c.mean_rt_ms / 1000).toFixed(1)}s
              </p>
            );
          })}
        </div>

        <div className="results-score-block">
          <h3>Costs</h3>
          <p><strong>Interference cost:</strong> {summary.interference_cost}</p>
          <p><strong>Binding cost:</strong> {summary.binding_cost}</p>
          <p><strong>Delay cost:</strong> {summary.delay_cost}</p>
        </div>

        <div className="results-score-block">
          <h3>Participant</h3>
          <p><strong>Participant ID:</strong> {participant.participant_id}</p>
          <p><strong>Condition order:</strong> {summary.condition_order}</p>
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
