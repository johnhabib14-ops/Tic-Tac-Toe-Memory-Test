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
  practice_failed: boolean;
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
    total_targets: number;
    accuracy_raw: number;
    passed: boolean;
    near_passed: boolean;
    timeout: boolean;
  }>;
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
    total_targets: number;
    accuracy_raw: number;
    passed: boolean;
    near_passed: boolean;
    timeout: boolean;
  }>;
  summary: {
    by_condition: Record<
      string,
      {
        start_span: number;
        span_estimate: number;
        span_reached: number;
        discontinued_at_span: number | null;
        trials_completed_count: number;
        mean_accuracy: number;
        mean_rt_ms: number;
        total_commissions: number;
      }
    >;
    global_accuracy: number;
    global_mean_rt_ms: number;
    global_total_commissions: number;
    memory_early_stopped: boolean;
    practice_failed: boolean;
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
    total_targets: t.total_targets,
    accuracy_raw: t.accuracy_raw,
    passed: t.passed,
    near_passed: t.near_passed,
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
      start_span: s.start_span,
      span_estimate: s.span_estimate,
      span_reached: s.span_reached,
      discontinued_at_span: s.discontinued_at_span,
      trials_completed_count: s.trials_completed_count,
      mean_accuracy: s.mean_accuracy,
      mean_rt_ms: s.mean_rt_ms,
      total_commissions: s.total_commissions,
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
    practice_failed: summary.practice_failed,
    practice_trials: practiceTrials.map(mapTrial),
    copy_hits: copyResult?.copy_hits ?? 0,
    copy_total_rt_ms: copyResult?.copy_total_rt_ms ?? 0,
    copy_target_map: copyResult?.copy_target_map ?? Array(16).fill(''),
    copy_response_map: copyResult?.copy_response_map ?? Array(16).fill(''),
    memory_trials: memoryTrials.map(mapTrial),
    summary: {
      by_condition,
      global_accuracy: summary.global_accuracy,
      global_mean_rt_ms: summary.global_mean_rt_ms,
      global_total_commissions: summary.global_total_commissions,
      memory_early_stopped: summary.memory_early_stopped,
      practice_failed: summary.practice_failed,
    },
  };
}

export function isGMT22BackendConfigured(): boolean {
  return API_URL.length > 0;
}

export function submitGMT22(payload: GMT22SubmitPayload): Promise<void> {
  if (!API_URL) return Promise.reject(new Error('VITE_API_URL is not set'));
  return fetch(`${API_URL}/api/gmt22-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(async (r) => {
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
    if (status === 500) throw new Error(`Server misconfiguration (500)${detail}`);
    if (status === 502) throw new Error(`Failed to save submission (502)${detail}`);
    throw new Error(`Request failed: ${status}${detail}`);
  });
}
