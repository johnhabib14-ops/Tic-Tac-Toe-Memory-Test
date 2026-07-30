# RIT Provisional Scoring Documentation

**Scoring version:** `0.1.0-provisional`  
**Weights ID:** `provisional-v0.1.0`  
**Status:** Experimental — not psychometrically established

## Primary score

**Provisional Inhibitory Control Score (ICS)** on a 0–100 scale.

Baseline and practice trials are **excluded** from the primary score.

Included blocks: habit, standard, interference.

### Formula

```
ICS = round(100 * clamp01(
  w_c * (1 - commission_rate) +
  w_o * (1 - omission_rate) +
  w_s * rt_stability +
  w_sp * speed_component +
  w_a * (1 - clamp01(anticipatory_rate * 5)) +
  w_i * interference_accuracy +
  w_sl * (excessive_slowing ? 0 : 1)
), 1)
```

Default weights (must sum to 1.0):

| Component | Weight | Source file |
|-----------|--------|-------------|
| Commission (inverted) | 0.30 | `src/rit/config/scoringWeights.ts` |
| Omission (inverted) | 0.15 | same |
| RT stability | 0.15 | same |
| Speed | 0.10 | same |
| Anticipatory (inverted) | 0.10 | same |
| High-interference accuracy | 0.15 | same |
| Excessive slowing penalty slot | 0.05 | same |

### Component definitions

- **commission_rate** = commission errors / no-go trials (primary blocks)
- **omission_rate** = omissions / go trials (primary blocks)
- **rt_stability** = inverted CV of correct go RTs (anchors 0.15–0.55)
- **speed_component** = inverted mean correct go RT (anchors 350–900 ms)
- **anticipatory_rate** = anticipatory flags / primary trials (RT < 150 ms)
- **interference_accuracy** = accuracy on interference block
- **excessive_slowing** = mean correct RT > 1200 ms

Weights are editable in configuration without changing task logic.

## Secondary process scores

Stored and reported separately; see `ScoringEngine.ts`.

## What is not computed yet

- Percentiles / standard scores
- Diagnostic labels
- Impairment ranges
- Norm-referenced interpretations
