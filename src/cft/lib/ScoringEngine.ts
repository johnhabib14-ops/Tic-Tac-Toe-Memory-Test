import { SCORING_WEIGHTS } from '../config/scoringWeights';
import type {
  BlockSummary,
  BlockType,
  ComponentScores,
  ProvisionalScore,
  TrialRecord,
} from '../types';

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function sd(nums: number[]): number | null {
  if (nums.length < 2) return null;
  const m = mean(nums)!;
  const v = nums.reduce((acc, n) => acc + (n - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(v);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function invertAnchor(value: number, excellent: number, poor: number): number {
  if (poor === excellent) return 0.5;
  return clamp01((poor - value) / (poor - excellent));
}

const PRIMARY_BLOCKS: BlockType[] = [
  'predictable_switch',
  'cued_switch',
  'interference',
];

export function primaryScoredTrials(trials: TrialRecord[]): TrialRecord[] {
  return trials.filter((t) => t.scored && PRIMARY_BLOCKS.includes(t.blockType));
}

export function correctRts(trials: TrialRecord[]): number[] {
  return trials
    .filter(
      (t) =>
        t.accuracy === 1 &&
        t.reactionTimeMs != null &&
        !t.anticipatoryResponseFlag
    )
    .map((t) => t.reactionTimeMs as number);
}

/** Recovery: proportion of errors followed by a correct trial. */
export function computePostErrorRecovery(trials: TrialRecord[]): number | null {
  let afterError = 0;
  let recovered = 0;
  for (let i = 1; i < trials.length; i++) {
    if (trials[i - 1].accuracy === 0) {
      afterError++;
      if (trials[i].accuracy === 1) recovered++;
    }
  }
  return afterError ? recovered / afterError : null;
}

export function computeSwitchCosts(trials: TrialRecord[]): {
  switchAccuracy: number | null;
  stayAccuracy: number | null;
  switchCostRtMs: number | null;
  switchCostAccuracy: number | null;
} {
  const switchTrials = trials.filter((t) => t.isSwitch);
  const stayTrials = trials.filter((t) => !t.isSwitch);
  const switchAcc = switchTrials.length
    ? switchTrials.filter((t) => t.accuracy === 1).length / switchTrials.length
    : null;
  const stayAcc = stayTrials.length
    ? stayTrials.filter((t) => t.accuracy === 1).length / stayTrials.length
    : null;
  const switchRt = mean(correctRts(switchTrials));
  const stayRt = mean(correctRts(stayTrials));
  return {
    switchAccuracy: switchAcc,
    stayAccuracy: stayAcc,
    switchCostRtMs:
      switchRt != null && stayRt != null ? switchRt - stayRt : null,
    switchCostAccuracy:
      switchAcc != null && stayAcc != null ? stayAcc - switchAcc : null,
  };
}

export function summarizeBlock(trials: TrialRecord[], blockType: BlockType): BlockSummary {
  const block = trials.filter((t) => t.blockType === blockType);
  const n = block.length;
  const accuracy = n ? block.filter((t) => t.accuracy === 1).length / n : 0;
  const costs = computeSwitchCosts(block);
  const perseverative = block.filter((t) => t.errorType === 'perseverative').length;
  const omissions = block.filter((t) => t.omissionFlag).length;
  return {
    blockType,
    trialCount: n,
    accuracy,
    meanCorrectRtMs: mean(correctRts(block)),
    switchAccuracy: costs.switchAccuracy,
    stayAccuracy: costs.stayAccuracy,
    perseverativeRate: n ? perseverative / n : 0,
    omissionRate: n ? omissions / n : 0,
  };
}

export function computeComponentScores(trials: TrialRecord[]): ComponentScores {
  const primary = primaryScoredTrials(trials);
  const costs = computeSwitchCosts(primary);
  const rts = correctRts(primary);
  const m = mean(rts);
  const s = sd(rts);
  const med = median(rts);
  const cv = m && s != null && m > 0 ? s / m : null;

  const n = primary.length || 1;
  const perseverativeErrorRate =
    primary.filter((t) => t.errorType === 'perseverative').length / n;
  const ruleMaintenanceErrorRate =
    primary.filter((t) => t.errorType === 'rule_maintenance').length / n;
  const cueProcessingErrorRate =
    primary.filter((t) => t.errorType === 'cue_processing').length / n;
  const omissionErrorRate = primary.filter((t) => t.omissionFlag).length / n;

  const conflictTrials = primary.filter((t) => t.congruency === 'incongruent');
  const conflictAccuracy = conflictTrials.length
    ? conflictTrials.filter((t) => t.accuracy === 1).length / conflictTrials.length
    : null;

  const interference = primary.filter((t) => t.blockType === 'interference');
  const hiAcc = interference.length
    ? interference.filter((t) => t.accuracy === 1).length / interference.length
    : null;

  return {
    switchAccuracy: costs.switchAccuracy,
    stayAccuracy: costs.stayAccuracy,
    switchCostRtMs: costs.switchCostRtMs,
    switchCostAccuracy: costs.switchCostAccuracy,
    perseverativeErrorRate,
    ruleMaintenanceErrorRate,
    cueProcessingErrorRate,
    conflictAccuracy,
    omissionErrorRate,
    meanCorrectRtMs: m,
    medianCorrectRtMs: med,
    rtSdMs: s,
    rtCv: cv,
    anticipatoryCount: primary.filter((t) => t.anticipatoryResponseFlag).length,
    postErrorRecovery: computePostErrorRecovery(primary),
    highInterferenceAccuracy: hiAcc,
  };
}

/**
 * Provisional Cognitive Flexibility Score (0–100).
 * Transparent weighted composite — not normed.
 */
export function computeProvisionalScore(trials: TrialRecord[]): ProvisionalScore {
  const components = computeComponentScores(trials);
  const w = SCORING_WEIGHTS.weights;
  const primary = primaryScoredTrials(trials);

  const rtStability =
    components.rtCv == null
      ? 0.5
      : invertAnchor(
          components.rtCv,
          SCORING_WEIGHTS.rtCvAnchors.excellent,
          SCORING_WEIGHTS.rtCvAnchors.poor
        );

  const switchCostRtComp =
    components.switchCostRtMs == null
      ? 0.5
      : invertAnchor(
          Math.max(0, components.switchCostRtMs),
          SCORING_WEIGHTS.switchCostRtAnchorsMs.excellent,
          SCORING_WEIGHTS.switchCostRtAnchorsMs.poor
        );

  const switchCostAccComp =
    components.switchCostAccuracy == null
      ? 0.5
      : invertAnchor(
          Math.max(0, components.switchCostAccuracy),
          SCORING_WEIGHTS.switchCostAccAnchors.excellent,
          SCORING_WEIGHTS.switchCostAccAnchors.poor
        );

  const switchAcc = components.switchAccuracy ?? 0.5;
  const conflictAcc = components.conflictAccuracy ?? 0.5;
  const recovery = components.postErrorRecovery ?? 0.5;

  const raw =
    w.switchAccuracy * switchAcc +
    w.switchCostRt * switchCostRtComp +
    w.switchCostAcc * switchCostAccComp +
    w.perseverative * (1 - clamp01(components.perseverativeErrorRate)) +
    w.ruleMaintenance * (1 - clamp01(components.ruleMaintenanceErrorRate)) +
    w.conflict * conflictAcc +
    w.rtStability * rtStability +
    w.recovery * recovery;

  const cognitiveFlexibilityScore =
    primary.length === 0 ? null : Math.round(clamp01(raw) * 1000) / 10;

  return {
    cognitiveFlexibilityScore,
    components,
    scoringVersion: SCORING_WEIGHTS.scoringVersion,
    weightsId: SCORING_WEIGHTS.weightsId,
    note: SCORING_WEIGHTS.note,
  };
}

export function allBlockSummaries(trials: TrialRecord[]): BlockSummary[] {
  const types: BlockType[] = [
    'practice',
    'rule_learning',
    'predictable_switch',
    'cued_switch',
    'interference',
  ];
  return types
    .map((b) => summarizeBlock(trials, b))
    .filter((s) => s.trialCount > 0);
}

export function performanceChangeAcrossBlocks(trials: TrialRecord[]): {
  predictableToCuedAccDelta: number | null;
  cuedToInterferenceAccDelta: number | null;
} {
  const p = summarizeBlock(trials, 'predictable_switch');
  const c = summarizeBlock(trials, 'cued_switch');
  const i = summarizeBlock(trials, 'interference');
  return {
    predictableToCuedAccDelta:
      p.trialCount && c.trialCount ? c.accuracy - p.accuracy : null,
    cuedToInterferenceAccDelta:
      c.trialCount && i.trialCount ? i.accuracy - c.accuracy : null,
  };
}
