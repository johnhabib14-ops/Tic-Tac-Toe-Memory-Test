import type { LevelParams } from '../types';

// 30 levels, 2 trials each.
// Display: 1–10 @ 1.5s, 11–20 @ 1s, 21–30 @ 1.5s.
// Timer: 1–9 @ 30s, 10–19 @ 1min, 20–30 @ 2min.
// Distractors from level 10. Double grid (numGrids: 2) from level 20.
const THIRTY_SEC = 30 * 1000;
const ONE_MIN = 60 * 1000;
const TWO_MIN = 2 * 60 * 1000;

export const LEVELS: LevelParams[] = [
  // Levels 1–9: no distractors, 1.5s display, 30s limit
  { gridSize: 3, numTargets: 1, numGrids: 1, displayTimeMs: 1500, delayMs: 500, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 2, numGrids: 1, displayTimeMs: 1500, delayMs: 800, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 3, numGrids: 1, displayTimeMs: 1500, delayMs: 1000, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 4, numGrids: 1, displayTimeMs: 1500, delayMs: 1200, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 5, numGrids: 1, displayTimeMs: 1500, delayMs: 1400, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 6, numGrids: 1, displayTimeMs: 1500, delayMs: 1600, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 7, numGrids: 1, displayTimeMs: 1500, delayMs: 1800, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 8, numGrids: 1, displayTimeMs: 1500, delayMs: 2000, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  { gridSize: 3, numTargets: 9, numGrids: 1, displayTimeMs: 1500, delayMs: 2200, interGridBlankMs: 0, reconstructionTimeLimitMs: THIRTY_SEC, hasDistractors: false, numDistractors: 0, responseDecoysEnabled: false },
  // Levels 10–19: distractors, 1s display, 1min limit, single grid
  { gridSize: 3, numTargets: 4, numGrids: 1, displayTimeMs: 1000, delayMs: 2000, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 2, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 5, numGrids: 1, displayTimeMs: 1000, delayMs: 2200, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 2, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 6, numGrids: 1, displayTimeMs: 1000, delayMs: 2400, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 3, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 7, numGrids: 1, displayTimeMs: 1000, delayMs: 2600, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 3, responseDecoysEnabled: true },
  { gridSize: 4, numTargets: 6, numGrids: 1, displayTimeMs: 1000, delayMs: 2200, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 3, responseDecoysEnabled: true },
  { gridSize: 4, numTargets: 8, numGrids: 1, displayTimeMs: 1000, delayMs: 2400, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 4, responseDecoysEnabled: true },
  { gridSize: 4, numTargets: 10, numGrids: 1, displayTimeMs: 1000, delayMs: 2600, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 4, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 8, numGrids: 1, displayTimeMs: 1000, delayMs: 2400, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 3, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 9, numGrids: 1, displayTimeMs: 1000, delayMs: 2600, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 3, responseDecoysEnabled: true },
  { gridSize: 4, numTargets: 8, numGrids: 1, displayTimeMs: 1000, delayMs: 2600, interGridBlankMs: 0, reconstructionTimeLimitMs: ONE_MIN, hasDistractors: true, numDistractors: 4, responseDecoysEnabled: true },
  // Levels 20–30: double grid, 2min limit; level 20 still 1s display (10–20 range), 21–30 @ 1.5s
  { gridSize: 3, numTargets: 4, numGrids: 2, displayTimeMs: 1000, delayMs: 2000, interGridBlankMs: 300, reconstructionTimeLimitMs: TWO_MIN, hasDistractors: true, numDistractors: 2, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 5, numGrids: 2, displayTimeMs: 1500, delayMs: 2200, interGridBlankMs: 300, reconstructionTimeLimitMs: TWO_MIN, hasDistractors: true, numDistractors: 3, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 6, numGrids: 2, displayTimeMs: 1500, delayMs: 2400, interGridBlankMs: 300, reconstructionTimeLimitMs: TWO_MIN, hasDistractors: true, numDistractors: 3, responseDecoysEnabled: true },
  { gridSize: 4, numTargets: 6, numGrids: 2, displayTimeMs: 1500, delayMs: 2400, interGridBlankMs: 300, reconstructionTimeLimitMs: TWO_MIN, hasDistractors: true, numDistractors: 3, responseDecoysEnabled: true },
  { gridSize: 4, numTargets: 8, numGrids: 2, displayTimeMs: 1500, delayMs: 2600, interGridBlankMs: 300, reconstructionTimeLimitMs: TWO_MIN, hasDistractors: true, numDistractors: 4, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 7, numGrids: 2, displayTimeMs: 1500, delayMs: 2600, interGridBlankMs: 300, reconstructionTimeLimitMs: TWO_MIN, hasDistractors: true, numDistractors: 3, responseDecoysEnabled: true },
  { gridSize: 3, numTargets: 8, numGrids: 2, displayTimeMs: 1500, delayMs: 2800, interGridBlankMs: 300, reconstructionTimeLimitMs: TWO_MIN, hasDistractors: true, numDistractors: 3, responseDecoysEnabled: true },
  { gridSize: 4, numTargets: 6, numGrids: 2, displayTimeMs: 1500, delayMs: 2600, interGridBlankMs: 300, reconstructionTimeLimitMs: TWO_MIN, hasDistractors: true, numDistractors: 3, responseDecoysEnabled: true },
  { gridSize: 4, numTargets: 8, numGrids: 2, displayTimeMs: 1500, delayMs: 2800, interGridBlankMs: 300, reconstructionTimeLimitMs: TWO_MIN, hasDistractors: true, numDistractors: 4, responseDecoysEnabled: true },
  { gridSize: 4, numTargets: 10, numGrids: 2, displayTimeMs: 1500, delayMs: 3000, interGridBlankMs: 300, reconstructionTimeLimitMs: TWO_MIN, hasDistractors: true, numDistractors: 4, responseDecoysEnabled: true },
];

export const NUM_LEVELS = LEVELS.length;
