import { VALIDITY_THRESHOLDS } from '../config/validityThresholds';
import { correctRts, primaryScoredTrials, summarizeBlock } from './ScoringEngine';
import type { DeviceInfo, TrialRecord, ValidityFlag } from '../types';

function flag(code: string, message: string, triggered: boolean): ValidityFlag {
  return { code, message, triggered };
}

function maxIdenticalResponseRun(trials: TrialRecord[]): number {
  let max = 0;
  let run = 0;
  let prev: string | null = null;
  for (const t of trials) {
    const key = String(t.actualResponse);
    if (key === prev && key !== 'none') {
      run++;
      max = Math.max(max, run);
    } else {
      run = 1;
      prev = key;
    }
  }
  return max;
}

export interface ValidityInput {
  trials: TrialRecord[];
  completionStatus: string;
  practicePassed: boolean;
  practiceRepetitions: number;
  baselineUnderstood: boolean;
  focusLossCount: number;
  device: DeviceInfo;
}

export function evaluateValidity(input: ValidityInput): ValidityFlag[] {
  const {
    trials,
    completionStatus,
    practicePassed,
    practiceRepetitions,
    baselineUnderstood,
    focusLossCount,
    device,
  } = input;

  const primary = primaryScoredTrials(trials);
  const n = primary.length;
  const omissionRate = n
    ? primary.filter((t) => t.omissionFlag).length / n
    : 0;
  const accuracy = n ? primary.filter((t) => t.accuracy === 1).length / n : 0;
  const rts = correctRts(primary);
  const meanRt = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : null;
  const anticipatory = primary.filter((t) => t.anticipatoryResponseFlag).length;
  const timingIrrRate = n
    ? primary.filter((t) => t.timingIrregularityFlag).length / n
    : 0;
  const perseverativeRate = n
    ? primary.filter((t) => t.errorType === 'perseverative').length / n
    : 0;

  const ruleLearning = summarizeBlock(trials, 'rule_learning');

  return [
    flag(
      'excessive_omissions',
      'Omission rate exceeds threshold on scored trials.',
      omissionRate >= VALIDITY_THRESHOLDS.excessiveOmissionRate
    ),
    flag(
      'chance_accuracy',
      'Overall accuracy near chance on scored switching trials.',
      n > 20 && accuracy <= VALIDITY_THRESHOLDS.chanceLevelAccuracy
    ),
    flag(
      'extremely_rapid',
      'Mean correct RT unusually fast.',
      meanRt != null && meanRt < VALIDITY_THRESHOLDS.extremelyRapidMeanRtMs
    ),
    flag(
      'repeated_anticipatory',
      'Many anticipatory responses.',
      anticipatory >= VALIDITY_THRESHOLDS.repeatedAnticipatoryCount
    ),
    flag(
      'excessive_focus_loss',
      'Frequent focus loss during the session.',
      focusLossCount >= VALIDITY_THRESHOLDS.excessiveFocusLossCount
    ),
    flag(
      'incomplete_session',
      'Session did not complete normally.',
      completionStatus !== 'completed'
    ),
    flag(
      'abnormal_timing',
      'High rate of timing irregularities.',
      timingIrrRate >= VALIDITY_THRESHOLDS.abnormalTimingIrregularityRate
    ),
    flag(
      'unsupported_device',
      'Device may not support valid administration.',
      !device.supported
    ),
    flag(
      'repeated_response_pattern',
      'Long run of identical responses.',
      maxIdenticalResponseRun(primary) >= VALIDITY_THRESHOLDS.repeatedIdenticalResponseRun
    ),
    flag(
      'practice_failed',
      'Practice gate not passed within allowed repetitions.',
      !practicePassed ||
        practiceRepetitions >= VALIDITY_THRESHOLDS.practiceFailRepetitions
    ),
    flag(
      'rule_not_understood',
      'Rule-learning block accuracy below comprehension threshold.',
      !baselineUnderstood ||
        (ruleLearning.trialCount > 0 &&
          ruleLearning.accuracy < VALIDITY_THRESHOLDS.ruleLearningMinAccuracy)
    ),
    flag(
      'excessive_perseveration',
      'Perseverative error rate exceeds threshold.',
      perseverativeRate >= VALIDITY_THRESHOLDS.excessivePerseverativeRate
    ),
  ];
}
