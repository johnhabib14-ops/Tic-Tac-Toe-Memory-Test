import type { ActualResponse, PlannedTrial, TrialRecord } from '../types';
import { generateSessionPlan } from './TrialGenerator';
import { classifyResponse } from './responseClassification';
import { isScoredBlock } from './blockMeta';

export interface ReplayResponse {
  trialNumber: number;
  actualResponse: ActualResponse;
  reactionTimeMs: number | null;
}

/**
 * Developer-only: reconstruct trial classifications from seed + response log.
 * Presentation mode is ignored — cognitive parameters come only from the plan.
 */
export function replaySession(input: {
  sessionId: string;
  seed: number;
  responses: ReplayResponse[];
  blockFilter?: string[];
}): { plan: PlannedTrial[]; trials: TrialRecord[] } {
  const plan = generateSessionPlan(input.seed);
  const responseMap = new Map(input.responses.map((r) => [r.trialNumber, r]));

  let trials = plan.trials.map((planned) => {
    const resp = responseMap.get(planned.trialNumber);
    const actual = resp?.actualResponse ?? 'none';
    const onset = planned.trialNumber * 1000;
    const rt = resp?.reactionTimeMs ?? null;
    const responseTs = rt != null ? onset + rt : null;

    return classifyResponse({
      sessionId: input.sessionId,
      planned,
      actualResponse: actual,
      stimulusOnsetTs: onset,
      responseTimestamp: responseTs,
      focusLossFlag: false,
      timingIrregularityFlag: false,
      scored: isScoredBlock(planned.blockType),
    });
  });

  if (input.blockFilter?.length) {
    trials = trials.filter((t) => input.blockFilter!.includes(t.blockType));
  }

  return { plan: plan.trials, trials };
}

/** Modes must not affect trial plans — same seed ⇒ identical structure. */
export function comparePlansEqual(seed: number): boolean {
  const a = generateSessionPlan(seed);
  const b = generateSessionPlan(seed);
  return JSON.stringify(a.trials) === JSON.stringify(b.trials);
}
