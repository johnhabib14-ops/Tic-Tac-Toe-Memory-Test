/**
 * Response Inhibition Task (RIT) — experimental research types.
 * Not a diagnostic, validated, or normed clinical instrument.
 */

export const RIT_TASK_VERSION = '0.2.0';
export const RIT_SCORING_VERSION = '0.1.0-provisional';
export const RIT_CONSENT_VERSION = '0.1.0';
export const RIT_STUDY_VERSION = '0.2.0';

export type VisualMode = 'clinical' | 'game';
export type AdministrationMode = 'supervised_clinical' | 'research' | 'public';
export type ProtocolProfile = 'full' | 'pilot' | 'demo';

export type RITPhase =
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
  | 'baseline'
  | 'habit'
  | 'standard'
  | 'interference'
  | 'adaptive' // architected; disabled until audited
  | 'completion'
  | 'debrief'
  | 'clinical_results'
  | 'research_dashboard'
  | 'session_replay'
  | 'locked';


export type BlockType =
  | 'practice'
  | 'baseline'
  | 'habit'
  | 'standard'
  | 'interference'
  | 'adaptive';

export type StimulusKind = 'go_a' | 'go_b' | 'nogo';
export type ExpectedResponse = 'a' | 'b' | 'none';
export type ActualResponse = 'a' | 'b' | 'none' | 'invalid';
export type ResponseRule = 'standard' | 'reversed_mapping';

export type InputMethod = 'keyboard' | 'touch' | 'mixed' | 'unknown';
export type DeviceType = 'desktop' | 'tablet' | 'phone' | 'unsupported' | 'unknown';
export type TimingQuality = 'good' | 'fair' | 'poor' | 'unknown';

export interface StimulusProperties {
  kind: StimulusKind;
  shape: 'diamond' | 'hexagon';
  colorToken: 'signal_blue' | 'signal_amber';
  hasStopCue: boolean;
  hasReverseFrame: boolean;
  label: string;
}

export interface PlannedTrial {
  trialNumber: number;
  blockId: string;
  blockType: BlockType;
  stimulusId: string;
  stimulus: StimulusProperties;
  goNoGo: 'go' | 'nogo';
  rule: ResponseRule;
  expectedResponse: ExpectedResponse;
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
  goNoGo: 'go' | 'nogo';
  applicableRule: ResponseRule;
  expectedResponse: ExpectedResponse;
  actualResponse: ActualResponse;
  accuracy: 0 | 1;
  reactionTimeMs: number | null;
  stimulusOnsetTs: number;
  responseTimestamp: number | null;
  interstimulusIntervalMs: number;
  anticipatoryResponseFlag: boolean;
  omissionFlag: boolean;
  commissionErrorFlag: boolean;
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
  commissionRate: number;
  omissionRate: number;
}

export interface ComponentScores {
  commissionErrorRate: number;
  omissionErrorRate: number;
  meanCorrectRtMs: number | null;
  medianCorrectRtMs: number | null;
  rtSdMs: number | null;
  rtCv: number | null;
  anticipatoryCount: number;
  postErrorSlowingMs: number | null;
  highInterferenceAccuracy: number | null;
  highInterferenceMeanRtMs: number | null;
  speedAccuracyTradeoff: number | null;
  excessiveSlowingFlag: boolean;
}

export interface ProvisionalScore {
  inhibitoryControlScore: number | null;
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

export interface RITParticipantMeta {
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
