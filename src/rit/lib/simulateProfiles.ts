import type { ActualResponse, PlannedTrial } from '../types';
import { generateSessionPlan } from './TrialGenerator';
import type { ReplayResponse } from './SessionReplay';
import { replaySession } from './SessionReplay';
import { computeProvisionalScore } from './ScoringEngine';
import { createSeededRandom } from '../../lib/seedRandom';

export type ProfileName =
  | 'accurate_average'
  | 'fast_impulsive'
  | 'slow_cautious'
  | 'inconsistent_attention'
  | 'high_omission'
  | 'high_commission'
  | 'random_responding'
  | 'incomplete_session'
  | 'technically_invalid'
  | 'failed_practice';


function respondForTrial(
  planned: PlannedTrial,
  profile: ProfileName,
  random: () => number
): ReplayResponse {
  const base = { trialNumber: planned.trialNumber };

  if (profile === 'incomplete_session' && planned.trialNumber > 40) {
    return { ...base, actualResponse: 'none', reactionTimeMs: null };
  }

  if (profile === 'failed_practice' && planned.blockType === 'practice') {
    // Systematically wrong on practice to simulate failed comprehension
    if (planned.expectedResponse === 'none') {
      return { ...base, actualResponse: 'a', reactionTimeMs: 400 };
    }
    return { ...base, actualResponse: 'none', reactionTimeMs: null };
  }

  if (profile === 'technically_invalid') {
    return {
      ...base,
      actualResponse: planned.expectedResponse === 'none' ? 'a' : planned.expectedResponse,
      reactionTimeMs: 80 + random() * 40,
    };
  }

  if (profile === 'random_responding') {
    const r = random();
    const actual: ActualResponse = r < 0.33 ? 'a' : r < 0.66 ? 'b' : 'none';
    return {
      ...base,
      actualResponse: actual,
      reactionTimeMs: actual === 'none' ? null : 250 + random() * 500,
    };
  }

  if (profile === 'high_commission') {
    if (planned.goNoGo === 'nogo') {
      return { ...base, actualResponse: 'a', reactionTimeMs: 280 + random() * 80 };
    }
  }

  if (profile === 'high_omission') {
    if (planned.goNoGo === 'go' && random() < 0.55) {
      return { ...base, actualResponse: 'none', reactionTimeMs: null };
    }
  }

  if (profile === 'inconsistent_attention') {
    if (random() < 0.25) {
      return { ...base, actualResponse: 'none', reactionTimeMs: null };
    }
  }

  // Default: mostly correct
  let errorProb = 0.08;
  let rtMean = 420;
  let rtSd = 80;

  if (profile === 'fast_impulsive') {
    errorProb = planned.goNoGo === 'nogo' ? 0.55 : 0.1;
    rtMean = 260;
    rtSd = 50;
  } else if (profile === 'slow_cautious') {
    errorProb = planned.goNoGo === 'nogo' ? 0.05 : 0.12;
    rtMean = 780;
    rtSd = 120;
  } else if (profile === 'accurate_average') {
    errorProb = 0.06;
    rtMean = 430;
    rtSd = 70;
  }

  const err = random() < errorProb;
  if (planned.expectedResponse === 'none') {
    if (err || profile === 'high_commission') {
      return { ...base, actualResponse: 'a', reactionTimeMs: rtMean + (random() - 0.5) * rtSd };
    }
    return { ...base, actualResponse: 'none', reactionTimeMs: null };
  }

  if (err) {
    if (random() < 0.5) {
      return { ...base, actualResponse: 'none', reactionTimeMs: null };
    }
    const wrong: ActualResponse = planned.expectedResponse === 'a' ? 'b' : 'a';
    return {
      ...base,
      actualResponse: wrong,
      reactionTimeMs: Math.max(160, rtMean + (random() - 0.5) * 2 * rtSd),
    };
  }

  return {
    ...base,
    actualResponse: planned.expectedResponse,
    reactionTimeMs: Math.max(160, rtMean + (random() - 0.5) * 2 * rtSd),
  };
}

export function simulateProfile(profile: ProfileName, seed = 42) {
  const plan = generateSessionPlan(seed);
  const random = createSeededRandom((seed ^ profile.length * 9973) >>> 0);
  const responses = plan.trials.map((t) => respondForTrial(t, profile, random));
  const { trials } = replaySession({
    sessionId: `sim_${profile}`,
    seed,
    responses:
      profile === 'incomplete_session'
        ? responses.filter((r) => r.trialNumber <= 40)
        : responses,
  });
  const score = computeProvisionalScore(trials);
  return { profile, seed, trials, score, responses };
}

export const ALL_PROFILES: ProfileName[] = [
  'accurate_average',
  'fast_impulsive',
  'slow_cautious',
  'inconsistent_attention',
  'high_omission',
  'high_commission',
  'random_responding',
  'incomplete_session',
  'technically_invalid',
  'failed_practice',
];
