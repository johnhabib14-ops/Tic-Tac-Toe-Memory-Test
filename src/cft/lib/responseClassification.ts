import type {
  ActualResponse,
  ErrorType,
  PlannedTrial,
  RuleFeature,
  TrialRecord,
} from '../types';
import { TASK_CONFIG } from '../config/taskConfig';

export function mapKeyToResponse(key: string): ActualResponse | null {
  if ((TASK_CONFIG.keys.responseA as readonly string[]).includes(key)) return 'a';
  if ((TASK_CONFIG.keys.responseB as readonly string[]).includes(key)) return 'b';
  return null;
}

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

/**
 * Classify response accuracy and error taxonomy for set-shifting.
 * Priority when wrong: omission/anticipatory/invalid → perseverative → conflict → cue_processing → rule_maintenance → other
 */
export function classifyErrorType(
  planned: PlannedTrial,
  actual: ActualResponse,
  anticipatory: boolean
): ErrorType {
  if (actual === 'invalid') return 'invalid';
  if (actual === 'none' || anticipatory) return anticipatory ? 'anticipatory' : 'omission';
  if (actual === planned.expectedResponse) return null;

  // Perseverative: matches previous rule after a switch
  if (
    planned.isSwitch &&
    planned.previousRule != null &&
    actual === planned.responseByFeature[planned.previousRule]
  ) {
    return 'perseverative';
  }

  // Conflict: incongruent trial and response matches an irrelevant feature
  if (planned.congruency === 'incongruent') {
    const irrelevant = (Object.keys(planned.responseByFeature) as RuleFeature[]).filter(
      (r) => r !== planned.rule
    );
    if (irrelevant.some((r) => planned.responseByFeature[r] === actual)) {
      return 'conflict';
    }
  }

  // Cue-processing: matches a non-cued rule (and not already tagged perseverative)
  const otherRules = (Object.keys(planned.responseByFeature) as RuleFeature[]).filter(
    (r) => r !== planned.rule
  );
  if (otherRules.some((r) => planned.responseByFeature[r] === actual)) {
    return 'cue_processing';
  }

  if (!planned.isSwitch) return 'rule_maintenance';
  return 'other';
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
  const anticipatory = rt != null && rt < TASK_CONFIG.anticipatoryRtMs;
  const isInvalid = actualResponse === 'invalid';
  const omission = actualResponse === 'none' || anticipatory || isInvalid;
  const accuracy: 0 | 1 =
    !omission && !anticipatory && actualResponse === planned.expectedResponse
      ? 1
      : 0;

  const errorType =
    accuracy === 1
      ? null
      : classifyErrorType(planned, actualResponse, anticipatory);

  return {
    sessionId,
    blockId: planned.blockId,
    blockType: planned.blockType,
    trialNumber: planned.trialNumber,
    stimulusId: planned.stimulusId,
    stimulusProperties: planned.stimulus,
    rule: planned.rule,
    previousRule: planned.previousRule,
    isSwitch: planned.isSwitch,
    congruency: planned.congruency,
    expectedResponse: planned.expectedResponse,
    actualResponse,
    responseByFeature: planned.responseByFeature,
    accuracy,
    reactionTimeMs: anticipatory ? rt : actualResponse === 'none' ? null : rt,
    stimulusOnsetTs,
    responseTimestamp,
    interstimulusIntervalMs: planned.isiMs,
    errorType,
    anticipatoryResponseFlag: anticipatory,
    omissionFlag: actualResponse === 'none' || anticipatory,
    focusLossFlag,
    timingIrregularityFlag,
    invalidKeyFlag: actualResponse === 'invalid',
    scored,
  };
}

/** Alias matching plan naming */
export const ErrorClassifier = { classifyErrorType, classifyResponse };
