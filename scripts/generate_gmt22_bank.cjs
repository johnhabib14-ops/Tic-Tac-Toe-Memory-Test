/**
 * Generates gmt22_item_bank.json with difficulty constraints.
 * Run: node scripts/generate_gmt22_bank.js
 * Output: src/gmt22/gmt22_item_bank.json
 */

const fs = require('fs');
const path = require('path');

const CONDITIONS = ['baseline', 'ignore_distractor', 'remember_distractor', 'delay'];
const BASE_SPANS = [2, 3, 4, 5, 6];
const OVERLOAD_SPAN = 7;
const ITEMS_PER_KEY = 4;

function emptyGrid() {
  return Array(16).fill('');
}

function row(i) { return Math.floor(i / 4); }
function col(i) { return i % 4; }

function countPerRow(grid) {
  const r = [0, 0, 0, 0];
  for (let i = 0; i < 16; i++) if (grid[i]) r[row(i)]++;
  return r;
}
function countPerCol(grid) {
  const c = [0, 0, 0, 0];
  for (let i = 0; i < 16; i++) if (grid[i]) c[col(i)]++;
  return c;
}

function isMirrorSymmetric(grid) {
  let h = true, v = true;
  for (let i = 0; i < 16; i++) {
    const r = row(i), c = col(i);
    if (grid[i] !== grid[r * 4 + (3 - c)]) h = false;
    if (grid[i] !== grid[(3 - r) * 4 + c]) v = false;
  }
  return h || v;
}

function count2x2BlocksWithTargets(grid, minTargets) {
  let count = 0;
  for (let top = 0; top < 3; top++) {
    for (let left = 0; left < 3; left++) {
      let t = 0;
      for (let dr = 0; dr < 2; dr++)
        for (let dc = 0; dc < 2; dc++)
          if (grid[(top + dr) * 4 + (left + dc)]) t++;
      if (t >= minTargets) count++;
    }
  }
  return count;
}

function adjacentPairs(grid) {
  let pairs = 0;
  for (let i = 0; i < 16; i++) {
    if (!grid[i]) continue;
    if (col(i) < 3 && grid[i + 1]) pairs++;
    if (row(i) < 3 && grid[i + 4]) pairs++;
  }
  return pairs;
}

function rowsWithTarget(grid) {
  const s = new Set();
  for (let i = 0; i < 16; i++) if (grid[i]) s.add(row(i));
  return s.size;
}
function colsWithTarget(grid) {
  const s = new Set();
  for (let i = 0; i < 16; i++) if (grid[i]) s.add(col(i));
  return s.size;
}

function xoBalance(grid, excludePlus) {
  let x = 0, o = 0;
  for (let i = 0; i < 16; i++) {
    if (grid[i] === 'X') x++;
    else if (grid[i] === 'O') o++;
  }
  return Math.abs(x - o);
}

function validTargetGrid(grid, span) {
  const filled = grid.filter(Boolean).length;
  if (filled !== span) return false;
  const r = countPerRow(grid), c = countPerCol(grid);
  if (r.some(n => n > 2) || c.some(n => n > 2)) return false;
  if (count2x2BlocksWithTargets(grid, 3) > 0) return false;
  if (adjacentPairs(grid) > Math.floor(span / 2)) return false;
  const minRC = span >= 4 ? 3 : 2;
  if (rowsWithTarget(grid) < minRC || colsWithTarget(grid) < minRC) return false;
  if (isMirrorSymmetric(grid)) return false;
  return true;
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

function generateTargetMaps(span, condition, count, rng) {
  const out = [];
  const indices = [...Array(16).keys()];
  const seen = new Set();

  let attempts = 0;
  while (out.length < count && attempts < 8000) {
    attempts++;
    const grid = emptyGrid();
    const positions = shuffle(indices, rng).slice(0, span);
    const usePlus = condition === 'remember_distractor' && span >= 2 && rng() < 0.4;
    const numPlus = usePlus ? 1 : 0;
    const rest = span - numPlus;
    const targetX = Math.ceil(rest / 2);
    const targetO = rest - targetX;

    let xC = 0, oC = 0, plusC = 0;
    for (let i = 0; i < span; i++) {
      let sym;
      if (numPlus > 0 && plusC < numPlus) { sym = 'Plus'; plusC++; }
      else if (xC < targetX) { sym = 'X'; xC++; }
      else { sym = 'O'; oC++; }
      grid[positions[i]] = sym;
    }

    const key = grid.join(',');
    if (seen.has(key)) continue;
    if (!validTargetGrid(grid, span)) continue;
    if (condition === 'remember_distractor' && xoBalance(grid) > 1) continue;
    if (condition !== 'remember_distractor' && xoBalance(grid) > 1) continue;
    seen.add(key);
    out.push(grid.slice());
  }
  return out;
}

function distractorCount(span) {
  return Math.max(1, Math.ceil(span / 2) - 1);
}

function addDistractors(targetMap, span, rng) {
  const distractorMap = emptyGrid();
  const emptyIndices = [];
  for (let i = 0; i < 16; i++) if (!targetMap[i]) emptyIndices.push(i);
  const n = Math.min(distractorCount(span), emptyIndices.length);
  const shuffled = shuffle(emptyIndices, rng);
  for (let i = 0; i < n; i++) distractorMap[shuffled[i]] = 'Plus';
  return distractorMap;
}

function main() {
  const rng = mulberry32(12345);
  const bank = [];
  const spans = [...BASE_SPANS, OVERLOAD_SPAN];

  for (const condition of CONDITIONS) {
    for (const span of spans) {
      const targetMaps = generateTargetMaps(span, condition, ITEMS_PER_KEY, rng);
      for (const target_map of targetMaps) {
        const distractor_map = condition === 'ignore_distractor'
          ? addDistractors(target_map, span, rng)
          : emptyGrid();
        bank.push({
          condition,
          span,
          target_map: target_map.map(c => c || ''),
          distractor_map: distractor_map.map(c => c || ''),
        });
      }
    }
  }

  const outPath = path.join(__dirname, '../src/gmt22/gmt22_item_bank.json');
  fs.writeFileSync(outPath, JSON.stringify(bank, null, 2), 'utf8');
  console.log('Wrote', outPath, 'with', bank.length, 'items');
}

main();
