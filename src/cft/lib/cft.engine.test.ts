import { describe, expect, it } from 'vitest';
import { SCORING_WEIGHTS } from '../config/scoringWeights';
import { TASK_CONFIG } from '../config/taskConfig';
import { classifyErrorType, classifyResponse } from './responseClassification';
import {
  computeProvisionalScore,
  computeSwitchCosts,
  primaryScoredTrials,
} from './ScoringEngine';
import { generateSessionPlan } from './TrialGenerator';
import { evaluateValidity } from './ValidityEngine';
import { buildCftSubmissionRow } from './submissionPayload';
import { simulateSession } from './simulateProfiles';
import type { PlannedTrial } from '../types';
import {
  CFT_CONSENT_VERSION,
  CFT_SCORING_VERSION,
  CFT_STUDY_VERSION,
  type DeviceInfo,
  type SessionRecord,
} from '../types';

function maxRunLength<T>(arr: T[], key: (t: T) => string): number {
  let max = 0;
  let run = 0;
  let prev: string | null = null;
  for (const item of arr) {
    const k = key(item);
    if (k === prev) {
      run++;
      max = Math.max(max, run);
    } else {
      run = 1;
      prev = k;
    }
  }
  return max;
}

const fakeDevice = (): DeviceInfo => ({
  deviceType: 'desktop',
  inputMethod: 'keyboard',
  userAgent: 'test',
  screenWidth: 1280,
  screenHeight: 800,
  devicePixelRatio: 2,
  refreshRateHz: 60,
  touchCapable: false,
  supported: true,
  supportNotes: [],
});

describe('CFT TrialGenerator', () => {
  it('is deterministic for a seed', () => {
    const a = generateSessionPlan(42);
    const b = generateSessionPlan(42);
    expect(a.trials.map((t) => t.stimulusId)).toEqual(b.trials.map((t) => t.stimulusId));
    expect(a.trials.map((t) => t.rule)).toEqual(b.trials.map((t) => t.rule));
  });

  it('includes all primary blocks with expected trial counts', () => {
    const plan = generateSessionPlan(7);
    expect(plan.byBlock.practice.length).toBe(TASK_CONFIG.blocks.practice.trialCount);
    expect(plan.byBlock.rule_learning.length).toBe(
      TASK_CONFIG.blocks.rule_learning.trialCount
    );
    expect(plan.byBlock.predictable_switch.length).toBe(
      TASK_CONFIG.blocks.predictable_switch.trialCount
    );
    expect(plan.byBlock.cued_switch.length).toBe(TASK_CONFIG.blocks.cued_switch.trialCount);
    expect(plan.byBlock.interference.length).toBe(
      TASK_CONFIG.blocks.interference.trialCount
    );
  });

  it('marks predictable pairs as AABB-style runs', () => {
    const plan = generateSessionPlan(11);
    const rules = plan.byBlock.predictable_switch.map((t) => t.rule);
    for (let i = 0; i + 1 < rules.length; i += 2) {
      expect(rules[i]).toBe(rules[i + 1]);
    }
  });

  it('soft-caps same-rule runs in mixed blocks', () => {
    const plan = generateSessionPlan(99);
    for (const key of ['cued_switch', 'interference'] as const) {
      const run = maxRunLength(plan.byBlock[key], (t) => t.rule);
      expect(run).toBeLessThanOrEqual(TASK_CONFIG.sequenceConstraints.maxSameRuleRun + 1);
    }
  });

  it('practice teaches shape then pattern', () => {
    const plan = generateSessionPlan(3);
    const half = Math.floor(plan.byBlock.practice.length / 2);
    expect(plan.byBlock.practice.slice(0, half).every((t) => t.rule === 'shape')).toBe(
      true
    );
    expect(plan.byBlock.practice.slice(half).every((t) => t.rule === 'pattern')).toBe(
      true
    );
  });
});

describe('CFT ErrorClassifier', () => {
  function planned(
    partial: Partial<PlannedTrial> &
      Pick<PlannedTrial, 'expectedResponse' | 'rule' | 'isSwitch'>
  ): PlannedTrial {
    const responseByFeature = partial.responseByFeature ?? {
      shape: 'a',
      pattern: 'b',
      number: 'a',
    };
    return {
      trialNumber: 1,
      blockId: 'cued_switch',
      blockType: 'cued_switch',
      stimulusId: 't1',
      stimulus: {
        features: { shape: 'circle', pattern: 'striped', number: 'one' },
        label: 'demo',
      },
      previousRule: partial.previousRule ?? 'pattern',
      congruency: partial.congruency ?? 'incongruent',
      responseByFeature,
      stimulusDurationMs: 2000,
      isiMs: 600,
      ...partial,
      rule: partial.rule,
      isSwitch: partial.isSwitch,
      expectedResponse: partial.expectedResponse,
    };
  }

  it('flags perseverative errors after a switch', () => {
    const p = planned({
      rule: 'shape',
      previousRule: 'pattern',
      isSwitch: true,
      expectedResponse: 'a',
      responseByFeature: { shape: 'a', pattern: 'b', number: 'a' },
    });
    expect(classifyErrorType(p, 'b', false)).toBe('perseverative');
  });

  it('flags conflict errors on incongruent trials', () => {
    const p = planned({
      rule: 'shape',
      previousRule: 'shape',
      isSwitch: false,
      expectedResponse: 'a',
      congruency: 'incongruent',
      responseByFeature: { shape: 'a', pattern: 'b', number: 'a' },
    });
    expect(classifyErrorType(p, 'b', false)).toBe('conflict');
  });

  it('flags rule-maintenance errors on stay trials', () => {
    const p = planned({
      rule: 'shape',
      previousRule: 'shape',
      isSwitch: false,
      expectedResponse: 'a',
      congruency: 'congruent',
      responseByFeature: { shape: 'a', pattern: 'a', number: 'a' },
    });
    expect(classifyErrorType(p, 'b', false)).toBe('rule_maintenance');
  });

  it('marks omissions when no response', () => {
    const rec = classifyResponse({
      sessionId: 's',
      planned: planned({
        rule: 'shape',
        isSwitch: false,
        expectedResponse: 'a',
      }),
      actualResponse: 'none',
      stimulusOnsetTs: 1000,
      responseTimestamp: null,
      focusLossFlag: false,
      timingIrregularityFlag: false,
      scored: true,
    });
    expect(rec.omissionFlag).toBe(true);
    expect(rec.accuracy).toBe(0);
    expect(rec.errorType).toBe('omission');
  });
});

describe('CFT ScoringEngine', () => {
  it('weights sum to 1', () => {
    const w = SCORING_WEIGHTS.weights;
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 8);
  });

  it('excludes practice and rule_learning from primary score', () => {
    const { trials } = simulateSession(5, 'accurate');
    const primary = primaryScoredTrials(trials);
    expect(primary.some((t) => t.blockType === 'practice')).toBe(false);
    expect(primary.some((t) => t.blockType === 'rule_learning')).toBe(false);
  });

  it('computes CFS in 0–100 for accurate profile', () => {
    const { score } = simulateSession(21, 'accurate');
    expect(score.cognitiveFlexibilityScore).not.toBeNull();
    expect(score.cognitiveFlexibilityScore!).toBeGreaterThanOrEqual(0);
    expect(score.cognitiveFlexibilityScore!).toBeLessThanOrEqual(100);
  });

  it('gives perseverative profile higher perseveration than accurate', () => {
    const accurate = simulateSession(33, 'accurate');
    const persev = simulateSession(33, 'perseverative');
    expect(persev.score.components.perseverativeErrorRate).toBeGreaterThan(
      accurate.score.components.perseverativeErrorRate
    );
  });

  it('computes switch cost fields', () => {
    const { trials } = simulateSession(44, 'slow_switch');
    const costs = computeSwitchCosts(primaryScoredTrials(trials));
    expect(costs.switchAccuracy).not.toBeNull();
    expect(costs.stayAccuracy).not.toBeNull();
  });

  it('clinical and game modes share identical scoring for same trials', () => {
    const { trials } = simulateSession(55, 'accurate');
    const a = computeProvisionalScore(trials);
    const b = computeProvisionalScore(trials);
    expect(a.cognitiveFlexibilityScore).toBe(b.cognitiveFlexibilityScore);
    expect(a.components).toEqual(b.components);
  });
});

describe('CFT ValidityEngine', () => {
  it('flags incomplete sessions', () => {
    const { trials } = simulateSession(8, 'accurate');
    const flags = evaluateValidity({
      trials,
      completionStatus: 'incomplete',
      practicePassed: true,
      practiceRepetitions: 0,
      baselineUnderstood: true,
      focusLossCount: 0,
      device: fakeDevice(),
    });
    expect(flags.find((f) => f.code === 'incomplete_session')?.triggered).toBe(true);
  });
});

describe('CFT submission payload', () => {
  it('builds a row with provisional_cfs and CFT block columns', () => {
    const { trials, score } = simulateSession(12, 'accurate');
    const session: SessionRecord = {
      sessionId: 'cft_test',
      anonymousParticipantId: 'anon',
      studyId: 'CFT-DEV',
      administrationMode: 'research',
      visualMode: 'clinical',
      taskVersion: '0.1.0',
      scoringVersion: CFT_SCORING_VERSION,
      studyVersion: CFT_STUDY_VERSION,
      consentVersion: CFT_CONSENT_VERSION,
      randomizationSeed: 12,
      startTime: null,
      completionTime: null,
      totalDurationMs: null,
      device: fakeDevice(),
      practiceRepetitions: 0,
      provisionalScore: score,
      secondaryScores: score.components,
      blockSummaries: [],
      timingQuality: 'good',
      validityFlags: [],
      completionStatus: 'completed',
      examinerNotes: null,
      dataRetentionPolicy: '',
      irbContact: null,
      sessionLocked: false,
    };
    const row = buildCftSubmissionRow({ session, trials });
    expect(row.provisional_cfs).toBe(score.cognitiveFlexibilityScore);
    expect(row.session_id).toBe('cft_test');
  });
});
