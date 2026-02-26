import type {
  GMT22Participant,
  GMT22CopyResult,
  GMT22MemoryTrialRecord,
  GMT22PracticeTrialRecord,
  GMT22Summary,
} from '../types';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export interface GMT22SubmitPayload {
  session_id: string;
  participant_id: string;
  birth_year: number;
  age: number;
  gender: string;
  education: string;
  device_type: string;
  condition_order: string;
  practice_failed: boolean;
  practice_passed_first_try: boolean;
  practice_trials: Array<{
    condition: string;
    span: number;
    trial_index: number;
    item_id: string;
    target_map: string[];
    distractor_map: string[];
    response_map: string[];
    recon_rt_ms: number;
    hits: number;
    commissions: number;
    omissions: number;
    binding_errors: number;
    total_targets: number;
    accuracy_raw: number;
    passed: boolean;
    timeout: boolean;
  }>;
  copy_item_id: string;
  copy_hits: number;
  copy_total_rt_ms: number;
  copy_target_map: string[];
  copy_response_map: string[];
  memory_trials: Array<{
    condition: string;
    span: number;
    trial_index: number;
    item_id: string;
    target_map: string[];
    distractor_map: string[];
    response_map: string[];
    recon_rt_ms: number;
    hits: number;
    commissions: number;
    omissions: number;
    binding_errors: number;
    total_targets: number;
    accuracy_raw: number;
    passed: boolean;
    timeout: boolean;
  }>;
  summary: {
    by_condition: Record<
      string,
      {
        span_estimate: number;
        span_consistency_flag: boolean;
        mean_accuracy: number;
        mean_rt_ms: number;
      }
    >;
    baseline_span: number;
    ignore_span: number;
    remember_span: number;
    delay_span: number;
    interference_cost: number;
    binding_cost: number;
    delay_cost: number;
    practice_failed: boolean;
    practice_passed_first_try: boolean;
    attention_check_failed: boolean;
    condition_order: string;
  };
}

function mapTrial(
  t: GMT22MemoryTrialRecord | GMT22PracticeTrialRecord
): GMT22SubmitPayload['memory_trials'][0] {
  return {
    condition: t.condition,
    span: t.span,
    trial_index: t.trial_index,
    item_id: t.item_id,
    target_map: t.target_map,
    distractor_map: t.distractor_map,
    response_map: t.response_map,
    recon_rt_ms: t.recon_rt_ms,
    hits: t.hits,
    commissions: t.commissions,
    omissions: t.omissions,
    binding_errors: t.binding_errors,
    total_targets: t.total_targets,
    accuracy_raw: t.accuracy_raw,
    passed: t.passed,
    timeout: t.timeout,
  };
}

export function buildGMT22Payload(
  participant: GMT22Participant,
  copyResult: GMT22CopyResult | null,
  memoryTrials: GMT22MemoryTrialRecord[],
  practiceTrials: GMT22PracticeTrialRecord[],
  summary: GMT22Summary
): GMT22SubmitPayload {
  const by_condition: GMT22SubmitPayload['summary']['by_condition'] = {};
  for (const [c, s] of Object.entries(summary.by_condition)) {
    by_condition[c] = {
      span_estimate: s.span_estimate,
      span_consistency_flag: s.span_consistency_flag,
      mean_accuracy: s.mean_accuracy,
      mean_rt_ms: s.mean_rt_ms,
    };
  }
  return {
    session_id: participant.session_id,
    participant_id: participant.participant_id,
    birth_year: participant.birth_year,
    age: participant.age,
    gender: participant.gender,
    education: participant.education,
    device_type: participant.device_type,
    condition_order: participant.condition_order,
    practice_failed: summary.practice_failed,
    practice_passed_first_try: summary.practice_passed_first_try,
    practice_trials: practiceTrials.map(mapTrial),
    copy_item_id: copyResult?.copy_item_id ?? '',
    copy_hits: copyResult?.copy_hits ?? 0,
    copy_total_rt_ms: copyResult?.copy_total_rt_ms ?? 0,
    copy_target_map: copyResult?.copy_target_map ?? Array(16).fill(''),
    copy_response_map: copyResult?.copy_response_map ?? Array(16).fill(''),
    memory_trials: memoryTrials.map(mapTrial),
    summary: {
      by_condition,
      baseline_span: summary.baseline_span,
      ignore_span: summary.ignore_span,
      remember_span: summary.remember_span,
      delay_span: summary.delay_span,
      interference_cost: summary.interference_cost,
      binding_cost: summary.binding_cost,
      delay_cost: summary.delay_cost,
      practice_failed: summary.practice_failed,
      practice_passed_first_try: summary.practice_passed_first_try,
      attention_check_failed: summary.attention_check_failed,
      condition_order: summary.condition_order,
    },
  };
}

export function isGMT22BackendConfigured(): boolean {
  return API_URL.length > 0;
}

/** Error thrown by submitGMT22; message may include status for UI handling. */
export class GMT22SubmitError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'GMT22SubmitError';
  }
}

export function submitGMT22(payload: GMT22SubmitPayload): Promise<void> {
  if (!API_URL) return Promise.reject(new GMT22SubmitError('VITE_API_URL is not set'));
  return fetch(`${API_URL}/api/gmt22-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(async (r) => {
      if (r.ok) return;
      const status = r.status;
      let detail = '';
      try {
        const text = await r.text();
        const parsed = text ? JSON.parse(text) : null;
        if (parsed && typeof parsed.error === 'string') detail = `: ${parsed.error}`;
        if (parsed && typeof parsed.detail === 'string' && parsed.detail) detail += ` — ${parsed.detail}`;
        else if (!detail && text && text.length < 120) detail = `: ${text}`;
      } catch {
        // ignore
      }
      if (status === 409) throw new GMT22SubmitError(`Duplicate submission${detail}`, 409);
      if (status === 500) throw new GMT22SubmitError(`Server misconfiguration (500)${detail}`, 500);
      if (status === 502) throw new GMT22SubmitError(`Failed to save submission (502)${detail}`, 502);
      throw new GMT22SubmitError(`Request failed: ${status}${detail}`, status);
    })
    .catch((err) => {
      if (err instanceof GMT22SubmitError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new GMT22SubmitError(msg.includes('fetch') || msg.includes('Network') ? 'Network error' : msg);
    });
}
