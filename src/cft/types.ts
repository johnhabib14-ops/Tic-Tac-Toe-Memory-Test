/**
 * Cognitive Flexibility Task (CFT) — experimental research types.
 * Not a diagnostic, validated, or normed clinical instrument.
 */

export const CFT_TASK_VERSION = '0.1.0';
export const CFT_SCORING_VERSION = '0.1.0-provisional';
export const CFT_CONSENT_VERSION = '0.1.0';
export const CFT_STUDY_VERSION = '0.1.0';

export type VisualMode = 'clinical' | 'game';
export type AdministrationMode = 'supervised_clinical' | 'research' | 'public';
export type ProtocolProfile = 'full' | 'pilot' | 'demo';

export type CFTPhase =
  | 'mode_select'
  | 'admin_setup'
  | 'research_intake'
  | 'public_intake'
  | 'consent'
  | 'eligibility'
  | 'demographics'
  | 'device_check'
  | 'orientation'
  | 'practice'
  | 'rule_learning'
  | 'predictable_switch'
  | 'cued_switch'
  | 'interference'
  | 'adaptive'
  | 'completion'
  | 'debrief'
  | 'clinical_results'
  | 'research_dashboard'
  | 'session_replay'
  | 'locked';

export type BlockType =
  | 'practice'
  | 'rule_learning'
  | 'predictable_switch'
  | 'cued_switch'
  | 'interference'
  | 'adaptive';

/** Active categorization rule (relevant stimulus feature). */
export type RuleFeature = 'shape' | 'pattern' | 'number';

export type ShapeValue = 'circle' | 'square';
export type PatternValue = 'solid' | 'striped';
export type NumberValue = 'one' | 'two';

export type ExpectedResponse = 'a' | 'b';
export type ActualResponse = 'a' | 'b' | 'none' | 'invalid';

export type Congruency = 'congruent' | 'incongruent';

export type ErrorType =
  | null
  | 'perseverative'
  | 'rule_maintenance'
  | 'cue_processing'
  | 'conflict'
  | 'omission'
  | 'anticipatory'
  | 'invalid'
  | 'other';

export type InputMethod = 'keyboard' | 'touch' | 'mixed' | 'unknown';
export type DeviceType = 'desktop' | 'tablet' | 'phone' | 'unsupported' | 'unknown';
export type TimingQuality = 'good' | 'fair' | 'poor' | 'unknown';

export interface StimulusFeatures {
  shape: ShapeValue;
  pattern: PatternValue;
  number: NumberValue;
}

export interface StimulusProperties {
  features: StimulusFeatures;
  /** Cue text token for accessibility / labeling */
  label: string;
}

export interface PlannedTrial {
  trialNumber: number;
  blockId: string;
  blockType: BlockType;
  stimulusId: string;
  stimulus: StimulusProperties;
  rule: RuleFeature;
  previousRule: RuleFeature | null;
  isSwitch: boolean;
  congruency: Congruency;
  expectedResponse: ExpectedResponse;
  /** Response implied by each feature under fixed mapping (for error taxonomy). */
  responseByFeature: Record<RuleFeature, ExpectedResponse>;
  stimulusDurationMs: number;
  isiMs: number;
}

export interface TrialRecord {
  sessionId: string;
  blockId: string;
  blockType: BlockType;
  trialNumber: number;
  stimulusId: string;
  stimulusProperties: StimulusProperties;
  rule: RuleFeature;
  previousRule: RuleFeature | null;
  isSwitch: boolean;
  congruency: Congruency;
  expectedResponse: ExpectedResponse;
  actualResponse: ActualResponse;
  responseByFeature: Record<RuleFeature, ExpectedResponse>;
  accuracy: 0 | 1;
  reactionTimeMs: number | null;
  stimulusOnsetTs: number;
  responseTimestamp: number | null;
  interstimulusIntervalMs: number;
  errorType: ErrorType;
  anticipatoryResponseFlag: boolean;
  omissionFlag: boolean;
  focusLossFlag: boolean;
  timingIrregularityFlag: boolean;
  invalidKeyFlag: boolean;
  scored: boolean;
}

export interface BlockSummary {
  blockType: BlockType;
  trialCount: number;
  accuracy: number;
  meanCorrectRtMs: number | null;
  switchAccuracy: number | null;
  stayAccuracy: number | null;
  perseverativeRate: number;
  omissionRate: number;
}

export interface ComponentScores {
  switchAccuracy: number | null;
  stayAccuracy: number | null;
  switchCostRtMs: number | null;
  switchCostAccuracy: number | null;
  perseverativeErrorRate: number;
  ruleMaintenanceErrorRate: number;
  cueProcessingErrorRate: number;
  conflictAccuracy: number | null;
  omissionErrorRate: number;
  meanCorrectRtMs: number | null;
  medianCorrectRtMs: number | null;
  rtSdMs: number | null;
  rtCv: number | null;
  anticipatoryCount: number;
  postErrorRecovery: number | null;
  highInterferenceAccuracy: number | null;
}

export interface ProvisionalScore {
  cognitiveFlexibilityScore: number | null;
  components: ComponentScores;
  scoringVersion: string;
  weightsId: string;
  note: string;
}

export interface ValidityFlag {
  code: string;
  message: string;
  triggered: boolean;
}

export interface DeviceInfo {
  deviceType: DeviceType;
  inputMethod: InputMethod;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  refreshRateHz: number | null;
  touchCapable: boolean;
  supported: boolean;
  supportNotes: string[];
}

export interface Demographics {
  ageYears: number | null;
  ageBand: string | null;
  educationLevel: string | null;
  dominantHand: string | null;
  primaryLanguage: string | null;
  region: string | null;
  sleepEstimateHours: number | null;
  recentCaffeine: string | null;
  visionCorrection: string | null;
  colorVisionDifficulty: string | null;
  neurologicalHistoryOptIn: string | null;
}

export interface ConsentRecord {
  consentVersion: string;
  acceptedAt: string;
  anonymousParticipation: boolean;
  recontactPermission: boolean;
  recontactContactSeparated: boolean;
  withdrawBeforeSubmit: boolean;
}

export interface SessionRecord {
  sessionId: string;
  anonymousParticipantId: string;
  studyId: string;
  administrationMode: AdministrationMode;
  visualMode: VisualMode;
  taskVersion: string;
  scoringVersion: string;
  studyVersion: string;
  consentVersion: string;
  randomizationSeed: number;
  startTime: string | null;
  completionTime: string | null;
  totalDurationMs: number | null;
  device: DeviceInfo;
  practiceRepetitions: number;
  provisionalScore: ProvisionalScore | null;
  secondaryScores: ComponentScores | null;
  blockSummaries: BlockSummary[];
  timingQuality: TimingQuality;
  validityFlags: ValidityFlag[];
  completionStatus: 'in_progress' | 'completed' | 'withdrawn' | 'incomplete' | 'locked';
  examinerNotes: string | null;
  dataRetentionPolicy: string;
  irbContact: string | null;
  sessionLocked: boolean;
  /** Present when run as part of a sequenced battery session. */
  batteryId?: string | null;
}

export interface CFTParticipantMeta {
  participantCode: string;
  studyCode: string;
  examinerId: string | null;
}

export type AccessibilityPrefs = {
  highContrast: boolean;
  reducedMotion: boolean;
  soundOff: boolean;
  scalableText: boolean;
};

export interface TimingEvent {
  type: 'visibility_hidden' | 'visibility_visible' | 'focus_loss' | 'focus_gain' | 'frame_drop';
  timestamp: number;
}
