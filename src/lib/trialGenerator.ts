import type { GridTrial, TrialConfig, TargetMap, DisplayMap, DisplayCell } from '../types';
import { LEVELS } from './levelConfig';
import { createSeededRandom, shuffle } from './seedRandom';

const DISTRACTOR_TYPES: Array<'TRI' | 'STAR' | 'DIAMOND' | 'SQUARE'> = ['TRI', 'STAR', 'DIAMOND', 'SQUARE'];

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

  const grids: GridTrial[] = [];
  for (let g = 0; g < params.numGrids; g++) {
    const gridSeed = seed + g * 10;
    const rnd = createSeededRandom(gridSeed);
    const cellIndices = buildCellIndices(params.gridSize);
    const n = params.gridSize * params.gridSize;
    const centerCell = Math.floor(n / 2); // e.g. 4 for 3x3

    let targetCells: number[];
    if (level === 1 && trialIndex === 0 && g === 0) {
      targetCells = [centerCell];
    } else {
      targetCells = shuffle(cellIndices, rnd).slice(0, params.numTargets);
    }

    const symbols = balancedSymbols(targetCells.length, rnd);
    const targetMap: TargetMap = {};
    targetCells.forEach((cell, i) => {
      targetMap[cell] = symbols[i];
    });

    const displayMap: DisplayMap = {};
    for (const c of targetCells) {
      displayMap[c] = { type: targetMap[c] };
    }

    if (params.hasDistractors && params.numDistractors > 0) {
      const emptyCells = cellIndices.filter((c) => targetMap[c] === undefined);
      const distractorCells = shuffle(emptyCells, rnd).slice(0, params.numDistractors);
      for (const c of distractorCells) {
        const kind = DISTRACTOR_TYPES[Math.floor(rnd() * DISTRACTOR_TYPES.length)];
        displayMap[c] = { type: kind };
      }
    }

    grids.push({
      gridSize: params.gridSize,
      numTargets: params.numTargets,
      targetMap,
      displayMap,
    });
  }

  return {
    level,
    trialIndex,
    grids,
    displayTimeMs: params.displayTimeMs,
    delayMs: params.delayMs,
    interGridBlankMs: params.interGridBlankMs,
    reconstructionTimeLimitMs: params.reconstructionTimeLimitMs,
    responseDecoysEnabled: params.responseDecoysEnabled,
  };
}
