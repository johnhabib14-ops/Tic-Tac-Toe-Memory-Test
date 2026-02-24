import type { GMT2MemoryTrialRecord, GMT2Summary, GMT2Condition } from '../types';
import { GMT2_CONDITIONS } from '../types';

export function computeGMT2Summary(trials: GMT2MemoryTrialRecord[]): GMT2Summary {
  const mean_accuracy_per_condition: Record<GMT2Condition, number> = {
    baseline: 0,
    ignore_distractor: 0,
    remember_distractor: 0,
    delay: 0,
  };
  const mean_rt_per_condition: Record<GMT2Condition, number> = {
    baseline: 0,
    ignore_distractor: 0,
    remember_distractor: 0,
    delay: 0,
  };

  const countByCondition: Record<GMT2Condition, number> = {
    baseline: 0,
    ignore_distractor: 0,
    remember_distractor: 0,
    delay: 0,
  };

  let totalAccuracy = 0;
  let totalRt = 0;

  for (const t of trials) {
    countByCondition[t.condition]++;
    mean_accuracy_per_condition[t.condition] += t.accuracy_raw;
    mean_rt_per_condition[t.condition] += t.recon_rt_ms;
    totalAccuracy += t.accuracy_raw;
    totalRt += t.recon_rt_ms;
  }

  for (const c of GMT2_CONDITIONS) {
    const n = countByCondition[c];
    mean_accuracy_per_condition[c] = n > 0 ? mean_accuracy_per_condition[c] / n : 0;
    mean_rt_per_condition[c] = n > 0 ? mean_rt_per_condition[c] / n : 0;
  }

  const n = trials.length;
  return {
    mean_accuracy_per_condition,
    mean_rt_per_condition,
    global_accuracy: n > 0 ? totalAccuracy / n : 0,
    global_mean_rt: n > 0 ? totalRt / n : 0,
  };
}
