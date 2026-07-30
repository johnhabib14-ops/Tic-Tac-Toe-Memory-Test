# Response Inhibition Task — Architecture (pointer)

**Status:** Phases 0–6 implemented in `src/rit/` (experimental). Phase 7 materials + Phase 8 psychometrics plan in `docs/`.

Design-review document:

→ **[docs/RIT_IMPLEMENTATION_PLAN.md](../../docs/RIT_IMPLEMENTATION_PLAN.md)**

Provisional §26 answers: **[docs/RIT_PROVISIONAL_DECISIONS.md](../../docs/RIT_PROVISIONAL_DECISIONS.md)**  
Pilot materials: **[docs/RIT_PHASE7_PILOT.md](../../docs/RIT_PHASE7_PILOT.md)**  
Psychometrics plan: **[docs/RIT_PHASE8_PSYCHOMETRICS.md](../../docs/RIT_PHASE8_PSYCHOMETRICS.md)**  
Development report: **[docs/RIT_DEVELOPMENT_REPORT.md](../../docs/RIT_DEVELOPMENT_REPORT.md)**

### Module layout

```
src/rit/
  config/          # trial counts, timings, scoring weights, validity, copy
  lib/             # pure engines + InputManager (no React UI)
  components/      # StimulusRenderer, TrialRunner, ThemeShell
  pages/           # phase screens (incl. eligibility, debrief)
  RITShell.tsx     # phase switcher
  RITState.tsx     # session context
  types.ts
```

Weights, thresholds, and trial counts remain provisional until pilot/psychometric evidence supports locking them. No diagnostic or norm claims.
