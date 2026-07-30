import { createSeededRandom } from '../../lib/seedRandom';
import { classifyResponse } from './responseClassification';
import { computeProvisionalScore } from './ScoringEngine';
import { generateSessionPlan } from './TrialGenerator';
import type { ActualResponse, PlannedTrial, TrialRecord } from '../types';

export type SimProfile =
  | 'accurate'
  | 'perseverative'
  | 'slow_switch'
  | 'conflict_sensitive'
  | 'omissive'
  | 'random';

function respond(
  planned: PlannedTrial,
  profile: SimProfile,
  random: () => number
): { actual: ActualResponse; rt: number } {
  const baseRt = 420 + Math.floor(random() * 180);
  const switchPenalty = planned.isSwitch ? 80 + Math.floor(random() * 120) : 0;

  if (profile === 'omissive' && random() < 0.25) {
    return { actual: 'none', rt: 0 };
  }

  if (profile === 'accurate') {
    return { actual: planned.expectedResponse, rt: baseRt + switchPenalty * 0.3 };
  }

  if (profile === 'perseverative') {
    if (
      planned.isSwitch &&
      planned.previousRule != null &&
      random() < 0.55
    ) {
      return {
        actual: planned.responseByFeature[planned.previousRule],
        rt: baseRt + 40,
      };
    }
    if (random() < 0.08) {
      return {
        actual: planned.expectedResponse === 'a' ? 'b' : 'a',
        rt: baseRt,
      };
    }
    return { actual: planned.expectedResponse, rt: baseRt + switchPenalty * 0.4 };
  }

  if (profile === 'slow_switch') {
    return {
      actual: random() < 0.12 ? (planned.expectedResponse === 'a' ? 'b' : 'a') : planned.expectedResponse,
      rt: baseRt + (planned.isSwitch ? 220 + Math.floor(random() * 150) : 0),
    };
  }

  if (profile === 'conflict_sensitive') {
    if (planned.congruency === 'incongruent' && random() < 0.45) {
      const others = (['shape', 'pattern', 'number'] as const).filter(
        (r) => r !== planned.rule
      );
      const pick = others[Math.floor(random() * others.length)];
      return {
        actual: planned.responseByFeature[pick],
        rt: baseRt + 60,
      };
    }
    return { actual: planned.expectedResponse, rt: baseRt + switchPenalty * 0.5 };
  }

  // random
  if (random() < 0.15) return { actual: 'none', rt: 0 };
  return { actual: random() < 0.5 ? 'a' : 'b', rt: baseRt + Math.floor(random() * 200) };
}

export function simulateSession(
  seed: number,
  profile: SimProfile
): { trials: TrialRecord[]; score: ReturnType<typeof computeProvisionalScore> } {
  const plan = generateSessionPlan(seed);
  const random = createSeededRandom(seed + 17);
  const onsetBase = 1_000_000;
  const trials: TrialRecord[] = plan.trials.map((planned, i) => {
    const { actual, rt } = respond(planned, profile, random);
    const onset = onsetBase + i * 1200;
    const scored = ['predictable_switch', 'cued_switch', 'interference'].includes(
      planned.blockType
    );
    return classifyResponse({
      sessionId: `sim_${seed}`,
      planned,
      actualResponse: actual,
      stimulusOnsetTs: onset,
      responseTimestamp: actual === 'none' ? null : onset + rt,
      focusLossFlag: false,
      timingIrregularityFlag: false,
      scored,
    });
  });
  return { trials, score: computeProvisionalScore(trials) };
}

export const SIM_PROFILES: SimProfile[] = [
  'accurate',
  'perseverative',
  'slow_switch',
  'conflict_sensitive',
  'omissive',
  'random',
];
