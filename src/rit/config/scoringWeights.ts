/**
 * Provisional Inhibitory Control Score weights.
 *
 * WARNING: These weights are experimental placeholders for transparent scoring.
 * They are NOT psychometrically established. Edit here without changing engine code.
 *
 * Formula (documented in docs/RIT_SCORING.md):
 *   ICS = clamp(100 * (
 *     wCommission * (1 - commissionRate) +
 *     wOmission * (1 - omissionRate) +
 *     wRtStability * rtStability +
 *     wSpeed * speedComponent +
 *     wAnticipatory * (1 - anticipatoryRate) +
 *     wInterference * interferenceAccuracy +
 *     wSlowing * (excessiveSlowing ? 0 : 1)
 *   ), 0, 100)
 */

export const SCORING_WEIGHTS = {
  weightsId: 'provisional-v0.1.0',
  scoringVersion: '0.1.0-provisional',
  note:
    'Experimental composite. Weights are provisional and editable. Do not interpret as clinical norms or percentiles.',

  /** Must sum to 1.0 for interpretability of the 0–100 scale */
  weights: {
    commission: 0.3,
    omission: 0.15,
    rtStability: 0.15,
    speed: 0.1,
    anticipatory: 0.1,
    interference: 0.15,
    excessiveSlowing: 0.05,
  },

  /**
   * Speed component maps mean correct RT into [0,1].
   * Faster (lower RT) → higher score, but capped so reckless speed is not rewarded
   * when combined with commission penalties.
   */
  speedAnchorsMs: {
    excellent: 350,
    poor: 900,
  },

  /**
   * RT stability uses coefficient of variation (CV).
   * Lower CV → higher stability component.
   */
  rtCvAnchors: {
    excellent: 0.15,
    poor: 0.55,
  },
} as const;

export type ScoringWeights = typeof SCORING_WEIGHTS;
