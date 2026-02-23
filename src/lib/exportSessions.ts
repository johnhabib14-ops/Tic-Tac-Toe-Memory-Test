/**
 * Export helpers for the researcher Data page (download all submissions as JSON or CSV).
 */

export interface SessionRow {
  id?: number;
  createdAt?: string;
  participantId: string;
  name: string;
  age: number;
  gender: string;
  location: string;
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

function escapeCsvCell(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function downloadSessionsJson(sessions: SessionRow[]): void {
  const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `memory-test-sessions-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSessionsCsv(sessions: SessionRow[]): void {
  const headers = [
    'id', 'createdAt', 'participantId', 'name', 'age', 'gender', 'location', 'timestamp',
    'memoryPoints', 'highestLevelPassed', 'overallAccuracyPercent', 'meanReactionTimeMs',
    'totalIncorrectPlacements', 'totalWrongShapeUsed', 'copyScore', 'copyTimeMs',
  ];
  const rows = sessions.map((s) =>
    headers.map((h) => escapeCsvCell((s as Record<string, unknown>)[h])).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `memory-test-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
