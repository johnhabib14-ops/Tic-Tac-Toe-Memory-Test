import type {
  GMT22MemoryTrialRecord,
  GMT22Summary,
  GMT22Condition,
  GMT22ConditionSummary,
  GMT22ConditionOrder,
} from '../types';
import { GMT22_CONDITIONS } from '../types';

function getTrialsByCondition(trials: GMT22MemoryTrialRecord[]): Map<GMT22Condition, GMT22MemoryTrialRecord[]> {
  const map = new Map<GMT22Condition, GMT22MemoryTrialRecord[]>();
  for (const c of GMT22_CONDITIONS) map.set(c, []);
  for (const t of trials) map.get(t.condition)!.push(t);
  return map;
}

function computeConditionSummary(conditionTrials: GMT22MemoryTrialRecord[]): GMT22ConditionSummary {
  if (conditionTrials.length === 0) {
    return { span_estimate: 0, span_consistency_flag: false, mean_accuracy: 0, mean_rt_ms: 0 };
  }
  const sorted = [...conditionTrials].sort((a, b) => a.span - b.span);
  const spans = [...new Set(sorted.map((t) => t.span))].sort((a, b) => a - b);
  let span_estimate = 0;
  for (const s of spans) {
    const atSpan = sorted.filter((t) => t.span === s);
    if (atSpan.some((t) => t.passed)) span_estimate = s;
  }
  const atSpanEstimate = sorted.filter((t) => t.span === span_estimate);
  const span_consistency_flag =
    span_estimate > 0 && atSpanEstimate.length >= 2 && atSpanEstimate.every((t) => t.passed);
  const n = sorted.length;
  const mean_accuracy = n > 0 ? sorted.reduce((a, t) => a + t.accuracy_raw, 0) / n : 0;
  const mean_rt_ms = n > 0 ? sorted.reduce((a, t) => a + t.recon_rt_ms, 0) / n : 0;
  return { span_estimate, span_consistency_flag, mean_accuracy, mean_rt_ms };
}

export function computeGMT22Summary(
  trials: GMT22MemoryTrialRecord[],
  options: {
    practice_failed?: boolean;
    practice_passed_first_try?: boolean;
    attention_check_failed?: boolean;
    condition_order: GMT22ConditionOrder;
  }
): GMT22Summary {
  const byCondition = getTrialsByCondition(trials);

  const by_condition: Record<GMT22Condition, GMT22ConditionSummary> = {
    baseline: computeConditionSummary(byCondition.get('baseline') ?? []),
    ignore_distractor: computeConditionSummary(byCondition.get('ignore_distractor') ?? []),
    remember_distractor: computeConditionSummary(byCondition.get('remember_distractor') ?? []),
    delay: computeConditionSummary(byCondition.get('delay') ?? []),
  };

  const baseline_span = by_condition.baseline.span_estimate;
  const ignore_span = by_condition.ignore_distractor.span_estimate;
  const remember_span = by_condition.remember_distractor.span_estimate;
  const delay_span = by_condition.delay.span_estimate;

  return {
    by_condition,
    baseline_span,
    ignore_span,
    remember_span,
    delay_span,
    interference_cost: baseline_span - ignore_span,
    binding_cost: baseline_span - remember_span,
    delay_cost: baseline_span - delay_span,
    practice_failed: options.practice_failed ?? false,
    practice_passed_first_try: options.practice_passed_first_try ?? false,
    attention_check_failed: options.attention_check_failed ?? false,
    condition_order: options.condition_order,
  };
}
