import type { GMT22GridMap } from '../types';

export interface CopyBankItem {
  copy_item_id: string;
  target_map: GMT22GridMap;
}

import copyBankRaw from '../copy_item_bank.json';
const COPY_BANK: CopyBankItem[] = copyBankRaw as CopyBankItem[];

function createSeededRandom(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic copy item selection from session seed. */
export function getCopyItemForSession(sessionSeed: number): CopyBankItem {
  const rng = createSeededRandom(sessionSeed);
  const idx = Math.floor(rng() * COPY_BANK.length);
  return COPY_BANK[idx];
}

/** Legacy single layout (first bank item). */
export const COPY_TARGET_MAP: GMT22GridMap = COPY_BANK[0]
  ? [...COPY_BANK[0].target_map]
  : Array(16).fill('');

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
