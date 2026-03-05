import { useState } from 'react';
import { useGMT22State } from '../GMT22State';
import { computeGMT22Summary } from '../lib/summary';
import {
  buildGMT22Payload,
  submitGMT22,
  isGMT22BackendConfigured,
  GMT22SubmitError,
} from '../lib/submitGmt22';
import { getConditionOrder } from '../types';
import type { GMT22Condition } from '../types';
import { COPY_NUM_TARGETS } from '../types';

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

  const conditionOrder = getConditionOrder(participant.condition_order);

  const totalTargets = memoryTrials.reduce((s, t) => s + t.total_targets, 0);
  const totalHits = memoryTrials.reduce((s, t) => s + t.hits, 0);
  const overallPct =
    totalTargets > 0 ? ((totalHits / totalTargets) * 100).toFixed(1) : null;

  async function handleSubmit() {
    if (!isGMT22BackendConfigured()) return;
    if (!participant) return;
    if (submitting || submitted) return;
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
      if (e instanceof Error) console.error('Submit error:', e.message, e);
      else console.error('Submit error:', e);
      const message = e instanceof GMT22SubmitError && e.status === 409
        ? 'Results were already submitted for this session.'
        : e instanceof GMT22SubmitError && e.status === 502
          ? 'Could not save results. Please try again or contact the researcher.'
          : e instanceof GMT22SubmitError && e.status === 500
            ? 'Server error. Please try again later.'
            : e instanceof Error && (e.message.includes('VITE_API_URL') || e.message.includes('not set'))
              ? 'Submission is not configured.'
              : e instanceof Error && (e.message.includes('Network') || e.message.includes('fetch'))
                ? 'Connection error. Check your connection and try again.'
                : 'Submission failed. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="results-card">
        <h1 className="results-title" style={{ whiteSpace: 'nowrap' }}>
          Thank you for completing GMT 2
        </h1>
        <p className="subtitle" style={{ marginTop: '0.25rem', marginBottom: '0.25rem', fontWeight: 600 }}>
          {overallPct != null ? `Overall: ${overallPct}% accuracy` : 'Overall: —'}
        </p>
        <p className="subtitle" style={{ marginTop: 0, marginBottom: '1rem' }}>
          This task measures visual–spatial memory span under different task demands.
        </p>

        {isGMT22BackendConfigured() && (
          <div style={{ marginBottom: '1.5rem' }}>
            {submitError && <p className="form-error">{submitError}</p>}
            {submitted ? (
              <p>Your responses have been submitted.</p>
            ) : (
              <>
                <p className="subtitle" style={{ marginBottom: '0.5rem' }}>
                  Please submit your results to complete the task.
                </p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit results'}
                </button>
              </>
            )}
          </div>
        )}

        <div className="results-score-block">
          <h3>Copy</h3>
          <p>Hits: {copyResult?.copy_hits ?? 0} / {COPY_NUM_TARGETS}</p>
          <p>Time: {copyResult != null ? (copyResult.copy_total_rt_ms / 1000).toFixed(1) : '—'} seconds</p>
        </div>

        <div className="results-score-block">
          <h3>Memory</h3>
          {conditionOrder.map((condition, idx) => {
            const c = summary.by_condition[condition as GMT22Condition];
            if (!c) return null;
            return (
              <div key={condition} className="results-condition-row">
                <p><strong>Block {idx + 1}</strong></p>
                <p>Span: {c.span_estimate}</p>
                <p>Consistency: {c.span_consistency_flag ? 'Stable' : 'Boundary'}</p>
                <p>Mean Accuracy: {(c.mean_accuracy * 100).toFixed(1)}%</p>
                <p>Mean RT: {(c.mean_rt_ms / 1000).toFixed(1)}s</p>
              </div>
            );
          })}
        </div>

        <div className="results-score-block">
          <h3>Costs</h3>
          <p>Interference Cost: {summary.interference_cost}</p>
          <p>Binding Cost: {summary.binding_cost}</p>
          <p>Delay Cost: {summary.delay_cost}</p>
        </div>

        <div className="results-score-block">
          <h3>Participant</h3>
          <p>Participant ID: {participant.participant_id}</p>
          <p>Condition order: Order {summary.condition_order}</p>
        </div>
      </div>
    </div>
  );
}
