# RIT Phase 8 — Psychometrics plan (documentation only)

**By Habib Labs LLC** · Experimental — **no norms or clinical cutoffs in this phase document.**

Phase 8 is a research plan for when pilot (Phase 7) and larger samples exist. It does **not** ship fake norms, percentiles, or ADHD/IQ framing into the product UI.

## Prerequisites

- Stable task version stamp (e.g. post-pilot `0.3.x` if config changed).  
- Documented scoring version; weights treated as provisional until reliability supports locking.  
- Clean mode policy: analyze Clinical and Game separately until equivalence is shown.  
- Validity flags applied consistently; report both flagged-in and flagged-out samples.

## Stage A — Score stability (first empirical step)

| Analysis | Purpose |
|----------|---------|
| Split-half / odd–even (scored trials) | Internal consistency of accuracy / ICS components |
| Block stability | Habit vs standard vs interference consistency |
| Test–retest (subset, ~2–4 weeks) | Temporal stability of ICS and commission rate |
| RT reliability | Mean correct go RT; commission RT if n allows |

Stop if reliability is too low to support further claims; revise length/ratios before Stage B.

## Stage B — Construct validity

| Comparison | Expectation |
|------------|-------------|
| Established inhibition / go–no-go measures | Moderate convergence |
| Sustained attention | Partial overlap; not identical |
| Processing speed | Secondary association with RT, not primary claim |
| Working memory (e.g. GMT) | Related EF family; divergence from pure inhibition |
| Self-report impulsivity (optional) | Weak–moderate; interpret cautiously |

Do not market RIT as an ADHD or IQ test even if correlations appear.

## Stage C — Norms (later; not pilot)

Only after adequate comparison samples:

- Stratify by age, education, language, device/input, visual mode, gaming familiarity, geography as feasible.  
- Publish **descriptive** reference tables first; clinical cutoffs only with independent clinical validation (out of scope until funded).  
- Version-lock scoring before releasing any reference tables.

## Explicit non-deliverables of Phase 8 (product)

Until Stage C evidence exists, the app must continue to show:

- Provisional / experimental banners  
- No percentiles, T-scores, or diagnostic labels  
- Neutral validity language (not “malingering” / “ADHD positive”)

## Open decisions (remain open)

Same unresolved set as the implementation plan §24: weights, thresholds, trial counts, interference rule, adaptive scoring, battery EF composite, anticipatory cutoff, practice discontinue, future SSRT module.

## Tracking

Record analysis scripts and sample Ns in a future `docs/RIT_PSYCHOMETRICS_RESULTS.md` when data are analyzed — do not invent results here.
