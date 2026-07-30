import { apiBaseUrl } from './supabaseClient';
import { getAssessmentLinkToken, isLinkedAdministration } from './assessmentLink';

/**
 * Submit via platform pipeline when an assessment link is active.
 * Returns null if not linked (caller should use legacy task submit).
 */
export async function submitViaPlatformIfLinked(input: {
  task: string;
  session: unknown;
  trials?: unknown[];
  demographics?: unknown;
  scores?: unknown;
  researchConsent?: boolean;
}): Promise<{
  handled: boolean;
  ok?: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
  submitStatus?: 'submitted' | 'local_only' | 'failed';
}> {
  if (!isLinkedAdministration()) {
    return { handled: false };
  }
  const token = getAssessmentLinkToken();
  const base = apiBaseUrl();
  if (!token) return { handled: false };
  if (!base) {
    return {
      handled: true,
      ok: true,
      skipped: true,
      submitStatus: 'local_only',
    };
  }

  try {
    const res = await fetch(`${base}/api/platform/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        task: input.task,
        session: input.session,
        trials: input.trials,
        demographics: input.demographics,
        scores: input.scores,
        researchConsent: input.researchConsent,
      }),
    });
    if (res.status === 409) {
      return { handled: true, ok: true, status: 409, submitStatus: 'submitted' };
    }
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return {
        handled: true,
        ok: false,
        status: res.status,
        error: String(json.error || res.statusText).slice(0, 200),
        submitStatus: 'failed',
      };
    }
    return { handled: true, ok: true, status: res.status, submitStatus: 'submitted' };
  } catch (e) {
    return {
      handled: true,
      ok: false,
      error: e instanceof Error ? e.message : 'submit_failed',
      submitStatus: 'failed',
    };
  }
}
