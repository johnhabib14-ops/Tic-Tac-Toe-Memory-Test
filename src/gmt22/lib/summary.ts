import type { GMT22MemoryTrialRecord, GMT22Summary, GMT22Condition } from '../types';
import { GMT22_CONDITIONS } from '../types';

export function computeGMT22Summary(trials: GMT22MemoryTrialRecord[]): GMT22Summary {
  const mean_accuracy_per_condition: Record<GMT22Condition, number> = {
    baseline: 0,
    ignore_distractor: 0,
    remember_distractor: 0,
    delay: 0,
  };
  const mean_rt_per_condition: Record<GMT22Condition, number> = {
    baseline: 0,
    ignore_distractor: 0,
    remember_distractor: 0,
    delay: 0,
  };
  const total_commissions_per_condition: Record<GMT22Condition, number> = {
    baseline: 0,
    ignore_distractor: 0,
    remember_distractor: 0,
    delay: 0,
  };
  const clean_trial_rate_per_condition: Record<GMT22Condition, number> = {
    baseline: 0,
    ignore_distractor: 0,
    remember_distractor: 0,
    delay: 0,
  };
  const countByCondition: Record<GMT22Condition, number> = {
    baseline: 0,
    ignore_distractor: 0,
    remember_distractor: 0,
    delay: 0,
  };
  const cleanCountByCondition: Record<GMT22Condition, number> = {
    baseline: 0,
    ignore_distractor: 0,
    remember_distractor: 0,
    delay: 0,
  };

  let totalAccuracy = 0;
  let totalRt = 0;
  let totalClean = 0;

  for (const t of trials) {
    countByCondition[t.condition]++;
    mean_accuracy_per_condition[t.condition] += t.accuracy_raw;
    mean_rt_per_condition[t.condition] += t.recon_rt_ms;
    total_commissions_per_condition[t.condition] += t.commissions;
    if (t.clean_trial) {
      cleanCountByCondition[t.condition]++;
      totalClean++;
    }
    totalAccuracy += t.accuracy_raw;
    totalRt += t.recon_rt_ms;
  }

  for (const c of GMT22_CONDITIONS) {
    const n = countByCondition[c];
    mean_accuracy_per_condition[c] = n > 0 ? mean_accuracy_per_condition[c] / n : 0;
    mean_rt_per_condition[c] = n > 0 ? mean_rt_per_condition[c] / n : 0;
    clean_trial_rate_per_condition[c] = n > 0 ? cleanCountByCondition[c] / n : 0;
  }

  const n = trials.length;
  return {
    mean_accuracy_per_condition,
    mean_rt_per_condition,
    total_commissions_per_condition,
    clean_trial_rate_per_condition,
    global_accuracy: n > 0 ? totalAccuracy / n : 0,
    global_mean_rt: n > 0 ? totalRt / n : 0,
    global_clean_trial_rate: n > 0 ? totalClean / n : 0,
  };
}
