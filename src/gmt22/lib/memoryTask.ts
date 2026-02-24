import type { GMT22GridMap, GMT22Condition, GMT22ItemBankEntry } from '../types';
import { GMT22_CONDITIONS } from '../types';

import itemBankRaw from '../gmt22_item_bank.json';

/** Bank may have item_id or we assign from key + index. */
type BankRow = GMT22ItemBankEntry & { item_id?: string };

function computeAdjacentPairs(targetMap: GMT22GridMap): number {
  let count = 0;
  for (let i = 0; i < 16; i++) {
    if (!targetMap[i] || targetMap[i] === '') continue;
    const row = Math.floor(i / 4);
    const col = i % 4;
    if (col < 3 && targetMap[i + 1] && targetMap[i + 1] !== '') count++;
    if (row < 3 && targetMap[i + 4] && targetMap[i + 4] !== '') count++;
  }
  return count;
}

function computeDistinctRowsAndCols(targetMap: GMT22GridMap): { rows: number; cols: number } {
  const rows = new Set<number>();
  const cols = new Set<number>();
  for (let i = 0; i < 16; i++) {
    if (targetMap[i] && targetMap[i] !== '') {
      rows.add(Math.floor(i / 4));
      cols.add(i % 4);
    }
  }
  return { rows: rows.size, cols: cols.size };
}

function ensureItemMetadata(item: GMT22ItemBankEntry): GMT22ItemBankEntry {
  if (
    item.adjacent_pairs_count !== undefined &&
    item.distinct_rows_used !== undefined &&
    item.distinct_cols_used !== undefined
  )
    return item;
  const adj = computeAdjacentPairs(item.target_map);
  const { rows, cols } = computeDistinctRowsAndCols(item.target_map);
  return { ...item, adjacent_pairs_count: adj, distinct_rows_used: rows, distinct_cols_used: cols };
}

const BANK: GMT22ItemBankEntry[] = (itemBankRaw as BankRow[]).map((row, i) =>
  ensureItemMetadata({ ...row, item_id: row.item_id ?? `item-${i}` })
);

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

function itemsMatchForPairing(a: GMT22ItemBankEntry, b: GMT22ItemBankEntry): boolean {
  const adjA = a.adjacent_pairs_count ?? 0;
  const adjB = b.adjacent_pairs_count ?? 0;
  const rowsA = a.distinct_rows_used ?? 0;
  const rowsB = b.distinct_rows_used ?? 0;
  const colsA = a.distinct_cols_used ?? 0;
  const colsB = b.distinct_cols_used ?? 0;
  return (
    Math.abs(adjA - adjB) <= 1 &&
    Math.abs(rowsA - rowsB) <= 1 &&
    Math.abs(colsA - colsB) <= 1
  );
}

/** Set to true when span 6 or 7 falls back to non-matching pair. */
let pairingFallbackUsed = false;

export function getPairingFallbackUsed(): boolean {
  return pairingFallbackUsed;
}

function createSeededRandom(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** encodingMs(span) = 450 * span + 500 */
export function encodingMs(span: number): number {
  return 450 * span + 500;
}

/** reconLimitMs(span) = 2500 + 1700 * span */
export function reconLimitMs(span: number): number {
  return 2500 + 1700 * span;
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
): { hits: number; commissions: number; omissions: number; binding_errors: number; total_targets: number; accuracy_raw: number } {
  let total_targets = 0;
  let hits = 0;
  let commissions = 0;
  let omissions = 0;
  let binding_errors = 0;
  for (let i = 0; i < 16; i++) {
    const t = targetMap[i] || '';
    const r = responseMap[i] || '';
    if (t !== '') {
      total_targets++;
      if (r === t) hits++;
      else if (r === '') omissions++;
      else binding_errors++;
    } else if (r !== '') {
      commissions++;
    }
  }
  const accuracy_raw = total_targets > 0 ? hits / total_targets : 0;
  return { hits, commissions, omissions, binding_errors, total_targets, accuracy_raw };
}

/** passed = (commissions == 0) AND (accuracy_raw >= 0.85) */
export function isPassed(commissions: number, accuracy_raw: number): boolean {
  return commissions === 0 && accuracy_raw >= 0.85;
}

/** near_passed = (accuracy_raw >= 0.85); for analysis only. */
export function isNearPassed(accuracy_raw: number): boolean {
  return accuracy_raw >= 0.85;
}

const pairCache = new Map<string, { item1: GMT22ItemBankEntry; item2: GMT22ItemBankEntry; fallback: boolean }>();

/**
 * Get one item for (condition, span, trial_index 1 or 2).
 * Trial 1 and trial 2 at same span get different item_id.
 * For span 6 and 7, pairs are selected to match on metadata when possible; otherwise fallback is used.
 */
export function getItemForTrial(
  condition: GMT22Condition,
  span: number,
  trialIndex: 1 | 2,
  sessionSeed: number
): GMT22ItemBankEntry {
  const key = `${condition},${span}`;
  const options = groupedBank.get(key);
  if (!options || options.length < 2) throw new Error(`Insufficient items for ${key}`);
  const baseSeed = sessionSeed + 10000 * GMT22_CONDITIONS.indexOf(condition) + 100 * span;
  const rng = createSeededRandom(baseSeed);
  const cacheKey = `${condition},${span},${sessionSeed}`;

  if (span === 6 || span === 7) {
    let pair = pairCache.get(cacheKey);
    if (!pair) {
      const withMeta = options.map((o) => (o.adjacent_pairs_count !== undefined ? o : ensureItemMetadata(o)));
      let found = false;
      for (let i = 0; i < withMeta.length && !found; i++) {
        for (let j = i + 1; j < withMeta.length; j++) {
          if (itemsMatchForPairing(withMeta[i], withMeta[j])) {
            pair = { item1: withMeta[i], item2: withMeta[j], fallback: false };
            found = true;
            break;
          }
        }
      }
      if (!pair) {
        const idx0 = Math.floor(rng() * options.length);
        let idx1 = Math.floor(rng() * options.length);
        while (idx1 === idx0) idx1 = Math.floor(rng() * options.length);
        pairingFallbackUsed = true;
        pair = { item1: options[idx0], item2: options[idx1], fallback: true };
      }
      pairCache.set(cacheKey, pair);
    }
    return trialIndex === 1 ? pair.item1 : pair.item2;
  }

  const idx0 = Math.floor(rng() * options.length);
  let idx1 = Math.floor(rng() * options.length);
  while (idx1 === idx0) idx1 = Math.floor(rng() * options.length);
  const index = trialIndex === 1 ? idx0 : idx1;
  return options[index];
}

/**
 * Practice: 2 trials — baseline span 2, ignore_distractor span 2.
 * Returns [baseline item, ignore item] with different item_ids.
 */
export function getPracticeItems(sessionSeed: number): [GMT22ItemBankEntry, GMT22ItemBankEntry] {
  const item1 = getItemForTrial('baseline', 2, 1, sessionSeed);
  const item2 = getItemForTrial('ignore_distractor', 2, 1, sessionSeed);
  return [item1, item2];
}

export type { GMT22ItemBankEntry };
