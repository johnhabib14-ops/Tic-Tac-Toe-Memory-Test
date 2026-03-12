import { useEffect, useRef, useState } from 'react';
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
  const submittedOnceRef = useRef(false);

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

  useEffect(() => {
    if (!isGMT22BackendConfigured() || !participant || submittedOnceRef.current) return;
    submittedOnceRef.current = true;
    handleSubmit();
  }, [participant?.session_id]);

  const warmUpLine = copyResult != null
    ? `Warm up: ${copyResult.copy_hits}/${COPY_NUM_TARGETS} in ${(copyResult.copy_total_rt_ms / 1000).toFixed(0)}s`
    : 'Warm up: n/a';

  return (
    <div className="page">
      <div className="results-card">
        <h1 className="results-title">You did it!</h1>

        <div className="results-hero">
          <span className="results-hero-value" aria-label={`${overallPct ?? 'n/a'}% accuracy`}>
            {overallPct != null ? `${overallPct}%` : 'n/a'}
          </span>
          <span className="results-hero-label">Memory score</span>
        </div>

        <p className="results-summary-line">{warmUpLine}</p>

        {isGMT22BackendConfigured() && (
          <div style={{ marginBottom: '1.5rem' }}>
            {submitError && <p className="form-error">{submitError}</p>}
            {submitted ? (
              <p className="results-success">Your results are saved. Nice work!</p>
            ) : submitting ? (
              <p className="results-saving">Saving your results…</p>
            ) : submitError ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                Retry
              </button>
            ) : null}
          </div>
        )}

        <details className="results-details-collapse">
          <summary>More details</summary>
          <div className="results-score-block">
            <h3>Copy</h3>
            <p>Hits: {copyResult?.copy_hits ?? 0} / {COPY_NUM_TARGETS}</p>
            <p>Time: {copyResult != null ? (copyResult.copy_total_rt_ms / 1000).toFixed(1) : 'n/a'} seconds</p>
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
                  <p>Mean accuracy: {(c.mean_accuracy * 100).toFixed(1)}%</p>
                  <p>Mean RT: {(c.mean_rt_ms / 1000).toFixed(1)}s</p>
                </div>
              );
            })}
          </div>
          <div className="results-score-block">
            <h3>Costs</h3>
            <p>Interference cost: {summary.interference_cost}</p>
            <p>Binding cost: {summary.binding_cost}</p>
            <p>Delay cost: {summary.delay_cost}</p>
          </div>
          <div className="results-score-block">
            <h3>Participant</h3>
            <p>Participant ID: {participant.participant_id}</p>
            <p>Condition order: Order {summary.condition_order}</p>
          </div>
        </details>
      </div>
    </div>
  );
}
