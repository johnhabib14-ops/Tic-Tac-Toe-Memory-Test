# RIT data export for SPSS and research use (v0.2)

RIT sessions can be stored in Supabase table `rit_submissions` (wide) with a long-format view `rit_trials`. Local CSV/JSON export from the app remains available when no API is configured.

## One-time setup

Run in the **Supabase SQL Editor** (in order):

1. `scripts/rit_submissions_table.sql`
2. `scripts/rit_submissions_rls.sql`
3. `scripts/rit_trials_view.sql`

Environment (Vercel / local Netlify-style):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- Client: `VITE_API_URL` pointing at the deployment origin that serves `/api/rit-submit`

## Submit path

1. On completion, the client always writes to `localStorage` (`rit_session_archive_v1`).
2. Then `POST /api/rit-submit` with `{ session, trials, demographics }`.
3. Duplicate `session_id` → HTTP 409 (treated as already saved).
4. If `VITE_API_URL` is unset, submit is skipped (`local_only`).

## Wide format: one row per session

**Source:** `rit_submissions`  
**Export:** Supabase Table Editor → Export CSV

Key columns (SPSS-friendly snake_case):

| Column | Description |
|--------|-------------|
| session_id | Unique session key |
| anonymous_participant_id | Anonymous / study participant code |
| study_id | Study / site code |
| administration_mode | supervised_clinical, research, public |
| visual_mode | clinical, game |
| task_version | `0.2.0` or `0.2.0-pilot` |
| scoring_version | Provisional scoring version |
| randomization_seed | Seed for audit / replay |
| provisional_ics | Provisional Inhibitory Control Score |
| commission_error_rate / omission_error_rate | Secondary rates |
| mean_correct_rt_ms / median_correct_rt_ms / rt_sd_ms / rt_cv | RT metrics |
| accuracy_* / mean_rt_* | Per-block summaries |
| validity_flags | Pipe-delimited triggered codes |
| flag_* | Boolean columns for each validity code |
| trials | JSONB full trial array |
| demographics | JSONB optional background |

See also `docs/RIT_DATA_DICTIONARY.md`.

## Long format: one row per trial

**Source:** view `rit_trials`  
**Export:** Supabase → `rit_trials` → CSV

Columns include `block_type`, `go_or_nogo`, `expected_response`, `actual_response`, `accuracy`, `reaction_time_ms`, commission/omission/anticipatory flags, and timing quality flags.

## Local export (no Supabase)

From Clinical Results or Research Dashboard:

- Session CSV / Trials CSV / JSON
- Data dictionary JSON via exporter

## Version filters

Pilot sessions use `task_version = 0.2.0-pilot`. Full protocol uses `0.2.0`. Filter before pooling.

## Privacy

Public mode does not collect names, addresses, or dates of birth. Do not claim HIPAA compliance unless deployment policies and BAAs support it.
