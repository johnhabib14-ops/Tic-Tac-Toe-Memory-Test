import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getTaskConfig,
  resolveProtocolProfileFromSearch,
  type ProtocolProfile,
} from './config/taskConfig';
import {
  createAnonymousId,
  createSeed,
  createSessionId,
  detectDeviceInfo,
} from './lib/deviceCheck';
import {
  allBlockSummaries,
  computeComponentScores,
  computeProvisionalScore,
} from './lib/ScoringEngine';
import { evaluateValidity } from './lib/ValidityEngine';
import { getBatteryId } from '../lib/batterySession';
import type {
  AccessibilityPrefs,
  AdministrationMode,
  ConsentRecord,
  Demographics,
  DeviceInfo,
  PlannedTrial,
  CFTParticipantMeta,
  CFTPhase,
  SessionRecord,
  TrialRecord,
  VisualMode,
} from './types';
import {
  CFT_CONSENT_VERSION,
  CFT_SCORING_VERSION,
  CFT_STUDY_VERSION,
} from './types';
import { generateSessionPlan } from './lib/TrialGenerator';

interface CFTStateValue {
  phase: CFTPhase;
  setPhase: (p: CFTPhase) => void;
  visualMode: VisualMode;
  setVisualMode: (m: VisualMode) => void;
  administrationMode: AdministrationMode;
  setAdministrationMode: (m: AdministrationMode) => void;
  meta: CFTParticipantMeta;
  setMeta: (m: CFTParticipantMeta) => void;
  demographics: Demographics;
  setDemographics: (d: Demographics) => void;
  consent: ConsentRecord | null;
  setConsent: (c: ConsentRecord | null) => void;
  accessibility: AccessibilityPrefs;
  setAccessibility: (a: AccessibilityPrefs) => void;
  device: DeviceInfo;
  refreshDevice: () => void;
  sessionId: string;
  seed: number;
  setSeed: (s: number) => void;
  plan: PlannedTrial[];
  regeneratePlan: (seed?: number) => void;
  trials: TrialRecord[];
  addTrial: (t: TrialRecord) => void;
  setTrials: (t: TrialRecord[]) => void;
  practiceRepetitions: number;
  setPracticeRepetitions: (n: number) => void;
  practicePassed: boolean;
  setPracticePassed: (v: boolean) => void;
  baselineUnderstood: boolean;
  setBaselineUnderstood: (v: boolean) => void;
  focusLossCount: number;
  setFocusLossCount: (n: number) => void;
  examinerNotes: string;
  setExaminerNotes: (n: string) => void;
  startTime: string | null;
  setStartTime: (t: string | null) => void;
  completionTime: string | null;
  setCompletionTime: (t: string | null) => void;
  completionStatus: SessionRecord['completionStatus'];
  setCompletionStatus: (s: SessionRecord['completionStatus']) => void;
  sessionLocked: boolean;
  setSessionLocked: (v: boolean) => void;
  protocolProfile: ProtocolProfile;
  setProtocolProfile: (p: ProtocolProfile) => void;
  buildSessionRecord: () => SessionRecord;
  resetSession: () => void;
}

const defaultDemographics = (): Demographics => ({
  ageYears: null,
  ageBand: null,
  educationLevel: null,
  dominantHand: null,
  primaryLanguage: null,
  region: null,
  sleepEstimateHours: null,
  recentCaffeine: null,
  visionCorrection: null,
  colorVisionDifficulty: null,
  neurologicalHistoryOptIn: null,
});

const defaultMeta = (): CFTParticipantMeta => ({
  participantCode: createAnonymousId(),
  studyCode: 'CFT-DEV',
  examinerId: null,
});

const CFTContext = createContext<CFTStateValue | null>(null);

function initialProtocolProfile(): ProtocolProfile {
  if (typeof window === 'undefined') return 'full';
  return resolveProtocolProfileFromSearch(window.location.search);
}

export function CFTStateProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<CFTPhase>('mode_select');
  const [visualMode, setVisualMode] = useState<VisualMode>('clinical');
  const [administrationMode, setAdministrationMode] =
    useState<AdministrationMode>('research');
  const [protocolProfile, setProtocolProfileState] =
    useState<ProtocolProfile>(initialProtocolProfile);
  const [meta, setMeta] = useState<CFTParticipantMeta>(defaultMeta);
  const [demographics, setDemographics] = useState<Demographics>(defaultDemographics);
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [accessibility, setAccessibility] = useState<AccessibilityPrefs>({
    highContrast: false,
    reducedMotion: false,
    soundOff: true,
    scalableText: false,
  });
  const [device, setDevice] = useState<DeviceInfo>(() => detectDeviceInfo());
  const [sessionId] = useState(() => createSessionId());
  const [seed, setSeed] = useState(() => createSeed());
  const [plan, setPlan] = useState<PlannedTrial[]>(() =>
    generateSessionPlan(seed, getTaskConfig(initialProtocolProfile())).trials
  );
  const [trials, setTrials] = useState<TrialRecord[]>([]);
  const [practiceRepetitions, setPracticeRepetitions] = useState(0);
  const [practicePassed, setPracticePassed] = useState(false);
  const [baselineUnderstood, setBaselineUnderstood] = useState(true);
  const [focusLossCount, setFocusLossCount] = useState(0);
  const [examinerNotes, setExaminerNotes] = useState('');
  const [startTime, setStartTime] = useState<string | null>(null);
  const [completionTime, setCompletionTime] = useState<string | null>(null);
  const [completionStatus, setCompletionStatus] =
    useState<SessionRecord['completionStatus']>('in_progress');
  const [sessionLocked, setSessionLocked] = useState(false);

  const refreshDevice = useCallback(() => setDevice(detectDeviceInfo()), []);

  const regeneratePlan = useCallback(
    (nextSeed?: number, profile?: ProtocolProfile) => {
      const s = nextSeed ?? createSeed();
      const p = profile ?? protocolProfile;
      setSeed(s);
      setPlan(generateSessionPlan(s, getTaskConfig(p)).trials);
    },
    [protocolProfile]
  );

  const setProtocolProfile = useCallback(
    (p: ProtocolProfile) => {
      setProtocolProfileState(p);
      setPlan(generateSessionPlan(seed, getTaskConfig(p)).trials);
    },
    [seed]
  );

  const addTrial = useCallback((t: TrialRecord) => {
    setTrials((prev) => [...prev, t]);
  }, []);

  const buildSessionRecord = useCallback((): SessionRecord => {
    const config = getTaskConfig(protocolProfile);
    const provisional = computeProvisionalScore(trials);
    const timingQuality =
      focusLossCount >= 5 ? 'poor' : focusLossCount >= 2 ? 'fair' : 'good';
    const validityFlags = evaluateValidity({
      trials,
      completionStatus,
      practiceRepetitions,
      practicePassed,
      baselineUnderstood,
      device,
      focusLossCount,
    });
    const start = startTime ? new Date(startTime).getTime() : null;
    const end = completionTime ? new Date(completionTime).getTime() : null;

    return {
      sessionId,
      anonymousParticipantId: meta.participantCode,
      studyId: meta.studyCode,
      administrationMode,
      visualMode,
      taskVersion: config.taskVersion,
      scoringVersion: CFT_SCORING_VERSION,
      studyVersion: CFT_STUDY_VERSION,
      consentVersion: consent?.consentVersion ?? CFT_CONSENT_VERSION,
      randomizationSeed: seed,
      startTime,
      completionTime,
      totalDurationMs: start != null && end != null ? end - start : null,
      device,
      practiceRepetitions,
      provisionalScore: provisional,
      secondaryScores: computeComponentScores(trials),
      blockSummaries: allBlockSummaries(trials),
      timingQuality,
      validityFlags,
      completionStatus,
      examinerNotes:
        administrationMode === 'supervised_clinical' ? examinerNotes || null : null,
      dataRetentionPolicy: config.dataRetentionPolicyDefault,
      irbContact: null,
      sessionLocked,
      batteryId: getBatteryId(),
    };
  }, [
    trials,
    focusLossCount,
    completionStatus,
    practiceRepetitions,
    practicePassed,
    baselineUnderstood,
    device,
    startTime,
    completionTime,
    sessionId,
    meta,
    administrationMode,
    visualMode,
    consent,
    seed,
    examinerNotes,
    sessionLocked,
    protocolProfile,
  ]);

  const resetSession = useCallback(() => {
    setPhase('mode_select');
    setTrials([]);
    setPracticeRepetitions(0);
    setPracticePassed(false);
    setBaselineUnderstood(true);
    setFocusLossCount(0);
    setExaminerNotes('');
    setStartTime(null);
    setCompletionTime(null);
    setCompletionStatus('in_progress');
    setSessionLocked(false);
    setConsent(null);
    setMeta(defaultMeta());
    setDemographics(defaultDemographics());
    regeneratePlan();
  }, [regeneratePlan]);

  const value = useMemo<CFTStateValue>(
    () => ({
      phase,
      setPhase,
      visualMode,
      setVisualMode,
      administrationMode,
      setAdministrationMode,
      meta,
      setMeta,
      demographics,
      setDemographics,
      consent,
      setConsent,
      accessibility,
      setAccessibility,
      device,
      refreshDevice,
      sessionId,
      seed,
      setSeed,
      plan,
      regeneratePlan,
      trials,
      addTrial,
      setTrials,
      practiceRepetitions,
      setPracticeRepetitions,
      practicePassed,
      setPracticePassed,
      baselineUnderstood,
      setBaselineUnderstood,
      focusLossCount,
      setFocusLossCount,
      examinerNotes,
      setExaminerNotes,
      startTime,
      setStartTime,
      completionTime,
      setCompletionTime,
      completionStatus,
      setCompletionStatus,
      sessionLocked,
      setSessionLocked,
      protocolProfile,
      setProtocolProfile,
      buildSessionRecord,
      resetSession,
    }),
    [
      phase,
      visualMode,
      administrationMode,
      meta,
      demographics,
      consent,
      accessibility,
      device,
      refreshDevice,
      sessionId,
      seed,
      plan,
      regeneratePlan,
      trials,
      addTrial,
      practiceRepetitions,
      practicePassed,
      baselineUnderstood,
      focusLossCount,
      examinerNotes,
      startTime,
      completionTime,
      completionStatus,
      sessionLocked,
      protocolProfile,
      setProtocolProfile,
      buildSessionRecord,
      resetSession,
    ]
  );

  return <CFTContext.Provider value={value}>{children}</CFTContext.Provider>;
}

export function useCFTState(): CFTStateValue {
  const ctx = useContext(CFTContext);
  if (!ctx) throw new Error('useCFTState must be used within CFTStateProvider');
  return ctx;
}
