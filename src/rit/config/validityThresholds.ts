/**
 * Configurable session validity thresholds.
 * Flags use neutral wording; they do not imply malingering.
 */

export const VALIDITY_THRESHOLDS = {
  version: '0.1.0',
  excessiveOmissionRate: 0.4,
  chanceLevelAccuracy: 0.55,
  extremelyRapidMeanRtMs: 200,
  repeatedAnticipatoryCount: 8,
  excessiveFocusLossCount: 5,
  abnormalTimingIrregularityRate: 0.25,
  repeatedIdenticalResponseRun: 15,
  practiceFailRepetitions: 3,
} as const;

export const VALIDITY_MESSAGES = {
  excessive_omissions:
    'Performance may not be interpretable because task engagement or technical conditions were inconsistent (high omission rate).',
  chance_accuracy:
    'Performance may not be interpretable because overall accuracy was near chance level.',
  extremely_rapid:
    'Performance may not be interpretable because many responses were extremely rapid.',
  repeated_anticipatory:
    'Performance may not be interpretable because of repeated anticipatory responses.',
  excessive_focus_loss:
    'Performance may not be interpretable because the browser lost focus repeatedly during trials.',
  incomplete_session:
    'Performance may not be interpretable because the session was incomplete.',
  abnormal_timing:
    'Performance may not be interpretable because timing quality was unstable.',
  unsupported_device:
    'Performance may not be interpretable because the device or screen size was unsupported.',
  repeated_response_pattern:
    'Performance may not be interpretable because of a highly repetitive response pattern.',
  practice_failed:
    'Performance may not be interpretable because practice criteria were not met.',
  rule_not_understood:
    'Performance may not be interpretable because baseline comprehension suggested the response rules were not understood.',
} as const;
