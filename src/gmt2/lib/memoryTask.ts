import type {
  GMT2GridMap,
  GMT2ItemBankEntry,
} from '../types';
import { GMT2_CONDITIONS, GMT2_SPANS } from '../types';

import itemBank from '../gmt2_item_bank.json';

const BANK = itemBank as GMT2ItemBankEntry[];

/** Group bank by "condition,span" and return array of 3 items per key. */
function groupBank(): Map<string, GMT2ItemBankEntry[]> {
  const map = new Map<string, GMT2ItemBankEntry[]>();
  for (const item of BANK) {
    const key = `${item.condition},${item.span}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

const groupedBank = groupBank();

/** Seeded RNG (mulberry32) for reproducible selection. */
function createSeededRandom(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns 16 trial items in fixed order: Baseline (span 2,3,4,5), Ignore (2,3,4,5),
 * Remember (2,3,4,5), Delay (2,3,4,5). One item per (condition, span) selected by seed.
 */
export function getTrialsForSession(sessionSeed: number): GMT2ItemBankEntry[] {
  const trials: GMT2ItemBankEntry[] = [];
  let seed = sessionSeed;
  for (const condition of GMT2_CONDITIONS) {
    for (const span of GMT2_SPANS) {
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
  return 600 * span + 600;
}

export function reconLimitMs(span: number): number {
  return 3000 + 2000 * span;
}

/** Normalize response to 16 elements; treat undefined/null as ''. */
export function normalizeResponseMap(response: Record<number, string> | GMT2GridMap): GMT2GridMap {
  const out: GMT2GridMap = [];
  for (let i = 0; i < 16; i++) {
    const v = Array.isArray(response) ? response[i] : response[i];
    out.push(v === 'X' || v === 'O' || v === 'Plus' ? v : '');
  }
  return out;
}

/**
 * Score one memory trial. Only non-empty target cells are counted as total_targets.
 * hits = correct placements; commissions = responses in empty target cells.
 */
export function scoreTrial(
  targetMap: GMT2GridMap,
  responseMap: GMT2GridMap
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

export type { GMT2ItemBankEntry };
