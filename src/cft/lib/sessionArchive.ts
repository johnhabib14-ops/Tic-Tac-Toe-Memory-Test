import type { SessionRecord, TrialRecord } from '../types';

const ARCHIVE_KEY = 'cft_session_archive_v1';

export type SubmitStatus = 'pending' | 'submitted' | 'local_only' | 'failed';

export interface ArchivedSession {
  savedAt: string;
  session: SessionRecord;
  trials: TrialRecord[];
  submitted?: boolean;
  submitStatus?: SubmitStatus;
  submitError?: string | null;
}

export function loadArchive(): ArchivedSession[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ArchivedSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveToArchive(
  session: SessionRecord,
  trials: TrialRecord[],
  meta?: Partial<Pick<ArchivedSession, 'submitted' | 'submitStatus' | 'submitError'>>
): void {
  if (typeof localStorage === 'undefined') return;
  const entry: ArchivedSession = {
    savedAt: new Date().toISOString(),
    session,
    trials,
    submitted: meta?.submitted ?? false,
    submitStatus: meta?.submitStatus ?? 'pending',
    submitError: meta?.submitError ?? null,
  };
  const prev = loadArchive().filter((e) => e.session.sessionId !== session.sessionId);
  prev.push(entry);
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(prev));
}

export function markArchiveSubmitStatus(
  sessionId: string,
  update: Partial<Pick<ArchivedSession, 'submitted' | 'submitStatus' | 'submitError'>>
): void {
  if (typeof localStorage === 'undefined') return;
  const prev = loadArchive();
  const next = prev.map((e) =>
    e.session.sessionId === sessionId
      ? {
          ...e,
          submitted: update.submitted ?? e.submitted,
          submitStatus: update.submitStatus ?? e.submitStatus,
          submitError: update.submitError !== undefined ? update.submitError : e.submitError,
        }
      : e
  );
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(next));
}

export function clearArchive(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(ARCHIVE_KEY);
}
