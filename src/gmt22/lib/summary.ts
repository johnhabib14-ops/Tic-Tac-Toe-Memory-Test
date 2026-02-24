import type {
  GMT22MemoryTrialRecord,
  GMT22Summary,
  GMT22Condition,
  GMT22ConditionSummary,
} from '../types';
import { GMT22_CONDITIONS } from '../types';

function getTrialsByCondition(trials: GMT22MemoryTrialRecord[]): Map<GMT22Condition, GMT22MemoryTrialRecord[]> {
  const map = new Map<GMT22Condition, GMT22MemoryTrialRecord[]>();
  for (const c of GMT22_CONDITIONS) map.set(c, []);
  for (const t of trials) map.get(t.condition)!.push(t);
  return map;
}

function computeConditionSummary(
  _condition: GMT22Condition,
  conditionTrials: GMT22MemoryTrialRecord[]
): GMT22ConditionSummary {
  const start_span = 2;
  if (conditionTrials.length === 0) {
    return {
      start_span,
      span_estimate: 0,
      span_reached: 0,
      discontinued_at_span: null,
      trials_completed_count: 0,
      mean_accuracy: 0,
      mean_rt_ms: 0,
      total_commissions: 0,
      span_consistency_flag: false,
    };
  }
  const spans = [...new Set(conditionTrials.map((t) => t.span))].sort((a, b) => a - b);
  const span_reached = Math.max(...spans);
  let span_estimate = 0;
  for (const s of spans) {
    const atSpan = conditionTrials.filter((t) => t.span === s);
    if (atSpan.some((t) => t.passed)) span_estimate = s;
  }
  const atSpanEstimate = conditionTrials.filter((t) => t.span === span_estimate);
  const span_consistency_flag =
    span_estimate > 0 && atSpanEstimate.length >= 2 && atSpanEstimate.every((t) => t.passed);
  const lastSpanTrials = conditionTrials.filter((t) => t.span === span_reached);
  const discontinued_at_span =
    span_reached < 7 && lastSpanTrials.length >= 2 && lastSpanTrials.every((t) => !t.passed)
      ? span_reached
      : null;
  const n = conditionTrials.length;
  const mean_accuracy = n > 0 ? conditionTrials.reduce((a, t) => a + t.accuracy_raw, 0) / n : 0;
  const mean_rt_ms = n > 0 ? conditionTrials.reduce((a, t) => a + t.recon_rt_ms, 0) / n : 0;
  const total_commissions = conditionTrials.reduce((a, t) => a + t.commissions, 0);
  return {
    start_span,
    span_estimate,
    span_reached,
    discontinued_at_span,
    trials_completed_count: n,
    mean_accuracy,
    mean_rt_ms,
    total_commissions,
    span_consistency_flag,
  };
}

export function computeGMT22Summary(
  trials: GMT22MemoryTrialRecord[],
  options: {
    memory_early_stopped?: boolean;
    practice_failed?: boolean;
    practice_passed_first_try?: boolean;
    attention_check_failed?: boolean;
    pairing_fallback_used?: boolean;
  } = {}
): GMT22Summary {
  const byCondition = getTrialsByCondition(trials);

  const by_condition: Record<GMT22Condition, GMT22ConditionSummary> = {
    baseline: computeConditionSummary('baseline', byCondition.get('baseline') ?? []),
    ignore_distractor: computeConditionSummary(
      'ignore_distractor',
      byCondition.get('ignore_distractor') ?? []
    ),
    remember_distractor: computeConditionSummary(
      'remember_distractor',
      byCondition.get('remember_distractor') ?? []
    ),
    delay: computeConditionSummary('delay', byCondition.get('delay') ?? []),
  };

  const n = trials.length;
  const totalAccuracy = trials.reduce((a, t) => a + t.accuracy_raw, 0);
  const totalRt = trials.reduce((a, t) => a + t.recon_rt_ms, 0);
  const totalCommissions = trials.reduce((a, t) => a + t.commissions, 0);

  return {
    by_condition,
    global_accuracy: n > 0 ? totalAccuracy / n : 0,
    global_mean_rt_ms: n > 0 ? totalRt / n : 0,
    global_total_commissions: totalCommissions,
    memory_early_stopped: options.memory_early_stopped ?? false,
    practice_failed: options.practice_failed ?? false,
    practice_passed_first_try: options.practice_passed_first_try ?? false,
    attention_check_failed: options.attention_check_failed ?? false,
    pairing_fallback_used: options.pairing_fallback_used ?? false,
  };
}
