import type { SessionRecord, TrialRecord } from '../types';
import { performanceChangeAcrossBlocks } from './ScoringEngine';

export interface DataDictionaryEntry {
  variable_name: string;
  label: string;
  data_type: string;
  allowable_values: string;
  missing_value_code: string;
  scoring_role: string;
  privacy_classification: 'public_ok' | 'sensitive_optional' | 'internal' | 'performance';
}

export function sessionToFlatRow(session: SessionRecord): Record<string, string | number | null> {
  const c = session.provisionalScore?.components;
  return {
    session_id: session.sessionId,
    anonymous_participant_id: session.anonymousParticipantId,
    study_id: session.studyId,
    administration_mode: session.administrationMode,
    visual_mode: session.visualMode,
    task_version: session.taskVersion,
    scoring_version: session.scoringVersion,
    study_version: session.studyVersion,
    consent_version: session.consentVersion,
    randomization_seed: session.randomizationSeed,
    start_time: session.startTime,
    completion_time: session.completionTime,
    total_duration_ms: session.totalDurationMs,
    device_type: session.device.deviceType,
    input_method: session.device.inputMethod,
    practice_repetitions: session.practiceRepetitions,
    provisional_ics: session.provisionalScore?.inhibitoryControlScore ?? null,
    commission_error_rate: c?.commissionErrorRate ?? null,
    omission_error_rate: c?.omissionErrorRate ?? null,
    mean_correct_rt_ms: c?.meanCorrectRtMs ?? null,
    median_correct_rt_ms: c?.medianCorrectRtMs ?? null,
    rt_sd_ms: c?.rtSdMs ?? null,
    rt_cv: c?.rtCv ?? null,
    anticipatory_count: c?.anticipatoryCount ?? null,
    post_error_slowing_ms: c?.postErrorSlowingMs ?? null,
    high_interference_accuracy: c?.highInterferenceAccuracy ?? null,
    high_interference_mean_rt_ms: c?.highInterferenceMeanRtMs ?? null,
    speed_accuracy_tradeoff: c?.speedAccuracyTradeoff ?? null,
    timing_quality: session.timingQuality,
    completion_status: session.completionStatus,
    validity_flags: session.validityFlags
      .filter((f) => f.triggered)
      .map((f) => f.code)
      .join('|'),
    data_retention_policy: session.dataRetentionPolicy,
    examiner_notes: session.examinerNotes,
  };
}

export function trialToFlatRow(trial: TrialRecord): Record<string, string | number | boolean | null> {
  return {
    session_id: trial.sessionId,
    block_id: trial.blockId,
    block_type: trial.blockType,
    trial_number: trial.trialNumber,
    stimulus_id: trial.stimulusId,
    stimulus_kind: trial.stimulusProperties.kind,
    stimulus_shape: trial.stimulusProperties.shape,
    stimulus_color: trial.stimulusProperties.colorToken,
    has_stop_cue: trial.stimulusProperties.hasStopCue,
    has_reverse_frame: trial.stimulusProperties.hasReverseFrame,
    go_or_nogo: trial.goNoGo,
    applicable_rule: trial.applicableRule,
    expected_response: trial.expectedResponse,
    actual_response: trial.actualResponse,
    accuracy: trial.accuracy,
    reaction_time_ms: trial.reactionTimeMs,
    stimulus_onset_ts: trial.stimulusOnsetTs,
    response_timestamp: trial.responseTimestamp,
    interstimulus_interval_ms: trial.interstimulusIntervalMs,
    anticipatory_response_flag: trial.anticipatoryResponseFlag,
    omission_flag: trial.omissionFlag,
    commission_error_flag: trial.commissionErrorFlag,
    focus_loss_flag: trial.focusLossFlag,
    timing_irregularity_flag: trial.timingIrregularityFlag,
    invalid_key_flag: trial.invalidKeyFlag,
    scored: trial.scored,
  };
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
}

export function exportSessionCsv(sessions: SessionRecord[]): string {
  return toCsv(sessions.map(sessionToFlatRow));
}

export function exportTrialsCsv(trials: TrialRecord[]): string {
  return toCsv(trials.map(trialToFlatRow));
}

export function exportJson(
  session: SessionRecord,
  trials: TrialRecord[]
): string {
  const change = performanceChangeAcrossBlocks(trials);
  return JSON.stringify(
    {
      session,
      trials,
      derived: change,
      meta: {
        format: 'rit_export',
        spss_friendly: true,
      },
    },
    null,
    2
  );
}

export function dataDictionary(): DataDictionaryEntry[] {
  return [
    {
      variable_name: 'session_id',
      label: 'Session identifier',
      data_type: 'string',
      allowable_values: 'rit_*',
      missing_value_code: '',
      scoring_role: 'key',
      privacy_classification: 'internal',
    },
    {
      variable_name: 'anonymous_participant_id',
      label: 'Anonymous participant ID',
      data_type: 'string',
      allowable_values: 'anon_* or study code',
      missing_value_code: '',
      scoring_role: 'key',
      privacy_classification: 'public_ok',
    },
    {
      variable_name: 'provisional_ics',
      label: 'Provisional Inhibitory Control Score (0-100)',
      data_type: 'number',
      allowable_values: '0-100',
      missing_value_code: '',
      scoring_role: 'primary_provisional',
      privacy_classification: 'performance',
    },
    {
      variable_name: 'commission_error_rate',
      label: 'Commission error rate on no-go trials',
      data_type: 'number',
      allowable_values: '0-1',
      missing_value_code: '',
      scoring_role: 'secondary',
      privacy_classification: 'performance',
    },
    {
      variable_name: 'omission_error_rate',
      label: 'Omission error rate on go trials',
      data_type: 'number',
      allowable_values: '0-1',
      missing_value_code: '',
      scoring_role: 'secondary',
      privacy_classification: 'performance',
    },
    {
      variable_name: 'mean_correct_rt_ms',
      label: 'Mean correct go reaction time (ms)',
      data_type: 'number',
      allowable_values: '>=0',
      missing_value_code: '',
      scoring_role: 'secondary',
      privacy_classification: 'performance',
    },
    {
      variable_name: 'validity_flags',
      label: 'Triggered validity flag codes',
      data_type: 'string',
      allowable_values: 'pipe-delimited codes',
      missing_value_code: '',
      scoring_role: 'validity',
      privacy_classification: 'internal',
    },
    {
      variable_name: 'reaction_time_ms',
      label: 'Trial reaction time (ms)',
      data_type: 'number',
      allowable_values: '>=0 or empty',
      missing_value_code: '',
      scoring_role: 'raw_trial',
      privacy_classification: 'performance',
    },
  ];
}

export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
