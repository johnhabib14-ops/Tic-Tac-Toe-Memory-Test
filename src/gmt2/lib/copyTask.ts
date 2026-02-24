import type { GMT2GridMap } from '../types';

/** Single fixed 4×4 copy layout: 6 targets (3 X, 3 O), max 2 per row/col. */
export const COPY_TARGET_MAP: GMT2GridMap = [
  '', 'X', '', '',
  '', '', 'O', '',
  'X', '', '', 'O',
  '', 'O', 'X', '',
];

/**
 * Compute copy score: hits = correct placements, response map as array of 16.
 */
export function scoreCopyTask(
  targetMap: GMT2GridMap,
  responseMap: GMT2GridMap
): { copy_hits: number } {
  let copy_hits = 0;
  for (let i = 0; i < 16; i++) {
    const t = targetMap[i] || '';
    const r = responseMap[i] || '';
    if (t !== '' && r === t) copy_hits++;
  }
  return { copy_hits };
}

/** Ensure array of 16 elements for response (fill missing with ''). */
export function toResponseGridMap(response: Record<number, string> | GMT2GridMap): GMT2GridMap {
  const out: GMT2GridMap = [];
  for (let i = 0; i < 16; i++) {
    const v = Array.isArray(response) ? response[i] : response[i];
    out.push(v === 'X' || v === 'O' ? v : '');
  }
  return out;
}
