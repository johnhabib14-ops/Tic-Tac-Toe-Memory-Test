import type { LevelParams } from '../types';

// 20 levels, 1 trial each. Display: 2s for all. Single grid only.
// Reconstruction time: 1–4: 20s, 5–9: 30s, 10–18: 60s, 19–20: 120s
const TWENTY_SEC = 20 * 1000;
const THIRTY_SEC = 30 * 1000;
const ONE_MIN = 60 * 1000;
const TWO_MIN = 120 * 1000;

export const LEVELS: LevelParams[] = [
  // Levels 1–4: 20s
  { gridSize: 3, numTargets: 1, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: TWENTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 2, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: TWENTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 3, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: TWENTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 4, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: TWENTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  // Levels 5–9: 30s
  { gridSize: 3, numTargets: 5, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 6, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 7, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 8, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 9, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  // Levels 10–18: 60s, 8 targets + 1 triangle (so triangle is visible)
  { gridSize: 3, numTargets: 8, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 1, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 8, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 1, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 8, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 1, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 8, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 1, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 8, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 1, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 8, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 1, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 8, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 1, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 8, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 1, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 8, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 1, responseDecoysEnabled: true },
  // Levels 19–20: 120s, 4x4 grid
  { gridSize: 4, numTargets: 9, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: TWO_MIN, hasDistractors: true, numDistractors: 2, responseDecoysEnabled: true },
  { gridSize: 4, numTargets: 9, numGrids: 1, displayTimeMs: 2000, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: TWO_MIN, hasDistractors: true, numDistractors: 2, responseDecoysEnabled: true },
];

export const NUM_LEVELS = LEVELS.length;
