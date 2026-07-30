import type { SessionRecord, TrialRecord } from '../types';
import { sessionToFlatRow } from './DataExporter';

/** Supabase rit_submissions row shape (snake_case columns). */
export type RitSubmissionRow = Record<string, string | number | boolean | null | object>;

function numOrNull(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Flatten a completed session into the rit_submissions insert row.
 * Shared contract for client tests and api/rit-submit.js field names.
 */
export function buildRitSubmissionRow(input: {
  session: SessionRecord;
  trials: TrialRecord[];
  demographics?: Record<string, unknown> | null;
  submittedAt?: string;
}): RitSubmissionRow {
  const { session, trials } = input;
  const flat = sessionToFlatRow(session);
  const byBlock = Object.fromEntries(
    session.blockSummaries.map((b) => [b.blockType, b])
  );
  const flags = Object.fromEntries(
    session.validityFlags.map((f) => [f.code, f.triggered])
  );

  return {
    session_id: String(flat.session_id ?? ''),
    anonymous_participant_id: String(flat.anonymous_participant_id ?? ''),
    study_id: String(flat.study_id ?? ''),
    administration_mode: String(flat.administration_mode ?? ''),
    visual_mode: String(flat.visual_mode ?? ''),
    task_version: String(flat.task_version ?? ''),
    scoring_version: String(flat.scoring_version ?? ''),
    study_version: String(flat.study_version ?? ''),
    consent_version: String(flat.consent_version ?? ''),
    randomization_seed: Number(flat.randomization_seed) || 0,
    start_time: flat.start_time,
    completion_time: flat.completion_time,
    total_duration_ms: numOrNull(flat.total_duration_ms),
    device_type: String(flat.device_type ?? ''),
    input_method: String(flat.input_method ?? ''),
    practice_repetitions: Number(flat.practice_repetitions) || 0,
    timing_quality: String(flat.timing_quality ?? ''),
    completion_status: String(flat.completion_status ?? ''),
    provisional_ics: numOrNull(flat.provisional_ics),
    commission_error_rate: numOrNull(flat.commission_error_rate),
    omission_error_rate: numOrNull(flat.omission_error_rate),
    mean_correct_rt_ms: numOrNull(flat.mean_correct_rt_ms),
    median_correct_rt_ms: numOrNull(flat.median_correct_rt_ms),
    rt_sd_ms: numOrNull(flat.rt_sd_ms),
    rt_cv: numOrNull(flat.rt_cv),
    anticipatory_count: Number(flat.anticipatory_count) || 0,
    post_error_slowing_ms: numOrNull(flat.post_error_slowing_ms),
    high_interference_accuracy: numOrNull(flat.high_interference_accuracy),
    high_interference_mean_rt_ms: numOrNull(flat.high_interference_mean_rt_ms),
    speed_accuracy_tradeoff: numOrNull(flat.speed_accuracy_tradeoff),
    accuracy_practice: byBlock.practice?.accuracy ?? null,
    mean_rt_practice: byBlock.practice?.meanCorrectRtMs ?? null,
    accuracy_baseline: byBlock.baseline?.accuracy ?? null,
    mean_rt_baseline: byBlock.baseline?.meanCorrectRtMs ?? null,
    accuracy_habit: byBlock.habit?.accuracy ?? null,
    mean_rt_habit: byBlock.habit?.meanCorrectRtMs ?? null,
    accuracy_standard: byBlock.standard?.accuracy ?? null,
    mean_rt_standard: byBlock.standard?.meanCorrectRtMs ?? null,
    accuracy_interference: byBlock.interference?.accuracy ?? null,
    mean_rt_interference: byBlock.interference?.meanCorrectRtMs ?? null,
    validity_flags: String(flat.validity_flags ?? ''),
    flag_excessive_omissions: !!flags.excessive_omissions,
    flag_chance_accuracy: !!flags.chance_accuracy,
    flag_extremely_rapid: !!flags.extremely_rapid,
    flag_repeated_anticipatory: !!flags.repeated_anticipatory,
    flag_excessive_focus_loss: !!flags.excessive_focus_loss,
    flag_incomplete_session: !!flags.incomplete_session,
    flag_abnormal_timing: !!flags.abnormal_timing,
    flag_unsupported_device: !!flags.unsupported_device,
    flag_repeated_response_pattern: !!flags.repeated_response_pattern,
    flag_practice_failed: !!flags.practice_failed,
    flag_rule_not_understood: !!flags.rule_not_understood,
    trials,
    demographics: input.demographics ?? {},
    examiner_notes: flat.examiner_notes,
    data_retention_policy: String(flat.data_retention_policy ?? ''),
    submitted_at: input.submittedAt ?? new Date().toISOString(),
  };
}
