import {
  VALIDITY_MESSAGES,
  VALIDITY_THRESHOLDS,
} from '../config/validityThresholds';
import type {
  DeviceInfo,
  TimingQuality,
  TrialRecord,
  ValidityFlag,
} from '../types';
import { primaryScoredTrials } from './ScoringEngine';

function flag(code: keyof typeof VALIDITY_MESSAGES, triggered: boolean): ValidityFlag {
  return {
    code,
    message: VALIDITY_MESSAGES[code],
    triggered,
  };
}

export function evaluateValidity(input: {
  trials: TrialRecord[];
  completionStatus: string;
  practiceRepetitions: number;
  practicePassed: boolean;
  baselineUnderstood: boolean;
  device: DeviceInfo;
  timingQuality: TimingQuality;
  focusLossCount: number;
}): ValidityFlag[] {
  const { trials } = input;
  const primary = primaryScoredTrials(trials);
  const go = primary.filter((t) => t.goNoGo === 'go');
  const nogo = primary.filter((t) => t.goNoGo === 'nogo');

  const omissionRate = go.length
    ? go.filter((t) => t.omissionFlag).length / go.length
    : 0;
  const accuracy = primary.length
    ? primary.filter((t) => t.accuracy === 1).length / primary.length
    : 0;
  const correctRts = primary
    .filter((t) => t.accuracy === 1 && t.reactionTimeMs != null)
    .map((t) => t.reactionTimeMs as number);
  const meanRt =
    correctRts.length > 0
      ? correctRts.reduce((a, b) => a + b, 0) / correctRts.length
      : null;

  const anticipatory = primary.filter((t) => t.anticipatoryResponseFlag).length;
  const timingIrrRate = primary.length
    ? primary.filter((t) => t.timingIrregularityFlag).length / primary.length
    : 0;

  let maxIdenticalRun = 0;
  let cur = 0;
  let prev: string | null = null;
  for (const t of primary) {
    const key = t.actualResponse;
    if (key === prev && key !== 'none') cur++;
    else {
      cur = 1;
      prev = key;
    }
    maxIdenticalRun = Math.max(maxIdenticalRun, cur);
  }

  // Chance-level: treat as ~50% on binary go accuracy when commissions also high
  const commissionRate = nogo.length
    ? nogo.filter((t) => t.commissionErrorFlag).length / nogo.length
    : 0;

  return [
    flag('excessive_omissions', omissionRate >= VALIDITY_THRESHOLDS.excessiveOmissionRate),
    flag(
      'chance_accuracy',
      primary.length > 20 &&
        accuracy <= VALIDITY_THRESHOLDS.chanceLevelAccuracy &&
        commissionRate >= 0.4
    ),
    flag(
      'extremely_rapid',
      meanRt != null && meanRt < VALIDITY_THRESHOLDS.extremelyRapidMeanRtMs
    ),
    flag(
      'repeated_anticipatory',
      anticipatory >= VALIDITY_THRESHOLDS.repeatedAnticipatoryCount
    ),
    flag(
      'excessive_focus_loss',
      input.focusLossCount >= VALIDITY_THRESHOLDS.excessiveFocusLossCount
    ),
    flag(
      'incomplete_session',
      input.completionStatus === 'incomplete' ||
        input.completionStatus === 'withdrawn' ||
        input.completionStatus === 'in_progress'
    ),
    flag(
      'abnormal_timing',
      input.timingQuality === 'poor' ||
        timingIrrRate >= VALIDITY_THRESHOLDS.abnormalTimingIrregularityRate
    ),
    flag('unsupported_device', !input.device.supported),
    flag(
      'repeated_response_pattern',
      maxIdenticalRun >= VALIDITY_THRESHOLDS.repeatedIdenticalResponseRun
    ),
    flag(
      'practice_failed',
      !input.practicePassed ||
        input.practiceRepetitions >= VALIDITY_THRESHOLDS.practiceFailRepetitions
    ),
    flag('rule_not_understood', !input.baselineUnderstood),
  ];
}

export function anyValidityTriggered(flags: ValidityFlag[]): boolean {
  return flags.some((f) => f.triggered);
}
