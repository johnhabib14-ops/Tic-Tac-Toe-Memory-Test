import type { TargetMap, ResponseMap } from '../types';

export function scoreGrid(
  targetMap: TargetMap,
  responseMap: ResponseMap,
  numTargets: number,
  gridSize: number
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
