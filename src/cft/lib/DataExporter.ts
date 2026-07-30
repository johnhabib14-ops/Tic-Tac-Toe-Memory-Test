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
    provisional_cfs: session.provisionalScore?.cognitiveFlexibilityScore ?? null,
    switch_accuracy: c?.switchAccuracy ?? null,
    stay_accuracy: c?.stayAccuracy ?? null,
    switch_cost_rt_ms: c?.switchCostRtMs ?? null,
    switch_cost_accuracy: c?.switchCostAccuracy ?? null,
    perseverative_error_rate: c?.perseverativeErrorRate ?? null,
    rule_maintenance_error_rate: c?.ruleMaintenanceErrorRate ?? null,
    cue_processing_error_rate: c?.cueProcessingErrorRate ?? null,
    conflict_accuracy: c?.conflictAccuracy ?? null,
    omission_error_rate: c?.omissionErrorRate ?? null,
    mean_correct_rt_ms: c?.meanCorrectRtMs ?? null,
    median_correct_rt_ms: c?.medianCorrectRtMs ?? null,
    rt_sd_ms: c?.rtSdMs ?? null,
    rt_cv: c?.rtCv ?? null,
    anticipatory_count: c?.anticipatoryCount ?? null,
    post_error_recovery: c?.postErrorRecovery ?? null,
    high_interference_accuracy: c?.highInterferenceAccuracy ?? null,
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
    rule: trial.rule,
    previous_rule: trial.previousRule,
    is_switch: trial.isSwitch,
    congruency: trial.congruency,
    shape: trial.stimulusProperties.features.shape,
    pattern: trial.stimulusProperties.features.pattern,
    number: trial.stimulusProperties.features.number,
    expected_response: trial.expectedResponse,
    actual_response: trial.actualResponse,
    accuracy: trial.accuracy,
    error_type: trial.errorType,
    reaction_time_ms: trial.reactionTimeMs,
    stimulus_onset_ts: trial.stimulusOnsetTs,
    response_timestamp: trial.responseTimestamp,
    interstimulus_interval_ms: trial.interstimulusIntervalMs,
    anticipatory_response_flag: trial.anticipatoryResponseFlag,
    omission_flag: trial.omissionFlag,
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

export function exportJson(session: SessionRecord, trials: TrialRecord[]): string {
  const change = performanceChangeAcrossBlocks(trials);
  return JSON.stringify(
    {
      session,
      trials,
      derived: change,
      meta: {
        format: 'cft_export',
        spss_friendly: true,
      },
    },
    null,
    2
  );
}

export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function dataDictionary(): DataDictionaryEntry[] {
  return [
    {
      variable_name: 'session_id',
      label: 'Session identifier',
      data_type: 'string',
      allowable_values: 'cft_*',
      missing_value_code: '',
      scoring_role: 'key',
      privacy_classification: 'internal',
    },
    {
      variable_name: 'provisional_cfs',
      label: 'Provisional Cognitive Flexibility Score (0-100)',
      data_type: 'number',
      allowable_values: '0-100',
      missing_value_code: '',
      scoring_role: 'primary_provisional',
      privacy_classification: 'performance',
    },
    {
      variable_name: 'switch_cost_rt_ms',
      label: 'Switch cost: mean correct RT switch minus stay (ms)',
      data_type: 'number',
      allowable_values: 'any',
      missing_value_code: '',
      scoring_role: 'secondary',
      privacy_classification: 'performance',
    },
    {
      variable_name: 'perseverative_error_rate',
      label: 'Rate of perseverative errors on scored trials',
      data_type: 'number',
      allowable_values: '0-1',
      missing_value_code: '',
      scoring_role: 'secondary',
      privacy_classification: 'performance',
    },
    {
      variable_name: 'error_type',
      label: 'Trial error taxonomy code',
      data_type: 'string',
      allowable_values:
        'perseverative|rule_maintenance|cue_processing|conflict|omission|anticipatory|invalid|other|empty',
      missing_value_code: '',
      scoring_role: 'trial',
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
  ];
}
