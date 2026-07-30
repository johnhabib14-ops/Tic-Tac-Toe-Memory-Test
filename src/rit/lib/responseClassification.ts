import { TASK_CONFIG } from '../config/taskConfig';
import type { ActualResponse, ExpectedResponse, PlannedTrial, TrialRecord } from '../types';

export interface ClassifyInput {
  sessionId: string;
  planned: PlannedTrial;
  actualResponse: ActualResponse;
  stimulusOnsetTs: number;
  responseTimestamp: number | null;
  focusLossFlag: boolean;
  timingIrregularityFlag: boolean;
  scored: boolean;
}

export function classifyResponse(input: ClassifyInput): TrialRecord {
  const {
    sessionId,
    planned,
    actualResponse,
    stimulusOnsetTs,
    responseTimestamp,
    focusLossFlag,
    timingIrregularityFlag,
    scored,
  } = input;

  const rt =
    responseTimestamp != null && actualResponse !== 'none'
      ? responseTimestamp - stimulusOnsetTs
      : null;

  const anticipatory =
    rt != null && rt < TASK_CONFIG.anticipatoryRtMs;

  const expected = planned.expectedResponse;
  const omission = expected !== 'none' && (actualResponse === 'none' || anticipatory);
  const commission =
    expected === 'none' && (actualResponse === 'a' || actualResponse === 'b');

  const invalidKey = actualResponse === 'invalid';

  let accuracy: 0 | 1 = 0;
  if (!anticipatory && !invalidKey) {
    if (expected === 'none' && actualResponse === 'none') accuracy = 1;
    else if (expected !== 'none' && actualResponse === expected) accuracy = 1;
  }

  // Anticipatory on go trials count as incorrect omissions for scoring purposes
  const omissionFlag = omission || (expected !== 'none' && anticipatory);
  const commissionErrorFlag = commission;

  return {
    sessionId,
    blockId: planned.blockId,
    blockType: planned.blockType,
    trialNumber: planned.trialNumber,
    stimulusId: planned.stimulusId,
    stimulusProperties: planned.stimulus,
    goNoGo: planned.goNoGo,
    applicableRule: planned.rule,
    expectedResponse: expected,
    actualResponse,
    accuracy,
    reactionTimeMs: anticipatory ? rt : rt,
    stimulusOnsetTs,
    responseTimestamp,
    interstimulusIntervalMs: planned.isiMs,
    anticipatoryResponseFlag: anticipatory,
    omissionFlag,
    commissionErrorFlag,
    focusLossFlag,
    timingIrregularityFlag,
    invalidKeyFlag: invalidKey,
    scored,
  };
}

export function mapKeyToResponse(key: string): ActualResponse | null {
  const aKeys: readonly string[] = TASK_CONFIG.keys.responseA;
  const bKeys: readonly string[] = TASK_CONFIG.keys.responseB;
  if (aKeys.includes(key)) return 'a';
  if (bKeys.includes(key)) return 'b';
  // Known non-response keys during trial are invalid if printable/control responses
  if (key.length === 1 || key.startsWith('Arrow')) return 'invalid';
  return null;
}

export function isCorrect(expected: ExpectedResponse, actual: ActualResponse): boolean {
  if (actual === 'invalid') return false;
  return expected === actual || (expected === 'none' && actual === 'none');
}
