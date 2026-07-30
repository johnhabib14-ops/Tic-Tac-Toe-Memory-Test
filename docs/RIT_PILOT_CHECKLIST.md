# RIT supervised pilot checklist (v0.2)

Experimental instrument — not diagnostic or normed. **By Habib Labs LLC.**

## Before the session

1. Run SQL setup once per Supabase project (`rit_submissions_table.sql` → RLS → `rit_trials` view). See `docs/RIT_DATA_EXPORT.md`.
2. Confirm `VITE_API_URL` and Supabase env vars on the deploy, or plan local-only export.
3. Choose protocol profile:
   - **Pilot** (`0.2.0-pilot`): shorter blocks — intake toggle or `/rit?profile=pilot`
   - **Full** (`0.2.0`): default complete battery lengths
4. Assign visual mode **before** start; counterbalance across participants (≈half Clinical, ≈half Game).
5. **Never change visual mode mid-session.**
6. Record randomization seed from examiner setup (for audit / replay).

## During administration

1. Device check: unsupported screens are flagged, not silently accepted.
2. Practice must pass (or reach max repeats) before scored blocks.
3. No outcome feedback during scored trials (Game Mode included).
4. Note focus loss / interruptions in examiner notes (clinical).

## After completion

1. Confirm Completion screen save status: submitted / local_only / failed.
2. Clinical: review provisional ICS + components + validity flags; lock session.
3. Research: run debrief; confirm row in Research Dashboard local archive and/or Supabase.
4. Export wide + long CSV if needed for immediate analysis.

## Study design materials

See [`RIT_PHASE7_PILOT.md`](./RIT_PHASE7_PILOT.md) for counterbalance, examiner log fields, and exit criteria. Psychometrics plan (no norms yet): [`RIT_PHASE8_PSYCHOMETRICS.md`](./RIT_PHASE8_PSYCHOMETRICS.md).

## Mode equivalence

Clinical and Game share the same seeded plan and scoring. Run `npm run audit:rit` after code changes. For human pilots, compare commission/omission/RT distributions across modes — do not pool until equivalence looks acceptable.

## Do not

- Interpret provisional ICS as a clinical score or percentile
- Mix visual modes mid-participant
- Enable adaptive block until audited
- Collect direct identifiers in public mode
