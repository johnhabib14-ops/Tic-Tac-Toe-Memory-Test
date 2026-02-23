// Cell symbol: X, O, or distractor/decoy (for display/response)
export type CellSymbol = 'X' | 'O' | 'TRI' | 'STAR' | 'DIAMOND' | 'SQUARE' | 'EMPTY';

// Target map: only X and O (what the participant should reproduce)
export type TargetMap = Record<number, 'X' | 'O'>;

// Response map: what the participant placed (can include decoys)
export type ResponseMap = Record<number, CellSymbol>;

export type Gender = 'Male' | 'Female' | 'Nonbinary' | 'Prefer not to say' | 'Self describe';

export interface Participant {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  education: string;
  timestamp: string; // ISO
  sessionSeed: number;
}

export interface LevelParams {
  gridSize: number;
  numTargets: number;
  numGrids: number;
  displayTimeMs: number;
  delayMs: number;
  interGridBlankMs: number;
  reconstructionTimeLimitMs: number;
  hasDistractors: boolean;
  numDistractors: number;
  responseDecoysEnabled: boolean;
}

// One grid's display: targets + optional distractors per cell
export type DisplayCell = { type: 'X' | 'O' } | { type: 'TRI' | 'STAR' | 'DIAMOND' | 'SQUARE' };
export type DisplayMap = Record<number, DisplayCell>;

export interface GridTrial {
  gridSize: number;
  numTargets: number;
  targetMap: TargetMap;
  displayMap: DisplayMap;
}

// One trial can have 1 or 2 grids
export interface TrialConfig {
  level: number;
  trialIndex: number;
  grids: GridTrial[];
  displayTimeMs: number;
  delayMs: number;
  interGridBlankMs: number;
  reconstructionTimeLimitMs: number;
  responseDecoysEnabled: boolean;
}

export interface TrialRecord {
  participantId: string;
  level: number;
  trialIndex: number;
  gridIndex: number;
  gridSize: number;
  numTargets: number;
  numGrids: number;
  displayTimeMs: number;
  delayMs: number;
  distractorCount: number;
  targetMap: TargetMap;
  responseMap: ResponseMap;
  correctPlacements: number;
  commissionErrors: number;
  wrongShapeInTarget: number;
  omissionErrors: number;
  accuracyPercent: number;
  reactionTimeMs: number;
  trialCorrectBinary: boolean; // perfect = 100% and 0 commission
  levelPoints: number; // 0, 1, or 2 for this level (1–9: max 1; 10–20: max 2)
}

export interface SummaryMetrics {
  totalCorrectPlacements: number;
  totalTargets: number;
  totalIncorrectPlacements: number;
  totalWrongShapeUsed: number;
  overallAccuracyPercent: number;
  meanReactionTimeMs: number;
  levelPassedCount: number;
  highestLevelPassed: number;
  memoryPoints: number; // sum of levelPoints; max 31 (9×1 + 11×2)
}

export interface CopyResult {
  score: number; // 0–9, 1 point per correctly placed shape
  timeMs: number;
}
