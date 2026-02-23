import type { GridTrial, TrialConfig, TargetMap, DisplayMap } from '../types';
import { LEVELS } from './levelConfig';
import { createSeededRandom, shuffle } from './seedRandom';

// Triangles only for distractors
const DISTRACTOR_TYPE = 'TRI' as const;

function buildCellIndices(gridSize: number): number[] {
  const n = gridSize * gridSize;
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(i);
  return out;
}

function balancedSymbols(n: number, random: () => number): ('X' | 'O')[] {
  const half = Math.floor(n / 2);
  const symbols: ('X' | 'O')[] = [];
  for (let i = 0; i < half; i++) {
    symbols.push('X');
    symbols.push('O');
  }
  if (n % 2 === 1) {
    symbols.push(random() < 0.5 ? 'X' : 'O');
  }
  return shuffle(symbols, random);
}

export function generateTrial(
  level: number,
  trialIndex: number,
  sessionSeed: number
): TrialConfig {
  const params = LEVELS[level - 1];
  if (!params) throw new Error(`Unknown level ${level}`);
  const seed = sessionSeed + level * 1000 + trialIndex * 100;
  const random = createSeededRandom(seed);

  const cellIndices = buildCellIndices(params.gridSize);
  const targetCells = shuffle(cellIndices, random).slice(0, params.numTargets);

  const symbols = balancedSymbols(targetCells.length, random);
  // Shuffle (cell, symbol) pairs so placement has no pattern (avoids X/O clusters)
  const pairs = targetCells.map((cell, i) => ({ cell, symbol: symbols[i] }));
  const shuffledPairs = shuffle(pairs, random);
  const targetMap: TargetMap = {};
  shuffledPairs.forEach(({ cell, symbol }) => {
    targetMap[cell] = symbol;
  });

  const displayMap: DisplayMap = {};
  for (const c of Object.keys(targetMap).map(Number)) {
    displayMap[c] = { type: targetMap[c] };
  }

  if (params.hasDistractors && params.numDistractors > 0) {
    const emptyCells = cellIndices.filter((c) => targetMap[c] === undefined);
    const distractorCells = shuffle(emptyCells, random).slice(0, params.numDistractors);
    for (const c of distractorCells) {
      displayMap[c] = { type: DISTRACTOR_TYPE };
    }
  }

  const grid: GridTrial = {
    gridSize: params.gridSize,
    numTargets: params.numTargets,
    targetMap,
    displayMap,
  };

  return {
    level,
    trialIndex,
    grids: [grid],
    displayTimeMs: params.displayTimeMs,
    delayMs: params.delayMs,
    interGridBlankMs: params.interGridBlankMs,
    reconstructionTimeLimitMs: params.reconstructionTimeLimitMs,
    responseDecoysEnabled: params.responseDecoysEnabled,
  };
}
