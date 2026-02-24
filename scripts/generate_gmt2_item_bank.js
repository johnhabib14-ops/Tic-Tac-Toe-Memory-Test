/**
 * One-off script to generate gmt2_item_bank.json.
 * Run: node scripts/generate_gmt2_item_bank.js
 * Output: src/gmt2/gmt2_item_bank.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONDITIONS = ['baseline', 'ignore_distractor', 'remember_distractor', 'delay'];
const SPANS = [2, 3, 4, 5];
const ITEMS_PER_CELL = 3;

function shuffle(arr, rng) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rowOf(cellIndex) {
  return Math.floor(cellIndex / 4);
}
function colOf(cellIndex) {
  return cellIndex % 4;
}

/** Check if placing `count` targets in `indices` satisfies max 2 per row/col. */
function satisfiesMax2(indices) {
  const rowCount = [0, 0, 0, 0];
  const colCount = [0, 0, 0, 0];
  for (const i of indices) {
    rowCount[rowOf(i)]++;
    colCount[colOf(i)]++;
  }
  return rowCount.every((c) => c <= 2) && colCount.every((c) => c <= 2);
}

/** Fill array of length 16 with '' then set given indices to symbols. */
function buildMap(indicesAndSymbols) {
  const out = Array(16).fill('');
  for (const { index, symbol } of indicesAndSymbols) {
    out[index] = symbol;
  }
  return out;
}

/** Generate one item: choose target cells (and optionally distractor cells) and assign symbols. */
function generateItem(condition, span, rng) {
  const indices = Array.from({ length: 16 }, (_, i) => i);
  const shuffled = shuffle(indices, rng);

  if (condition === 'baseline' || condition === 'delay') {
    // span targets, X and O only; no distractors
    const targetIndices = [];
    for (let k = 0; k < shuffled.length && targetIndices.length < span; k++) {
      const candidate = [...targetIndices, shuffled[k]];
      if (satisfiesMax2(candidate)) targetIndices.push(shuffled[k]);
    }
    const half = Math.floor(span / 2);
    const symbols = [];
    for (let i = 0; i < half; i++) {
      symbols.push('X');
      symbols.push('O');
    }
    if (span % 2 === 1) symbols.push(rng() < 0.5 ? 'X' : 'O');
    const shuffledSymbols = shuffle(symbols, rng);
    const targetMap = buildMap(
      targetIndices.map((idx, i) => ({ index: idx, symbol: shuffledSymbols[i] }))
    );
    const distractorMap = Array(16).fill('');
    return { condition, span, target_map: targetMap, distractor_map: distractorMap };
  }

  if (condition === 'ignore_distractor') {
    // span targets (X/O only); plus positions = floor(span/3) min 1, not overlapping targets
    const targetIndices = [];
    for (let k = 0; k < shuffled.length && targetIndices.length < span; k++) {
      const candidate = [...targetIndices, shuffled[k]];
      if (satisfiesMax2(candidate)) targetIndices.push(shuffled[k]);
    }
    const targetSet = new Set(targetIndices);
    const half = Math.floor(span / 2);
    const symbols = [];
    for (let i = 0; i < half; i++) {
      symbols.push('X');
      symbols.push('O');
    }
    if (span % 2 === 1) symbols.push(rng() < 0.5 ? 'X' : 'O');
    const shuffledSymbols = shuffle(symbols, rng);
    const targetMap = buildMap(
      targetIndices.map((idx, i) => ({ index: idx, symbol: shuffledSymbols[i] }))
    );
    const numPlus = Math.max(1, Math.floor(span / 3));
    const emptyIndices = indices.filter((i) => !targetSet.has(i));
    const shuffledEmpty = shuffle(emptyIndices, rng);
    const plusIndices = shuffledEmpty.slice(0, numPlus);
    const distractorMap = buildMap(plusIndices.map((index) => ({ index, symbol: 'Plus' })));
    return { condition, span, target_map: targetMap, distractor_map: distractorMap };
  }

  if (condition === 'remember_distractor') {
    // span total symbols including X, O, Plus
    const targetIndices = [];
    for (let k = 0; k < shuffled.length && targetIndices.length < span; k++) {
      const candidate = [...targetIndices, shuffled[k]];
      if (satisfiesMax2(candidate)) targetIndices.push(shuffled[k]);
    }
    const numPlus = Math.max(0, span - 2);
    const numXO = span - numPlus;
    const half = Math.floor(numXO / 2);
    const symbols = [];
    for (let i = 0; i < half; i++) {
      symbols.push('X');
      symbols.push('O');
    }
    if (numXO % 2 === 1) symbols.push(rng() < 0.5 ? 'X' : 'O');
    for (let i = 0; i < numPlus; i++) symbols.push('Plus');
    const shuffledSymbols = shuffle(symbols, rng);
    const targetMap = buildMap(
      targetIndices.map((idx, i) => ({ index: idx, symbol: shuffledSymbols[i] }))
    );
    const distractorMap = Array(16).fill('');
    return { condition, span, target_map: targetMap, distractor_map: distractorMap };
  }

  return null;
}

function main() {
  const items = [];
  let seed = 12345;
  for (const condition of CONDITIONS) {
    for (const span of SPANS) {
      for (let i = 0; i < ITEMS_PER_CELL; i++) {
        const rng = mulberry32(seed++);
        const item = generateItem(condition, span, rng);
        if (item) items.push(item);
      }
    }
  }
  const outPath = path.join(__dirname, '../src/gmt2/gmt2_item_bank.json');
  fs.writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf8');
  console.log('Wrote', items.length, 'items to', outPath);
}

main();
