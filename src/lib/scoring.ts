import type { TargetMap, ResponseMap } from '../types';

export function scoreGrid(
  targetMap: TargetMap,
  responseMap: ResponseMap,
  numTargets: number,
  _gridSize: number
): {
  correctPlacements: number;
  commissionErrors: number;
  wrongShapeInTarget: number;
  omissionErrors: number;
  accuracyPercent: number;
  trialCorrectBinary: boolean;
} {
  const targetCells = new Set(Object.keys(targetMap).map(Number));
  let correctPlacements = 0;
  let commissionErrors = 0;
  let wrongShapeInTarget = 0;

  for (const [cellStr, symbol] of Object.entries(responseMap)) {
    const cell = Number(cellStr);
    if (symbol === 'EMPTY' || symbol === undefined) continue;
    const targetSymbol = targetMap[cell];
    if (targetCells.has(cell)) {
      if (targetSymbol === symbol) {
        correctPlacements++;
      } else if (symbol === 'X' || symbol === 'O') {
        wrongShapeInTarget++; // X/O placed but wrong shape
      }
    } else {
      commissionErrors++;
    }
  }

  const omissionErrors = numTargets - correctPlacements;
  const accuracyPercent = numTargets > 0 ? (correctPlacements / numTargets) * 100 : 0;
  const trialCorrectBinary = correctPlacements === numTargets && commissionErrors === 0;

  return {
    correctPlacements,
    commissionErrors,
    wrongShapeInTarget,
    omissionErrors,
    accuracyPercent,
    trialCorrectBinary,
  };
}

/** Points for this level: 1–9 → 0 or 1; 10–20 → 0, 1, or 2 (2 = perfect, 1 = 5+ correct). */
export function getLevelPoints(
  level: number,
  correctPlacements: number,
  numTargets: number,
  commissionErrors: number
): 0 | 1 | 2 {
  const perfect = correctPlacements === numTargets && commissionErrors === 0;
  if (level >= 1 && level <= 9) {
    return perfect ? 1 : 0;
  }
  if (level >= 10 && level <= 20) {
    if (perfect) return 2;
    if (correctPlacements >= 5) return 1;
    return 0;
  }
  return 0;
}

export function normalizeResponseMap(
  responseMap: ResponseMap,
  gridSize: number
): ResponseMap {
  const n = gridSize * gridSize;
  const out: ResponseMap = {};
  for (let i = 0; i < n; i++) {
    out[i] = responseMap[i] ?? 'EMPTY';
  }
  return out;
}
