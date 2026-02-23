import type { Participant } from '../types';
import type { SummaryMetrics } from '../types';
import type { CopyResult } from '../types';

/** Payload sent to the Google Apps Script web app (one row in the sheet). */
export interface SheetPayload {
  participantId: string;
  name: string;
  age: number;
  gender: string;
  education: string;
  timestamp: string;
  memoryPoints: number;
  highestLevelPassed: number;
  overallAccuracyPercent: number;
  meanReactionTimeMs: number;
  totalIncorrectPlacements: number;
  totalWrongShapeUsed: number;
  copyScore: number;
  copyTimeMs: number;
}

function safeNum(n: number | undefined | null): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function buildSheetPayload(
  participant: Participant,
  summary: SummaryMetrics,
  copyResult: CopyResult | null
): SheetPayload {
  return {
    participantId: participant.id,
    name: String(participant.name ?? '').trim(),
    age: safeNum(participant.age),
    gender: participant.gender ?? '',
    education: String(participant.education ?? '').trim(),
    timestamp: participant.timestamp ?? new Date().toISOString(),
    memoryPoints: safeNum(summary.memoryPoints),
    highestLevelPassed: safeNum(summary.highestLevelPassed),
    overallAccuracyPercent: safeNum(summary.overallAccuracyPercent),
    meanReactionTimeMs: Math.round(safeNum(summary.meanReactionTimeMs)),
    totalIncorrectPlacements: safeNum(summary.totalIncorrectPlacements),
    totalWrongShapeUsed: safeNum(summary.totalWrongShapeUsed),
    copyScore: copyResult != null ? safeNum(copyResult.score) : 0,
    copyTimeMs: copyResult != null ? safeNum(copyResult.timeMs) : 0,
  };
}

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SHEETS_SCRIPT_URL ?? '';
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export function isSheetSubmitConfigured(): boolean {
  return SCRIPT_URL.length > 0;
}

export function isBackendConfigured(): boolean {
  return API_URL.length > 0;
}

/**
 * Submits results to the backend (Vercel API + Supabase). Returns a promise that resolves on success or rejects on failure.
 */
export function submitToBackend(
  participant: Participant,
  summary: SummaryMetrics,
  copyResult: CopyResult | null
): Promise<void> {
  if (!API_URL) return Promise.reject(new Error('VITE_API_URL is not set'));
  const payload = buildSheetPayload(participant, summary, copyResult);
  return fetch(`${API_URL}/api/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((r) => {
    if (!r.ok) throw new Error(r.status === 502 ? 'Failed to save submission' : `Request failed: ${r.status}`);
  });
}

/**
 * Submits results to Google Sheets via the Apps Script web app.
 * Uses a form POST in a new tab to avoid CORS (script URL doesn't send CORS headers).
 * The new tab will navigate to the script and show its response (e.g. "Results recorded").
 */
export function submitToGoogleSheet(
  participant: Participant,
  summary: SummaryMetrics,
  copyResult: CopyResult | null
): void {
  if (!SCRIPT_URL) {
    console.warn('VITE_GOOGLE_SHEETS_SCRIPT_URL is not set');
    return;
  }
  const payload = buildSheetPayload(participant, summary, copyResult);
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = SCRIPT_URL;
  form.target = '_blank';
  form.style.display = 'none';

  const input = document.createElement('input');
  input.name = 'data';
  input.value = JSON.stringify(payload);
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
