import type { GMT22GridMap } from '../types';

/** 4×4 copy layout: 8 targets (4 X, 4 O), max 2 per row/col. */
export const COPY_TARGET_MAP: GMT22GridMap = [
  'X', 'O', '', 'X',
  '', 'X', 'O', '',
  'O', '', 'X', 'O',
  'X', '', 'O', '',
];

/**
 * Compute copy score: hits = correct placements (max 8).
 */
export function scoreCopyTask(
  targetMap: GMT22GridMap,
  responseMap: GMT22GridMap
): { copy_hits: number } {
  let copy_hits = 0;
  for (let i = 0; i < 16; i++) {
    const t = targetMap[i] || '';
    const r = responseMap[i] || '';
    if (t !== '' && r === t) copy_hits++;
  }
  return { copy_hits };
}

export function toResponseGridMap(response: Record<number, string> | GMT22GridMap): GMT22GridMap {
  const out: GMT22GridMap = [];
  for (let i = 0; i < 16; i++) {
    const v = Array.isArray(response) ? response[i] : response[i];
    out.push(v === 'X' || v === 'O' ? v : '');
  }
  return out;
}
