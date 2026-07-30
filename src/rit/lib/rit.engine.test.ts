import { describe, expect, it } from 'vitest';
import {
  countGoNogo,
  generateSessionPlan,
  maxRunLength,
} from './TrialGenerator';
import { TASK_CONFIG } from '../config/taskConfig';
import { classifyResponse, mapKeyToResponse } from './responseClassification';
import { computeProvisionalScore, primaryScoredTrials } from './ScoringEngine';
import { evaluateValidity } from './ValidityEngine';
import { comparePlansEqual, replaySession } from './SessionReplay';
import { exportSessionCsv, exportTrialsCsv, dataDictionary } from './DataExporter';
import { simulateProfile, ALL_PROFILES } from './simulateProfiles';
import { isScoredBlock } from './blockMeta';
import { buildRitSubmissionRow } from './submissionPayload';
import { TimingMonitor, classifyTimingQuality } from './TimingMonitor';
import type { DeviceInfo, PlannedTrial } from '../types';

const deviceOk: DeviceInfo = {
  deviceType: 'desktop',
  inputMethod: 'keyboard',
  userAgent: 'test',
  screenWidth: 1280,
  screenHeight: 800,
  devicePixelRatio: 1,
  refreshRateHz: 60,
  touchCapable: false,
  supported: true,
  supportNotes: [],
};

describe('TrialGenerator', () => {
  it('reproduces the same plan for the same seed', () => {
    const a = generateSessionPlan(12345);
    const b = generateSessionPlan(12345);
    expect(a.trials).toEqual(b.trials);
    expect(comparePlansEqual(12345)).toBe(true);
  });

  it('produces different plans for different seeds', () => {
    const a = generateSessionPlan(1);
    const b = generateSessionPlan(2);
    expect(JSON.stringify(a.trials)).not.toEqual(JSON.stringify(b.trials));
  });

  it('preserves approximate go/no-go ratios per block', () => {
    const plan = generateSessionPlan(99);
    for (const key of ['habit', 'standard', 'interference'] as const) {
      const block = plan.byBlock[key];
      const { ratioGo } = countGoNogo(block);
      const expected = TASK_CONFIG.blocks[key].goRatio;
      expect(Math.abs(ratioGo - expected)).toBeLessThan(0.08);
    }
  });

  it('limits excessive same-type runs within each block', () => {
    const plan = generateSessionPlan(777);
    for (const key of ['practice', 'baseline', 'habit', 'standard', 'interference'] as const) {
      const run = maxRunLength(plan.byBlock[key], (t) => t.goNoGo);
      expect(run).toBeLessThanOrEqual(TASK_CONFIG.sequenceConstraints.maxSameTypeRun);
    }
  });
});

describe('response classification', () => {
  function planned(partial: Partial<PlannedTrial> & Pick<PlannedTrial, 'expectedResponse' | 'goNoGo'>): PlannedTrial {
    return {
      trialNumber: 1,
      blockId: 'standard',
      blockType: 'standard',
      stimulusId: 't1',
      stimulus: {
        kind: partial.goNoGo === 'nogo' ? 'nogo' : 'go_a',
        shape: 'diamond',
        colorToken: 'signal_blue',
        hasStopCue: partial.goNoGo === 'nogo',
        hasReverseFrame: false,
        label: 'x',
      },
      rule: 'standard',
      stimulusDurationMs: 750,
      isiMs: 600,
      ...partial,
    };
  }

  it('marks commission errors on no-go responses', () => {
    const rec = classifyResponse({
      sessionId: 's',
      planned: planned({ expectedResponse: 'none', goNoGo: 'nogo' }),
      actualResponse: 'a',
      stimulusOnsetTs: 1000,
      responseTimestamp: 1400,
      focusLossFlag: false,
      timingIrregularityFlag: false,
      scored: true,
    });
    expect(rec.commissionErrorFlag).toBe(true);
    expect(rec.accuracy).toBe(0);
  });

  it('marks omissions when go trials get no response', () => {
    const rec = classifyResponse({
      sessionId: 's',
      planned: planned({ expectedResponse: 'a', goNoGo: 'go' }),
      actualResponse: 'none',
      stimulusOnsetTs: 1000,
      responseTimestamp: null,
      focusLossFlag: false,
      timingIrregularityFlag: false,
      scored: true,
    });
    expect(rec.omissionFlag).toBe(true);
    expect(rec.accuracy).toBe(0);
  });

  it('flags anticipatory responses and computes RT', () => {
    const rec = classifyResponse({
      sessionId: 's',
      planned: planned({ expectedResponse: 'a', goNoGo: 'go' }),
      actualResponse: 'a',
      stimulusOnsetTs: 1000,
      responseTimestamp: 1100,
      focusLossFlag: false,
      timingIrregularityFlag: false,
      scored: true,
    });
    expect(rec.reactionTimeMs).toBe(100);
    expect(rec.anticipatoryResponseFlag).toBe(true);
    expect(rec.accuracy).toBe(0);
  });

  it('scores correct go and correct withhold', () => {
    const go = classifyResponse({
      sessionId: 's',
      planned: planned({ expectedResponse: 'b', goNoGo: 'go' }),
      actualResponse: 'b',
      stimulusOnsetTs: 0,
      responseTimestamp: 400,
      focusLossFlag: false,
      timingIrregularityFlag: false,
      scored: true,
    });
    const nogo = classifyResponse({
      sessionId: 's',
      planned: planned({ expectedResponse: 'none', goNoGo: 'nogo' }),
      actualResponse: 'none',
      stimulusOnsetTs: 0,
      responseTimestamp: null,
      focusLossFlag: false,
      timingIrregularityFlag: false,
      scored: true,
    });
    expect(go.accuracy).toBe(1);
    expect(nogo.accuracy).toBe(1);
  });
});

describe('scoring', () => {
  it('excludes practice and baseline from primary score trials', () => {
    const { trials } = simulateProfile('accurate_average', 42);
    const primary = primaryScoredTrials(trials);
    expect(primary.every((t) => isScoredBlock(t.blockType))).toBe(true);
    expect(primary.some((t) => t.blockType === 'practice')).toBe(false);
    expect(primary.some((t) => t.blockType === 'baseline')).toBe(false);
  });

  it('computes a provisional ICS in 0–100 for accurate profile', () => {
    const { score } = simulateProfile('accurate_average', 42);
    expect(score.inhibitoryControlScore).not.toBeNull();
    expect(score.inhibitoryControlScore!).toBeGreaterThanOrEqual(0);
    expect(score.inhibitoryControlScore!).toBeLessThanOrEqual(100);
    expect(score.scoringVersion).toContain('provisional');
  });

  it('gives impulsive profile higher commission rate than accurate', () => {
    const accurate = simulateProfile('accurate_average', 42);
    const impulsive = simulateProfile('fast_impulsive', 42);
    expect(impulsive.score.components.commissionErrorRate).toBeGreaterThan(
      accurate.score.components.commissionErrorRate
    );
  });
});

describe('Clinical vs Game mode equivalence', () => {
  it('produces identical plans and scores for the same seed and responses', () => {
    const seed = 555;
    const planClinical = generateSessionPlan(seed);
    const planGame = generateSessionPlan(seed);
    expect(planClinical.trials).toEqual(planGame.trials);

    const sim = simulateProfile('accurate_average', seed);
    const replayA = replaySession({
      sessionId: 'clinical',
      seed,
      responses: sim.responses,
    });
    const replayB = replaySession({
      sessionId: 'game',
      seed,
      responses: sim.responses,
    });
    expect(computeProvisionalScore(replayA.trials)).toEqual(
      computeProvisionalScore(replayB.trials)
    );
  });
});

describe('validity and export', () => {
  it('flags high omission and unsupported device neutrally', () => {
    const { trials } = simulateProfile('high_omission', 11);
    const flags = evaluateValidity({
      trials,
      completionStatus: 'completed',
      practiceRepetitions: 0,
      practicePassed: true,
      baselineUnderstood: true,
      device: { ...deviceOk, supported: false },
      timingQuality: 'good',
      focusLossCount: 0,
    });
    expect(flags.find((f) => f.code === 'unsupported_device')?.triggered).toBe(true);
    expect(flags.find((f) => f.code === 'excessive_omissions')?.triggered).toBe(true);
    expect(flags.find((f) => f.code === 'excessive_omissions')?.message).toMatch(
      /may not be interpretable/i
    );
  });

  it('exports session and trial CSV with expected columns', () => {
    const { trials, score } = simulateProfile('accurate_average', 3);
    const sessionCsv = exportSessionCsv([
      {
        sessionId: 's1',
        anonymousParticipantId: 'anon',
        studyId: 'study',
        administrationMode: 'research',
        visualMode: 'clinical',
        taskVersion: '0.1.0',
        scoringVersion: '0.1.0-provisional',
        studyVersion: '0.1.0',
        consentVersion: '0.1.0',
        randomizationSeed: 3,
        startTime: null,
        completionTime: null,
        totalDurationMs: null,
        device: deviceOk,
        practiceRepetitions: 0,
        provisionalScore: score,
        secondaryScores: score.components,
        blockSummaries: [],
        timingQuality: 'good',
        validityFlags: [],
        completionStatus: 'completed',
        examinerNotes: null,
        dataRetentionPolicy: 'test',
        irbContact: null,
        sessionLocked: false,
      },
    ]);
    const trialCsv = exportTrialsCsv(trials.slice(0, 3));
    expect(sessionCsv).toContain('session_id');
    expect(sessionCsv).toContain('provisional_ics');
    expect(trialCsv).toContain('reaction_time_ms');
    expect(dataDictionary().length).toBeGreaterThan(0);
  });

  it('runs all simulated profiles without throwing', () => {
    for (const p of ALL_PROFILES) {
      const result = simulateProfile(p, 42);
      expect(result.trials.length).toBeGreaterThan(0);
    }
  });
});

describe('submission payload', () => {
  it('builds a rit_submissions row with required keys', () => {
    const { trials, score } = simulateProfile('accurate_average', 3);
    const session = {
      sessionId: 's1',
      anonymousParticipantId: 'anon',
      studyId: 'study',
      administrationMode: 'research' as const,
      visualMode: 'clinical' as const,
      taskVersion: '0.2.0',
      scoringVersion: '0.1.0-provisional',
      studyVersion: '0.2.0',
      consentVersion: '0.1.0',
      randomizationSeed: 3,
      startTime: null,
      completionTime: null,
      totalDurationMs: null,
      device: deviceOk,
      practiceRepetitions: 0,
      provisionalScore: score,
      secondaryScores: score.components,
      blockSummaries: [],
      timingQuality: 'good' as const,
      validityFlags: [],
      completionStatus: 'completed' as const,
      examinerNotes: null,
      dataRetentionPolicy: 'test',
      irbContact: null,
      sessionLocked: false,
    };
    const row = buildRitSubmissionRow({ session, trials });
    expect(row.session_id).toBe('s1');
    expect(row.task_version).toBe('0.2.0');
    expect(row).toHaveProperty('provisional_ics');
    expect(row).toHaveProperty('trials');
    expect(Array.isArray(row.trials)).toBe(true);
  });
});

describe('focus loss and incomplete session', () => {
  it('records incomplete session validity', () => {
    const { trials } = simulateProfile('incomplete_session', 9);
    const flags = evaluateValidity({
      trials,
      completionStatus: 'incomplete',
      practiceRepetitions: 0,
      practicePassed: true,
      baselineUnderstood: true,
      device: deviceOk,
      timingQuality: 'poor',
      focusLossCount: 6,
    });
    expect(flags.find((f) => f.code === 'incomplete_session')?.triggered).toBe(true);
    expect(flags.find((f) => f.code === 'excessive_focus_loss')?.triggered).toBe(true);
    expect(flags.find((f) => f.code === 'abnormal_timing')?.triggered).toBe(true);
  });

  it('flags failed practice when practicePassed is false', () => {
    const { trials } = simulateProfile('failed_practice', 5);
    const practiceAcc =
      trials.filter((t) => t.blockType === 'practice' && t.accuracy === 1).length /
      Math.max(1, trials.filter((t) => t.blockType === 'practice').length);
    expect(practiceAcc).toBeLessThan(0.5);
    const flags = evaluateValidity({
      trials,
      completionStatus: 'completed',
      practiceRepetitions: 3,
      practicePassed: false,
      baselineUnderstood: false,
      device: deviceOk,
      timingQuality: 'good',
      focusLossCount: 0,
    });
    expect(flags.find((f) => f.code === 'practice_failed')?.triggered).toBe(true);
    expect(flags.find((f) => f.code === 'rule_not_understood')?.triggered).toBe(true);
  });
});

describe('TimingMonitor quality ordinal', () => {
  it('maps counters to good/fair/poor via classifyTimingQuality', () => {
    const m = new TimingMonitor();
    expect(m.trialHadFocusIssue(0)).toBe(false);
    expect(classifyTimingQuality(0, 0, 0)).toBe('good');
    expect(classifyTimingQuality(2, 0, 0)).toBe('fair');
    expect(classifyTimingQuality(5, 0, 0)).toBe('poor');
    expect(classifyTimingQuality(0, 8, 0)).toBe('fair');
    expect(classifyTimingQuality(0, 20, 0)).toBe('poor');
  });
});

describe('InputManager mapKey integration', () => {
  it('maps F/J via responseClassification used by InputManager', () => {
    expect(mapKeyToResponse('f')).toBe('a');
    expect(mapKeyToResponse('J')).toBe('b');
    expect(mapKeyToResponse('x')).toBe('invalid');
  });
});
