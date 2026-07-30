# CFT Scoring (provisional)

**Scoring version:** `0.1.0-provisional`  
**Weights ID:** `provisional-v0.1.0`  
**Config:** `src/cft/config/scoringWeights.ts`  
**Engine:** `src/cft/lib/ScoringEngine.ts`

## Cognitive Flexibility Score (CFS)

Primary scored blocks: `predictable_switch`, `cued_switch`, `interference`.

```
CFS = 100 * (
  0.20 * switchAccuracy +
  0.15 * invert(switchCostRtMs) +
  0.15 * invert(switchCostAccuracy) +
  0.15 * (1 - perseverativeErrorRate) +
  0.10 * (1 - ruleMaintenanceErrorRate) +
  0.10 * conflictAccuracy +
  0.10 * rtStability +
  0.05 * postErrorRecovery
)
```

Weights must sum to 1.0. Anchors for switch-cost RT/accuracy and RT CV are editable in config.

## Switch cost

- `switchCostRtMs` = mean correct RT(switch) − mean correct RT(stay)
- `switchCostAccuracy` = accuracy(stay) − accuracy(switch)

## Non-claims

Experimental transparent composite only. Not normed. Do not interpret as clinical percentiles.
