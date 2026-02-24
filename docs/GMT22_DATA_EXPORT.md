# GMT 2.2 data export for SPSS and research use

GMT 2.2 stores submissions in the Supabase table `gmt22_submissions`. This guide describes how to export data in a form that works directly in SPSS and other research tools (no JSON parsing).

## One-time setup: flattened columns and trials view

Before exporting, run these SQL scripts once in the **Supabase SQL Editor** (in order):

1. **Table and RLS** (if not already done):  
   `scripts/gmt22_submissions_table.sql` then `scripts/gmt22_submissions_rls.sql`

2. **SPSS-friendly flat columns** (adds one column per variable):  
   `scripts/gmt22_submissions_add_flat_columns.sql`

3. **Trial-level view** (one row per memory trial):  
   `scripts/gmt22_trials_view.sql`

After that, all new submissions will have the flat columns filled automatically. Existing rows get backfilled by the add-flat-columns script.

**Troubleshooting:** If you get a 502 error when submitting (e.g. "Could not find the 'clean_trial_rate_baseline' column"), the table is missing the flat columns. Run `scripts/gmt22_submissions_add_flat_columns.sql` in the Supabase SQL Editor.

---

## Wide format: one row per participant

**Source:** Table `gmt22_submissions`  
**Export:** Supabase Table Editor → select `gmt22_submissions` → Export as CSV (or use the API).

Use this for participant-level analyses (e.g. demographics, overall accuracy, condition means).

### Column list (SPSS-friendly; all numeric except where noted)

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Submission ID |
| `session_id` | text | Session identifier |
| `participant_id` | text | Participant ID |
| `birth_year` | integer | Birth year |
| `age` | integer | Age (current year minus birth year) |
| `gender` | text | Gender |
| `education` | text | Education (years) |
| `device_type` | text | Device used |
| `copy_hits` | integer | Copy task: correct placements (out of 8) |
| `copy_total_rt_ms` | integer | Copy task: total time (ms) |
| `copy_rt_sec` | numeric | Copy task: time in seconds |
| `global_accuracy` | numeric | Overall memory accuracy (0–1) |
| `global_mean_rt` | numeric | Overall mean reconstruction RT (ms) |
| `global_clean_trial_rate` | numeric | Overall proportion of trials with zero commissions (0–1) |
| `mean_accuracy_baseline` | numeric | Baseline condition mean accuracy (0–1) |
| `mean_accuracy_ignore_distractor` | numeric | Ignore-distractor condition mean accuracy (0–1) |
| `mean_accuracy_remember_distractor` | numeric | Remember-distractor condition mean accuracy (0–1) |
| `mean_accuracy_delay` | numeric | Delay condition mean accuracy (0–1) |
| `mean_rt_baseline` | numeric | Baseline mean reconstruction RT (ms) |
| `mean_rt_ignore_distractor` | numeric | Ignore-distractor mean RT (ms) |
| `mean_rt_remember_distractor` | numeric | Remember-distractor mean RT (ms) |
| `mean_rt_delay` | numeric | Delay mean RT (ms) |
| `total_commissions_baseline` | integer | Baseline total commissions |
| `total_commissions_ignore_distractor` | integer | Ignore-distractor total commissions |
| `total_commissions_remember_distractor` | integer | Remember-distractor total commissions |
| `total_commissions_delay` | integer | Delay total commissions |
| `clean_trial_rate_baseline` | numeric | Baseline clean-trial rate (0–1) |
| `clean_trial_rate_ignore_distractor` | numeric | Ignore-distractor clean-trial rate (0–1) |
| `clean_trial_rate_remember_distractor` | numeric | Remember-distractor clean-trial rate (0–1) |
| `clean_trial_rate_delay` | numeric | Delay clean-trial rate (0–1) |
| `created_at` | timestamp | Submission time |

The table also has JSONB columns (`memory_trials`, `copy_target_map`, `copy_response_map`, and per-condition JSONB summaries) for raw/archival data. For SPSS you can ignore those and use the flat columns above.

---

## Long format: one row per memory trial

**Source:** View `gmt22_trials`  
**Export:** Supabase Table Editor → open the view `gmt22_trials` → Export as CSV.

Use this for repeated-measures or trial-level analyses (e.g. condition × span, trial-level RT).

### Column list

| Column | Type | Description |
|--------|------|-------------|
| `submission_id` | integer | Links to `gmt22_submissions.id` |
| `session_id` | text | Session identifier |
| `participant_id` | text | Participant ID |
| `trial_idx` | integer | Trial index within session (1-based) |
| `condition` | text | baseline, ignore_distractor, remember_distractor, delay |
| `span` | integer | Span size (2–6 or 7 if overload enabled) |
| `hits` | integer | Correct placements this trial |
| `commissions` | integer | Extra/wrong placements this trial |
| `accuracy_raw` | numeric | hits / total_targets for this trial (0–1) |
| `recon_rt_ms` | numeric | Reconstruction time (ms) |
| `timeout` | boolean | Trial ended by time limit |
| `clean_trial` | boolean | commissions == 0 |

Target and response grids are not in the view; they remain in `gmt22_submissions.memory_trials` (JSONB) if you need them.

---

## Notes

- All numeric columns are stored as numbers in the database; a CSV export will have numeric values, not JSON strings.
- For percentage display in SPSS (e.g. 0.85 → 85%), multiply the 0–1 accuracy and clean_trial_rate columns by 100 or use a COMPUTE or display format.
- Condition order in the task: baseline → ignore_distractor → remember_distractor → delay; spans are 2, 3, 4, 5, 6 (and 7 if overload is enabled).
