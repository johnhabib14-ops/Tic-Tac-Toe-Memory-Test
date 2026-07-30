# Response Inhibition Task — Development Report

**Product:** Response Inhibition Task (RIT) / Signal Gate  
**Attribution:** By Habib Labs LLC  
**Task version:** 0.2.0 (full) / 0.2.0-pilot  
**Scoring version:** 0.1.0-provisional  
**Status:** Experimental research instrument under development — not diagnostic, clinically validated, or normed.

## Phase status (roadmap)

| Phase | Status |
|-------|--------|
| 0 Design review | Done — `docs/RIT_IMPLEMENTATION_PLAN.md` |
| 1 Shared engine | Done — config + pure `lib/` engines + `InputManager` |
| 2 Clinical UI | Done |
| 3 Game UI | Done — theme/copy/CSS on same engine |
| 4 Admin contexts | Done — clinical / research / public + eligibility + debrief |
| 5 Persistence & export | Done — local archive + optional Supabase |
| 6 Tests & audit | Done — Vitest + `npm run audit:rit` |
| 7 Supervised pilot | Materials ready — `docs/RIT_PHASE7_PILOT.md` (human data TBD) |
| 8 Psychometrics | Plan only — `docs/RIT_PHASE8_PSYCHOMETRICS.md` (no norms shipped) |

Provisional answers to open design questions: `docs/RIT_PROVISIONAL_DECISIONS.md`.

## v0.2.1 gap-fill (all phases implementable)

### Added / closed
- `InputManager.ts` — keyboard/touch capture used by `TrialRunner`
- Optional practice beeps (`practiceSound.ts`) when sound is not off
- Research **eligibility** and **debrief** phases
- Demographics `ageBand`; ExperimentalBanner on key screens
- Research dashboard: visual-mode + block-level breakdowns
- Stronger Game Mode chrome CSS
- Simulated profile `failed_practice`; TimingMonitor `classifyTimingQuality` tests
- Phase 7 / 8 docs + provisional §26 decisions

## v0.2 changes (Pilot Persistence and Equivalence)

### Added
- `api/rit-submit.js` — Vercel serverless insert into Supabase `rit_submissions` (409 on duplicate `session_id`)
- `scripts/rit_submissions_table.sql`, `rit_submissions_rls.sql`, `rit_trials_view.sql`
- `src/rit/lib/submissionPayload.ts` — shared flatten → DB row shape
- Local archive submit status (`submitted` / `local_only` / `failed`) + Completion / Clinical status UX
- Pilot protocol profile (`PILOT_TASK_CONFIG`, intake toggle, `?profile=pilot`)
- `scripts/audit_rit_equivalence.ts` + `npm run audit:rit`
- `docs/RIT_DATA_EXPORT.md`, `docs/RIT_PILOT_CHECKLIST.md`

### Behavior
- Completion always archives to `localStorage` first, then attempts server submit
- Task version stamped `0.2.0` or `0.2.0-pilot` on session records

---

## Files created (v0.1+)

### Module core
- `src/rit/types.ts`
- `src/rit/RITShell.tsx`
- `src/rit/RITState.tsx`
- `src/rit/docs/ARCHITECTURE.md`

### Config
- `src/rit/config/taskConfig.ts`
- `src/rit/config/scoringWeights.ts`
- `src/rit/config/validityThresholds.ts`
- `src/rit/config/instructions.ts`

### Engines (`src/rit/lib/`)
- `TrialGenerator.ts` — seeded plans, spaced no-go placement, run constraints
- `responseClassification.ts` — commission / omission / anticipatory / RT
- `ScoringEngine.ts` — provisional ICS + secondary process scores
- `ValidityEngine.ts` — neutral validity flags
- `TimingMonitor.ts` — focus / visibility / frame-drop hints
- `deviceCheck.ts` — device support + anonymous / session IDs
- `DataExporter.ts` — CSV / JSON / data dictionary
- `SessionReplay.ts` — seed + response reconstruction
- `simulateProfiles.ts` — ten simulated participant profiles (incl. `failed_practice`)
- `InputManager.ts`, `practiceSound.ts`
- `blockMeta.ts`, `sessionArchive.ts`, `submitRit.ts`, `submissionPayload.ts`
- `rit.engine.test.ts` — Vitest suite

### UI
- `src/rit/components/StimulusRenderer.tsx`
- `src/rit/components/TrialRunner.tsx`
- `src/rit/components/ThemeShell.tsx`
- `src/rit/pages/ModeSelect.tsx`, `AdminSetup.tsx`, `ResearchIntake.tsx`, `PublicIntake.tsx`
- `src/rit/pages/Consent.tsx`, `Eligibility.tsx`, `Demographics.tsx`, `DeviceCheck.tsx`, `Orientation.tsx`
- `src/rit/pages/BlockRun.tsx`, `Completion.tsx`, `Debrief.tsx`, `ClinicalResults.tsx`
- `src/rit/pages/ResearchDashboard.tsx`, `SessionReplayPage.tsx`, `Locked.tsx`

### Docs / tooling
- `docs/RIT_SCORING.md`
- `docs/RIT_DEVELOPMENT_REPORT.md` (this file)
- `docs/RIT_DATA_DICTIONARY.md`
- `docs/RIT_DATA_EXPORT.md`, `docs/RIT_PILOT_CHECKLIST.md`
- `docs/RIT_PHASE7_PILOT.md`, `docs/RIT_PHASE8_PSYCHOMETRICS.md`, `docs/RIT_PROVISIONAL_DECISIONS.md`
- `docs/RIT_IMPLEMENTATION_PLAN.md`
- `vitest.config.ts`

## Files modified

- `src/App.tsx` — `/rit` route
- `src/pages/Landing.tsx` — battery hub + Habib Labs branding
- `src/index.css` — RIT theme / layout / a11y styles
- `package.json` — `test` / `test:watch` scripts; vitest dependency
- `tsconfig.json`, `tsconfig.app.json` — exclude `*.test.ts` from app build

## Architecture used

One shared task engine + two presentation themes (Clinical / Game), mirroring the GMT 2.2 shell/state/pages pattern.

- Cognitive parameters (trials, timing, scoring, validity) live only in config + pure `lib/` engines.
- Visual mode switches theme classes and instructional copy via `getInstructions(mode)`.
- Persistence v0.1: in-memory session + `localStorage` archive + CSV/JSON export; `submitRit` stubs future API.

## Task flow

```
mode_select → admin_setup | research_intake | public_intake
  → consent → [eligibility if research] → demographics → device_check → orientation
  → practice → baseline → habit → standard → interference
  → completion → [debrief if research] → clinical_results | research_dashboard | locked
```

Adaptive block is configured but disabled.

### Stimulus system (Signal Gate)

| Cue | Features | Response |
|-----|----------|----------|
| Go-A | Blue diamond + vertical texture | F / Left |
| Go-B | Amber hexagon + hatch | J / Right |
| No-Go | Stop ring + slash | Withhold |
| Interference | Double frame | Reversed A/B mapping; no-go still withhold |

## Scoring implementation

Provisional Inhibitory Control Score (0–100) from editable weights in `scoringWeights.ts`. Practice and baseline excluded. Components reported separately. No percentiles or diagnostic labels. Full formulas in `docs/RIT_SCORING.md`.

## Data fields

Session and trial schemas are defined in `src/rit/types.ts`. Export uses SPSS-friendly snake_case names. See `docs/RIT_DATA_DICTIONARY.md`.

## Accessibility features

- Keyboard + touch controls
- High-contrast, reduced-motion, sound-off, larger text prefs
- Non-color-only cues (shape + texture + stop ring)
- Focus-visible styles
- Unsupported viewport flagged (not silently treated as valid)
- Active trials remain predominantly nonverbal

## Privacy protections

- Public mode: anonymous ID; no name/address/DOB
- Sensitive history optional and skipped in public intake
- Recontact permission separated from performance data
- Consent / task / scoring / study versions stored
- Withdraw-before-submit path
- No HIPAA compliance claims

## Tests completed

`npm test` — 16 passing Vitest cases covering:

- Seeded randomization reproducibility
- Go/no-go ratios
- Within-block run limits
- Response classification (commission, omission, anticipatory, RT)
- Provisional score calculations
- Clinical/Game score equivalence under same seed + responses
- Validity flags (omissions, device, focus loss, incomplete, timing)
- Export completeness
- All nine simulated profiles

`npm run build` — TypeScript + Vite production build succeeds.

## Unresolved psychometric decisions

- Final trial counts and go ratios after piloting
- Empirically estimated ICS weights
- Anticipatory RT cutoff (150 ms placeholder)
- Practice pass threshold and discontinue policy
- Normative sampling and age covariates
- Whether a future stop-signal / SSRT module is required
- Deployment-specific IRB consent and retention text
- Browser timing precision limits (quality flag only in v0.1)

## Recommended next research steps

1. Small supervised pilot (n≈20–40) in both visual modes; confirm mode-equivalence of raw metrics.
2. Audit go/no-go ratios and interference effect sizes; adjust config without code changes.
3. Collect enough data to estimate provisional weights via transparent regression / factor structure — still label experimental.
4. Add Supabase `rit_submissions` + long `rit_trials` view when multi-site collection starts.
5. IRB review of public consent and retention language per site.
6. Consider SSRT / stop-signal as a separate battery module later.
7. Expand automated browser timing probes (refresh-rate estimation) once hardware access is standardized.

## Low-fidelity wireframe notes

**Clinical:** neutral gray page → short rule → center stimulus → touch bar; examiner chrome only pre/post.  
**Game (Signal Gate):** same geometry/timing; console framing + restrained `n/N` progress; practice-only feedback.
