/**
 * Editable validity thresholds for CFT session flags.
 */

export const VALIDITY_THRESHOLDS = {
  version: '0.1.0',
  excessiveOmissionRate: 0.35,
  chanceLevelAccuracy: 0.55,
  extremelyRapidMeanRtMs: 200,
  repeatedAnticipatoryCount: 8,
  excessiveFocusLossCount: 5,
  abnormalTimingIrregularityRate: 0.25,
  repeatedIdenticalResponseRun: 15,
  practiceFailRepetitions: 3,
  excessivePerseverativeRate: 0.45,
  ruleLearningMinAccuracy: 0.55,
} as const;

export type ValidityThresholds = typeof VALIDITY_THRESHOLDS;
