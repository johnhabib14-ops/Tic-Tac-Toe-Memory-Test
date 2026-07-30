# CFT Architecture

Phase-driven React module under `src/cft/`.

- **Shell:** `CFTShell.tsx` routes phases
- **State:** `CFTState.tsx` holds plan, trials, intake, validity inputs
- **Plan:** `lib/TrialGenerator.ts` (seeded; clinical/game identical)
- **Runner:** `components/TrialRunner.tsx` + `CueBanner` + `StimulusRenderer`
- **Classify:** `lib/responseClassification.ts` (error taxonomy)
- **Score:** `lib/ScoringEngine.ts` → provisional CFS
- **Submit:** `lib/submitCft.ts` → `/api/cft-submit` + local archive

Themes change copy only. Scoring parameters live in `config/`.
