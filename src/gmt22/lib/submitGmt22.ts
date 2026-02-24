import type {
  GMT22Participant,
  GMT22CopyResult,
  GMT22MemoryTrialRecord,
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
  copy_hits: number;
  copy_total_rt_ms: number;
  copy_target_map: string[];
  copy_response_map: string[];
  memory_trials: Array<{
    condition: string;
    span: number;
    target_map: string[];
    response_map: string[];
    recon_rt_ms: number;
    hits: number;
    commissions: number;
    accuracy_raw: number;
    timeout: boolean;
    clean_trial: boolean;
  }>;
  mean_accuracy_per_condition: Record<string, number>;
  mean_rt_per_condition: Record<string, number>;
  total_commissions_per_condition: Record<string, number>;
  clean_trial_rate_per_condition: Record<string, number>;
  global_accuracy: number;
  global_mean_rt: number;
  global_clean_trial_rate: number;
}

export function buildGMT22Payload(
  participant: GMT22Participant,
  copyResult: GMT22CopyResult | null,
  memoryTrials: GMT22MemoryTrialRecord[],
  summary: GMT22Summary
): GMT22SubmitPayload {
  return {
    session_id: participant.session_id,
    participant_id: participant.participant_id,
    birth_year: participant.birth_year,
    age: participant.age,
    gender: participant.gender,
    education: participant.education,
    device_type: participant.device_type,
    copy_hits: copyResult?.copy_hits ?? 0,
    copy_total_rt_ms: copyResult?.copy_total_rt_ms ?? 0,
    copy_target_map: copyResult?.copy_target_map ?? Array(16).fill(''),
    copy_response_map: copyResult?.copy_response_map ?? Array(16).fill(''),
    memory_trials: memoryTrials.map((t) => ({
      condition: t.condition,
      span: t.span,
      target_map: t.target_map,
      response_map: t.response_map,
      recon_rt_ms: t.recon_rt_ms,
      hits: t.hits,
      commissions: t.commissions,
      accuracy_raw: t.accuracy_raw,
      timeout: t.timeout,
      clean_trial: t.clean_trial,
    })),
    mean_accuracy_per_condition: summary.mean_accuracy_per_condition as Record<string, number>,
    mean_rt_per_condition: summary.mean_rt_per_condition as Record<string, number>,
    total_commissions_per_condition: summary.total_commissions_per_condition as Record<string, number>,
    clean_trial_rate_per_condition: summary.clean_trial_rate_per_condition as Record<string, number>,
    global_accuracy: summary.global_accuracy,
    global_mean_rt: summary.global_mean_rt,
    global_clean_trial_rate: summary.global_clean_trial_rate,
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
