# CFT Data Dictionary (summary)

Full export dictionary is available from the Clinical Results / Research Dashboard **Data dictionary** button (`src/cft/lib/DataExporter.ts`).

## Session-level (selected)

| Variable | Role |
|----------|------|
| `session_id` | Key |
| `provisional_cfs` | Primary provisional score 0–100 |
| `switch_accuracy` | Switch-trial accuracy |
| `stay_accuracy` | Stay-trial accuracy |
| `switch_cost_rt_ms` | RT switch cost |
| `switch_cost_accuracy` | Accuracy switch cost |
| `perseverative_error_rate` | Perseveration rate |
| `rule_maintenance_error_rate` | Stay-trial error rate (typed) |
| `cue_processing_error_rate` | Wrong-rule cue errors |
| `conflict_accuracy` | Incongruent-trial accuracy |
| `validity_flags` | Pipe-delimited triggered flags |

## Trial-level (selected)

| Variable | Role |
|----------|------|
| `rule` / `previous_rule` / `is_switch` | Set-shift structure |
| `congruency` | congruent \| incongruent |
| `shape` / `pattern` / `number` | Stimulus features |
| `error_type` | Taxonomy code |
| `accuracy` / `reaction_time_ms` | Performance |

## Storage

- Local archive key: `cft_session_archive_v1`
- API: `POST /api/cft-submit` → `cft_submissions`
- SQL: `scripts/cft_submissions_table.sql`, `cft_trials_view.sql`, `cft_submissions_rls.sql`
