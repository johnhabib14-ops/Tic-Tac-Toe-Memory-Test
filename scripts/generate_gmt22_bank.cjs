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
  const minRC = span >= 6 ? 4 : (span >= 4 ? 3 : 2);
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

/**
 * Pick `span` positions slightly favoring cells with lower heatmap counts (reduces spatial clustering).
 * Key = rng() - penalty * heatmap[i]; sort descending so low-heatmap cells tend to be chosen first.
 */
function pickPositionsWeighted(span, heatmap, rng) {
  const penalty = 0.12;
  const indices = [...Array(16).keys()];
  const keys = indices.map((i) => rng() - penalty * (heatmap[i] || 0));
  const sorted = indices.slice().sort((a, b) => keys[b] - keys[a]);
  return sorted.slice(0, span);
}

/**
 * Pick one position from the list to assign Plus, favoring lower plusHeatmap counts.
 */
function pickPlusPositionWeighted(positions, plusHeatmap, rng) {
  const penalty = 0.12;
  const withKeys = positions.map((p) => ({ p, key: rng() - penalty * (plusHeatmap[p] || 0) }));
  withKeys.sort((a, b) => b.key - a.key);
  return withKeys[0].p;
}

function generateTargetMaps(span, condition, count, rng, globalSeen, heatmap, plusHeatmap) {
  const out = [];
  const indices = [...Array(16).keys()];
  const seen = new Set();

  let attempts = 0;
  while (out.length < count && attempts < 12000) {
    attempts++;
    const grid = emptyGrid();
    const positions = heatmap
      ? pickPositionsWeighted(span, heatmap, rng)
      : shuffle(indices, rng).slice(0, span);
    const usePlus = condition === 'remember_distractor' && span >= 2;
    const numPlus = usePlus ? 1 : 0;
    const rest = span - numPlus;
    // Balance X/O: for odd rest, randomize which symbol gets the extra to get ~0.5 globally
    const extraIsX = rng() < 0.5;
    const targetX = extraIsX ? Math.ceil(rest / 2) : Math.floor(rest / 2);
    const targetO = rest - targetX;

    if (usePlus && numPlus === 1 && plusHeatmap) {
      // Balance Plus position: choose which of the span positions gets Plus
      const plusPosition = pickPlusPositionWeighted(positions, plusHeatmap, rng);
      const otherPositions = positions.filter((p) => p !== plusPosition).sort((a, b) => a - b);
      grid[plusPosition] = 'Plus';
      for (let i = 0; i < otherPositions.length; i++) {
        grid[otherPositions[i]] = i < targetX ? 'X' : 'O';
      }
    } else {
      let xC = 0, oC = 0, plusC = 0;
      for (let i = 0; i < span; i++) {
        let sym;
        if (numPlus > 0 && plusC < numPlus) { sym = 'Plus'; plusC++; }
        else if (xC < targetX) { sym = 'X'; xC++; }
        else { sym = 'O'; oC++; }
        grid[positions[i]] = sym;
      }
    }

    const key = grid.join(',');
    if (seen.has(key)) continue;
    if (globalSeen && globalSeen.has(key)) continue;
    if (!validTargetGrid(grid, span)) continue;
    if (condition === 'remember_distractor' && xoBalance(grid) > 1) continue;
    if (condition !== 'remember_distractor' && xoBalance(grid) > 1) continue;
    seen.add(key);
    if (globalSeen) globalSeen.add(key);
    const layout = grid.slice();
    out.push(layout);
    if (heatmap) {
      for (let i = 0; i < 16; i++) if (layout[i]) heatmap[i]++;
    }
    if (plusHeatmap && condition === 'remember_distractor') {
      for (let i = 0; i < 16; i++) if (layout[i] === 'Plus') plusHeatmap[i]++;
    }
  }
  return out;
}

function distractorCount(span) {
  return Math.max(1, Math.ceil(span / 2) - 1);
}

/**
 * Pick which empty cells get distractor Plus, favoring lower heatmap counts.
 */
function pickDistractorPositionsWeighted(emptyIndices, n, heatmap, rng) {
  if (!heatmap || emptyIndices.length === 0) {
    const shuffled = shuffle(emptyIndices, rng);
    return shuffled.slice(0, n);
  }
  const penalty = 0.22;
  const withKeys = emptyIndices.map((i) => ({ i, key: rng() - penalty * (heatmap[i] || 0) }));
  withKeys.sort((a, b) => b.key - a.key);
  return withKeys.slice(0, n).map((x) => x.i);
}

function addDistractors(targetMap, span, rng, distractorPlusHeatmap) {
  const distractorMap = emptyGrid();
  const emptyIndices = [];
  for (let i = 0; i < 16; i++) if (!targetMap[i]) emptyIndices.push(i);
  const n = Math.min(distractorCount(span), emptyIndices.length);
  const chosen = pickDistractorPositionsWeighted(emptyIndices, n, distractorPlusHeatmap, rng);
  for (const i of chosen) distractorMap[i] = 'Plus';
  return distractorMap;
}

function main() {
  const rng = mulberry32(12345);
  const bank = [];
  const spans = [...BASE_SPANS, OVERLOAD_SPAN];
  const globalLayoutSeen = new Set();
  const heatmap = Array(16).fill(0);
  const plusHeatmap = Array(16).fill(0);
  const distractorPlusHeatmap = Array(16).fill(0);

  for (const condition of CONDITIONS) {
    for (const span of spans) {
      const targetMaps = generateTargetMaps(span, condition, ITEMS_PER_KEY, rng, globalLayoutSeen, heatmap, plusHeatmap);
      for (const target_map of targetMaps) {
        const distractor_map = condition === 'ignore_distractor'
          ? addDistractors(target_map, span, rng, distractorPlusHeatmap)
          : emptyGrid();
        if (condition === 'ignore_distractor') {
          for (let i = 0; i < 16; i++) if (distractor_map[i] === 'Plus') distractorPlusHeatmap[i]++;
        }
        const targetMapArr = target_map.map((c) => c || '');
        bank.push({
          condition,
          span,
          target_map: targetMapArr,
          distractor_map: distractor_map.map((c) => c || ''),
          adjacent_pairs_count: adjacentPairs(target_map),
          distinct_rows_used: rowsWithTarget(target_map),
          distinct_cols_used: colsWithTarget(target_map),
        });
      }
    }
  }

  const outPath = path.join(__dirname, '../src/gmt22/gmt22_item_bank.json');
  fs.writeFileSync(outPath, JSON.stringify(bank, null, 2), 'utf8');
  console.log('Wrote', outPath, 'with', bank.length, 'items');
}

main();
