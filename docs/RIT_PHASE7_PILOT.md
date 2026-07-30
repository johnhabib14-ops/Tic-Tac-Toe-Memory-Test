# RIT Phase 7 — Supervised pilot materials

**By Habib Labs LLC** · Experimental instrument — not diagnostic, validated, or normed.

Phase 7 is a **supervised human pilot** (target n ≈ 20–40), not a code release. Software readiness is documented here; data collection and config tuning happen with examiners.

## Goals

1. Confirm protocol feasibility (intake → practice → blocks → completion → export).
2. Counterbalance **Clinical vs Game** visual modes (never mix mid-session).
3. Collect provisional ICS, error, RT, and validity-flag distributions for tuning only.
4. Verify persistence path (local archive ± Supabase) under real conditions.

## Materials (use together)

| Document | Use |
|----------|-----|
| [`RIT_PILOT_CHECKLIST.md`](./RIT_PILOT_CHECKLIST.md) | Session-day examiner checklist |
| [`RIT_DATA_EXPORT.md`](./RIT_DATA_EXPORT.md) | SQL setup, CSV shapes, env vars |
| [`RIT_SCORING.md`](./RIT_SCORING.md) | Provisional ICS / components (no percentiles) |
| [`RIT_DATA_DICTIONARY.md`](./RIT_DATA_DICTIONARY.md) | Field definitions for analysts |
| This file | Study design, counterbalance, logging |

## Recommended design

| Factor | Plan |
|--------|------|
| n | 20–40 completers after validity screen |
| Modes | ~50% Clinical, ~50% Game; assign **before** start |
| Protocol | Prefer `0.2.0-pilot` for first wave; full `0.2.0` optional second wave |
| Seed | Examiner-recorded; needed for `npm run audit:rit` / session replay |
| Device | Prefer keyboard desktop; log touch/mobile as exploratory |
| Interruptions | Examiner notes + automatic focus/visibility flags |

## Examiner log (minimum fields)

Copy per participant:

- Participant / anonymous ID  
- Date, examiner  
- Visual mode (clinical | game) — locked for session  
- Protocol profile (full | pilot)  
- Randomization seed  
- Device notes (keyboard/touch, browser)  
- Practice passes / repetitions  
- Completion status + submit status (submitted / local_only / failed)  
- Interruptions / focus loss (examiner + system)  
- Free-text anomalies  

## Analysis (pilot only)

- Describe commission, omission, mean correct RT, provisional ICS by mode.  
- Do **not** pool Clinical + Game until mode equivalence looks acceptable.  
- Do **not** publish norms, cutoffs, or diagnostic interpretations.  
- Config changes after pilot: trial counts, practice rule, anticipatory cutoff — version-bump task config.

## Exit criteria (software → psychometrics)

Phase 7 is complete for engineering when:

1. Checklist sessions run without blocking defects.  
2. Exports match the data dictionary.  
3. Equivalence audit still passes after any pilot-driven code fixes.  

Phase 8 (psychometrics) begins only after analyzable pilot data exist.
