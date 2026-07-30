import { SCORING_WEIGHTS } from '../config/scoringWeights';
import { TASK_CONFIG } from '../config/taskConfig';
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

/** Trials included in the provisional primary inhibition score */
export function primaryScoredTrials(trials: TrialRecord[]): TrialRecord[] {
  return trials.filter(
    (t) =>
      t.scored &&
      (t.blockType === 'habit' ||
        t.blockType === 'standard' ||
        t.blockType === 'interference')
  );
}

export function correctGoRts(trials: TrialRecord[]): number[] {
  return trials
    .filter(
      (t) =>
        t.goNoGo === 'go' &&
        t.accuracy === 1 &&
        t.reactionTimeMs != null &&
        !t.anticipatoryResponseFlag
    )
    .map((t) => t.reactionTimeMs as number);
}

export function computePostErrorSlowing(trials: TrialRecord[]): number | null {
  const deltas: number[] = [];
  for (let i = 1; i < trials.length; i++) {
    const prev = trials[i - 1];
    const cur = trials[i];
    if (
      prev.accuracy === 0 &&
      cur.accuracy === 1 &&
      cur.goNoGo === 'go' &&
      cur.reactionTimeMs != null
    ) {
      // Compare to mean of correct go RTs in same block as proxy baseline
      const blockCorrect = correctGoRts(trials.filter((t) => t.blockId === cur.blockId));
      const m = mean(blockCorrect);
      if (m != null) deltas.push(cur.reactionTimeMs - m);
    }
  }
  return mean(deltas);
}

export function summarizeBlock(trials: TrialRecord[], blockType: BlockType): BlockSummary {
  const block = trials.filter((t) => t.blockType === blockType);
  const n = block.length;
  const accuracy = n ? block.filter((t) => t.accuracy === 1).length / n : 0;
  const commissions = block.filter((t) => t.commissionErrorFlag).length;
  const nogo = block.filter((t) => t.goNoGo === 'nogo').length;
  const omissions = block.filter((t) => t.omissionFlag).length;
  const go = block.filter((t) => t.goNoGo === 'go').length;
  return {
    blockType,
    trialCount: n,
    accuracy,
    meanCorrectRtMs: mean(correctGoRts(block)),
    commissionRate: nogo ? commissions / nogo : 0,
    omissionRate: go ? omissions / go : 0,
  };
}

export function computeComponentScores(trials: TrialRecord[]): ComponentScores {
  const primary = primaryScoredTrials(trials);
  const go = primary.filter((t) => t.goNoGo === 'go');
  const nogo = primary.filter((t) => t.goNoGo === 'nogo');
  const rts = correctGoRts(primary);
  const m = mean(rts);
  const s = sd(rts);
  const med = median(rts);
  const cv = m && s != null && m > 0 ? s / m : null;

  const interference = primary.filter((t) => t.blockType === 'interference');
  const hiAcc = interference.length
    ? interference.filter((t) => t.accuracy === 1).length / interference.length
    : null;
  const hiRt = mean(correctGoRts(interference));

  const anticipatoryCount = primary.filter((t) => t.anticipatoryResponseFlag).length;
  const excessiveSlowingFlag =
    m != null && m > TASK_CONFIG.excessiveSlowingRtMs;

  // Speed-accuracy tradeoff: z-like contrast of accuracy vs normalized speed
  const acc = primary.length
    ? primary.filter((t) => t.accuracy === 1).length / primary.length
    : 0;
  const speedNorm =
    m != null
      ? invertAnchor(
          m,
          SCORING_WEIGHTS.speedAnchorsMs.excellent,
          SCORING_WEIGHTS.speedAnchorsMs.poor
        )
      : 0.5;
  const speedAccuracyTradeoff = acc - speedNorm;

  return {
    commissionErrorRate: nogo.length
      ? nogo.filter((t) => t.commissionErrorFlag).length / nogo.length
      : 0,
    omissionErrorRate: go.length ? go.filter((t) => t.omissionFlag).length / go.length : 0,
    meanCorrectRtMs: m,
    medianCorrectRtMs: med,
    rtSdMs: s,
    rtCv: cv,
    anticipatoryCount,
    postErrorSlowingMs: computePostErrorSlowing(primary),
    highInterferenceAccuracy: hiAcc,
    highInterferenceMeanRtMs: hiRt,
    speedAccuracyTradeoff,
    excessiveSlowingFlag,
  };
}

/**
 * Provisional Inhibitory Control Score (0–100).
 * Transparent weighted composite — not normed.
 */
export function computeProvisionalScore(trials: TrialRecord[]): ProvisionalScore {
  const components = computeComponentScores(trials);
  const w = SCORING_WEIGHTS.weights;

  const rtStability =
    components.rtCv == null
      ? 0.5
      : invertAnchor(
          components.rtCv,
          SCORING_WEIGHTS.rtCvAnchors.excellent,
          SCORING_WEIGHTS.rtCvAnchors.poor
        );

  const speed =
    components.meanCorrectRtMs == null
      ? 0.5
      : invertAnchor(
          components.meanCorrectRtMs,
          SCORING_WEIGHTS.speedAnchorsMs.excellent,
          SCORING_WEIGHTS.speedAnchorsMs.poor
        );

  const primary = primaryScoredTrials(trials);
  const anticipatoryRate = primary.length
    ? components.anticipatoryCount / primary.length
    : 0;

  const interferenceAcc = components.highInterferenceAccuracy ?? 0.5;

  const raw =
    w.commission * (1 - components.commissionErrorRate) +
    w.omission * (1 - components.omissionErrorRate) +
    w.rtStability * rtStability +
    w.speed * speed +
    w.anticipatory * (1 - clamp01(anticipatoryRate * 5)) +
    w.interference * interferenceAcc +
    w.excessiveSlowing * (components.excessiveSlowingFlag ? 0 : 1);

  const inhibitoryControlScore =
    primary.length === 0 ? null : Math.round(clamp01(raw) * 1000) / 10;

  return {
    inhibitoryControlScore,
    components,
    scoringVersion: SCORING_WEIGHTS.scoringVersion,
    weightsId: SCORING_WEIGHTS.weightsId,
    note: SCORING_WEIGHTS.note,
  };
}

export function allBlockSummaries(trials: TrialRecord[]): BlockSummary[] {
  const types: BlockType[] = [
    'practice',
    'baseline',
    'habit',
    'standard',
    'interference',
  ];
  return types
    .map((b) => summarizeBlock(trials, b))
    .filter((s) => s.trialCount > 0);
}

export function performanceChangeAcrossBlocks(trials: TrialRecord[]): {
  habitToStandardAccDelta: number | null;
  standardToInterferenceAccDelta: number | null;
} {
  const h = summarizeBlock(trials, 'habit');
  const s = summarizeBlock(trials, 'standard');
  const i = summarizeBlock(trials, 'interference');
  return {
    habitToStandardAccDelta:
      h.trialCount && s.trialCount ? s.accuracy - h.accuracy : null,
    standardToInterferenceAccDelta:
      s.trialCount && i.trialCount ? i.accuracy - s.accuracy : null,
  };
}
