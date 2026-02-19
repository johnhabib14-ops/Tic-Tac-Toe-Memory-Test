import type { Participant } from '../types';
import type { SummaryMetrics } from '../types';

const FORM_BASE =
  import.meta.env.VITE_GOOGLE_FORM_BASE ??
  'https://docs.google.com/forms/d/e/1FAIpQLSfkNqgUCk1NacIs9R36BSUIk2RZjafbgjo40khIru1g-S0Q2A/viewform';

// Entry IDs must match your Google Form (get from form’s “Get prefill link”)
const ENTRIES = {
  name: import.meta.env.VITE_ENTRY_NAME ?? '789348548',
  age: import.meta.env.VITE_ENTRY_AGE ?? '1922394649',
  gender: import.meta.env.VITE_ENTRY_GENDER ?? '1816413769',
  date: import.meta.env.VITE_ENTRY_DATE ?? '447483951',
  totalPoints: import.meta.env.VITE_ENTRY_TOTAL_POINTS ?? '1015731778',
  totalIncorrectPlacements: import.meta.env.VITE_ENTRY_TOTAL_INCORRECT ?? '1571902637',
  totalWrongShapeUsed: import.meta.env.VITE_ENTRY_WRONG_SHAPE ?? '543386722',
  highestLevelPassed: import.meta.env.VITE_ENTRY_HIGHEST_LEVEL ?? '1329618290',
  meanReactionTimeMs: import.meta.env.VITE_ENTRY_MEAN_RT ?? '598043661',
};

// Form expects: Male, Female, Non-Binary, Prefer-Not to say
function formGender(g: string): string {
  if (g === 'Nonbinary') return 'Non-Binary';
  if (g === 'Prefer not to say') return 'Prefer-Not to say';
  return g;
}

// Google Forms date prefill: use YYYY-MM-DD for best compatibility with date/short-answer fields
function formatDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function safeNum(n: number | undefined | null): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function buildFormPrefillUrl(participant: Participant, summary: SummaryMetrics): string {
  const params = new URLSearchParams();
  params.set('usp', 'pp_url');
  params.set(`entry.${ENTRIES.name}`, String(participant.name ?? '').trim());
  params.set(`entry.${ENTRIES.age}`, String(safeNum(participant.age)));
  params.set(`entry.${ENTRIES.gender}`, formGender(participant.gender ?? ''));
  params.set(`entry.${ENTRIES.date}`, formatDate(participant.timestamp ?? new Date().toISOString()));
  params.set(`entry.${ENTRIES.totalPoints}`, String(safeNum(summary.memoryPoints)));
  params.set(`entry.${ENTRIES.totalIncorrectPlacements}`, String(safeNum(summary.totalIncorrectPlacements)));
  params.set(`entry.${ENTRIES.totalWrongShapeUsed}`, String(safeNum(summary.totalWrongShapeUsed)));
  params.set(`entry.${ENTRIES.highestLevelPassed}`, String(safeNum(summary.highestLevelPassed)));
  params.set(`entry.${ENTRIES.meanReactionTimeMs}`, String(Math.round(safeNum(summary.meanReactionTimeMs))));
  return `${FORM_BASE}?${params.toString()}`;
}

export function openFormInNewTab(participant: Participant, summary: SummaryMetrics): void {
  const url = buildFormPrefillUrl(participant, summary);
  window.open(url, '_blank');
}
