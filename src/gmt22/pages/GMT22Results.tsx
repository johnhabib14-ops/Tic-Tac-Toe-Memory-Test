import { useState } from 'react';
import { useGMT22State } from '../GMT22State';
import { computeGMT22Summary } from '../lib/summary';
import {
  buildGMT22Payload,
  submitGMT22,
  isGMT22BackendConfigured,
} from '../lib/submitGmt22';
import { getPairingFallbackUsed } from '../lib/memoryTask';
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
    memoryEarlyStopped,
    attentionCheckFailed,
  } = useGMT22State();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!participant) return null;

  const summary = computeGMT22Summary(memoryTrials, {
    memory_early_stopped: memoryEarlyStopped,
    practice_failed: practiceFailed,
    practice_passed_first_try: practicePassedFirstTry,
    attention_check_failed: attentionCheckFailed,
    pairing_fallback_used: getPairingFallbackUsed(),
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

  const accuracyPercent = (summary.global_accuracy * 100).toFixed(1);

  return (
    <div className="page">
      <div className="results-card">
        <h1 className="results-title">Thank you for completing GMT 2</h1>
        <div className="results-accuracy" aria-label={`Overall accuracy: ${accuracyPercent}%`}>
          <span className="results-accuracy-value">{accuracyPercent}%</span>
          <span className="results-accuracy-label">Overall accuracy</span>
        </div>

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
                Start span {c.start_span}, span estimate {c.span_estimate}. Mean accuracy{' '}
                {(c.mean_accuracy * 100).toFixed(1)}%, Mean RT {(c.mean_rt_ms / 1000).toFixed(1)}s,{' '}
                Total commissions {c.total_commissions}
                {c.discontinued_at_span != null &&
                  ` — Discontinued at span ${c.discontinued_at_span}`}
              </p>
            );
          })}
        </div>

        <div className="results-score-block">
          <h3>Overall</h3>
          <p><strong>Participant ID:</strong> {participant.participant_id}</p>
          <p>Total trials completed: {memoryTrials.length}</p>
          <p><strong>Overall accuracy:</strong> {(summary.global_accuracy * 100).toFixed(1)}%</p>
          <p><strong>Mean RT:</strong> {(summary.global_mean_rt_ms / 1000).toFixed(1)}s</p>
          <p><strong>Total commissions:</strong> {summary.global_total_commissions}</p>
          {summary.memory_early_stopped && (
            <p className="results-note">The memory task ended early.</p>
          )}
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
