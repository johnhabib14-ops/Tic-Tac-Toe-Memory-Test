import type { SessionRecord, TrialRecord } from '../types';
import { buildRitSubmissionRow } from './submissionPayload';
import { markArchiveSubmitStatus } from './sessionArchive';
import { submitViaPlatformIfLinked } from '../../lib/platformSubmit';

export type SubmitResult = {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
  submitStatus: 'submitted' | 'local_only' | 'failed';
};

/**
 * Submit RIT session to platform pipeline when linked, else /api/rit-submit.
 * Always safe to call after local archive — marks archive submit status.
 */
export async function submitRitSession(input: {
  session: SessionRecord;
  trials: TrialRecord[];
  demographics?: Record<string, unknown>;
}): Promise<SubmitResult> {
  const sessionId = input.session.sessionId;
  const base = import.meta.env.VITE_API_URL as string | undefined;

  const linked = await submitViaPlatformIfLinked({
    task: 'rit',
    session: input.session,
    trials: input.trials,
    demographics: input.demographics,
  });
  if (linked.handled) {
    const submitStatus = linked.submitStatus ?? (linked.ok ? 'submitted' : 'failed');
    markArchiveSubmitStatus(sessionId, {
      submitted: submitStatus === 'submitted',
      submitStatus,
      submitError: linked.error ?? null,
    });
    return {
      ok: Boolean(linked.ok),
      skipped: linked.skipped,
      status: linked.status,
      error: linked.error,
      submitStatus,
    };
  }

  if (!base) {
    markArchiveSubmitStatus(sessionId, {
      submitted: false,
      submitStatus: 'local_only',
      submitError: null,
    });
    return { ok: true, skipped: true, submitStatus: 'local_only' };
  }

  try {
    const row = buildRitSubmissionRow({
      session: input.session,
      trials: input.trials,
      demographics: input.demographics ?? null,
    });

    const res = await fetch(`${base.replace(/\/$/, '')}/api/rit-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: input.session,
        trials: input.trials,
        demographics: input.demographics ?? null,
        submitted_at: row.submitted_at,
      }),
    });

    if (res.status === 409) {
      // Already stored — treat as success for the client
      markArchiveSubmitStatus(sessionId, {
        submitted: true,
        submitStatus: 'submitted',
        submitError: null,
      });
      return { ok: true, status: 409, submitStatus: 'submitted' };
    }

    if (!res.ok) {
      const error = await res.text();
      markArchiveSubmitStatus(sessionId, {
        submitted: false,
        submitStatus: 'failed',
        submitError: error.slice(0, 200),
      });
      return { ok: false, status: res.status, error, submitStatus: 'failed' };
    }

    markArchiveSubmitStatus(sessionId, {
      submitted: true,
      submitStatus: 'submitted',
      submitError: null,
    });
    return { ok: true, status: res.status, submitStatus: 'submitted' };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'submit_failed';
    markArchiveSubmitStatus(sessionId, {
      submitted: false,
      submitStatus: 'failed',
      submitError: error,
    });
    return { ok: false, error, submitStatus: 'failed' };
  }
}
