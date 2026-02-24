import type { GMT22GridMap, GMT22ItemBankEntry } from '../types';
import { GMT22_CONDITIONS, GMT22_BASE_SPANS, GMT22_OVERLOAD_SPAN } from '../types';

import itemBank from '../gmt22_item_bank.json';

const BANK = itemBank as GMT22ItemBankEntry[];

function groupBank(): Map<string, GMT22ItemBankEntry[]> {
  const map = new Map<string, GMT22ItemBankEntry[]>();
  for (const item of BANK) {
    const key = `${item.condition},${item.span}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

const groupedBank = groupBank();

function createSeededRandom(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OVERLOAD_ENABLED = String(import.meta.env.VITE_GMT22_OVERLOAD ?? '').trim() === '1';

/**
 * Returns 20 (or 24 with overload) trial items: 4 conditions × spans [2,3,4,5,6] and optionally [7].
 */
export function getTrialsForSession(sessionSeed: number): GMT22ItemBankEntry[] {
  const trials: GMT22ItemBankEntry[] = [];
  let seed = sessionSeed;
  const spans = OVERLOAD_ENABLED ? [...GMT22_BASE_SPANS, GMT22_OVERLOAD_SPAN] : [...GMT22_BASE_SPANS];
  for (const condition of GMT22_CONDITIONS) {
    for (const span of spans) {
      const key = `${condition},${span}`;
      const options = groupedBank.get(key);
      if (!options || options.length === 0) throw new Error(`No items for ${key}`);
      const rng = createSeededRandom(seed++);
      const index = Math.floor(rng() * options.length);
      trials.push(options[index]);
    }
  }
  return trials;
}

export function encodingMs(span: number): number {
  return 500 * span + 500;
}

export function reconLimitMs(span: number): number {
  return 2500 + 1800 * span;
}

export function normalizeResponseMap(response: Record<number, string> | GMT22GridMap): GMT22GridMap {
  const out: GMT22GridMap = [];
  for (let i = 0; i < 16; i++) {
    const v = Array.isArray(response) ? response[i] : response[i];
    out.push(v === 'X' || v === 'O' || v === 'Plus' ? v : '');
  }
  return out;
}

export function scoreTrial(
  targetMap: GMT22GridMap,
  responseMap: GMT22GridMap
): { hits: number; commissions: number; total_targets: number; accuracy_raw: number } {
  let total_targets = 0;
  let hits = 0;
  let commissions = 0;
  for (let i = 0; i < 16; i++) {
    const t = targetMap[i] || '';
    const r = responseMap[i] || '';
    if (t !== '') {
      total_targets++;
      if (r === t) hits++;
    } else if (r !== '') {
      commissions++;
    }
  }
  const accuracy_raw = total_targets > 0 ? hits / total_targets : 0;
  return { hits, commissions, total_targets, accuracy_raw };
}

export type { GMT22ItemBankEntry };
