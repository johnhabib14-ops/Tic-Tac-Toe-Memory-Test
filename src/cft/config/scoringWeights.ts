/**
 * Provisional Cognitive Flexibility Score weights.
 *
 * WARNING: Experimental placeholders for transparent scoring.
 * NOT psychometrically established. Edit here without changing engine code.
 *
 * CFS = clamp(100 * (
 *   wSwitchAcc * switchAccuracy +
 *   wSwitchCostRt * invert(switchCostRt) +
 *   wSwitchCostAcc * invert(switchCostAcc) +
 *   wPersev * (1 - perseverativeRate) +
 *   wMaintain * (1 - maintenanceErrorRate) +
 *   wConflict * conflictAccuracy +
 *   wRtStability * rtStability +
 *   wRecovery * postErrorRecovery
 * ), 0, 100)
 */

export const SCORING_WEIGHTS = {
  weightsId: 'provisional-v0.1.0',
  scoringVersion: '0.1.0-provisional',
  note:
    'Experimental composite. Weights are provisional and editable. Do not interpret as clinical norms or percentiles.',

  /** Must sum to 1.0 */
  weights: {
    switchAccuracy: 0.2,
    switchCostRt: 0.15,
    switchCostAcc: 0.15,
    perseverative: 0.15,
    ruleMaintenance: 0.1,
    conflict: 0.1,
    rtStability: 0.1,
    recovery: 0.05,
  },

  switchCostRtAnchorsMs: {
    excellent: 0,
    poor: 350,
  },

  switchCostAccAnchors: {
    excellent: 0,
    poor: 0.35,
  },

  rtCvAnchors: {
    excellent: 0.15,
    poor: 0.55,
  },
} as const;

export type ScoringWeights = typeof SCORING_WEIGHTS;
