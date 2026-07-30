# RIT Data Dictionary / Codebook (v0.1)

Missing-value code: empty field in CSV / `null` in JSON.

Privacy classes: `public_ok` | `sensitive_optional` | `internal` | `performance`

## Session-level variables

| variable_name | label | data_type | allowable_values | scoring_role | privacy |
|---------------|-------|-----------|------------------|--------------|---------|
| session_id | Session identifier | string | `rit_*` | key | internal |
| anonymous_participant_id | Anonymous participant ID | string | anon or study code | key | public_ok |
| study_id | Study / site code | string | free text | key | internal |
| administration_mode | Administration context | string | supervised_clinical, research, public | admin | internal |
| visual_mode | Presentation theme | string | clinical, game | admin | internal |
| task_version | Task software version | string | semver | version | internal |
| scoring_version | Scoring algorithm version | string | e.g. 0.1.0-provisional | version | internal |
| study_version | Study protocol version | string | semver | version | internal |
| consent_version | Consent text version | string | semver | version | internal |
| randomization_seed | Seed for trial plan | number | uint32 | audit | internal |
| start_time | Session start (ISO) | string | ISO-8601 | timing | internal |
| completion_time | Session end (ISO) | string | ISO-8601 | timing | internal |
| total_duration_ms | Total duration | number | ≥0 | timing | performance |
| device_type | Device class | string | desktop, tablet, phone, unsupported, unknown | quality | public_ok |
| input_method | Primary input | string | keyboard, touch, mixed, unknown | quality | public_ok |
| practice_repetitions | Practice repeats used | number | ≥0 | process | performance |
| provisional_ics | Provisional Inhibitory Control Score | number | 0–100 | primary_provisional | performance |
| commission_error_rate | Commission rate (primary blocks) | number | 0–1 | secondary | performance |
| omission_error_rate | Omission rate (primary blocks) | number | 0–1 | secondary | performance |
| mean_correct_rt_ms | Mean correct go RT | number | ≥0 | secondary | performance |
| median_correct_rt_ms | Median correct go RT | number | ≥0 | secondary | performance |
| rt_sd_ms | SD of correct go RT | number | ≥0 | secondary | performance |
| rt_cv | Coefficient of variation of correct go RT | number | ≥0 | secondary | performance |
| anticipatory_count | Anticipatory response count | number | ≥0 | secondary | performance |
| post_error_slowing_ms | Post-error slowing estimate | number | any | secondary | performance |
| high_interference_accuracy | Accuracy on interference block | number | 0–1 | secondary | performance |
| high_interference_mean_rt_ms | Mean correct RT on interference | number | ≥0 | secondary | performance |
| speed_accuracy_tradeoff | Acc − normalized speed | number | any | secondary | performance |
| timing_quality | Timing quality ordinal | string | good, fair, poor, unknown | quality | internal |
| completion_status | Completion state | string | in_progress, completed, withdrawn, incomplete, locked | validity | internal |
| validity_flags | Triggered flag codes | string | pipe-delimited | validity | internal |
| data_retention_policy | Retention policy text | string | free text | privacy | internal |
| examiner_notes | Examiner notes | string | free text | clinical | sensitive_optional |

## Trial-level variables

| variable_name | label | data_type | allowable_values | scoring_role | privacy |
|---------------|-------|-----------|------------------|--------------|---------|
| session_id | Session identifier | string | `rit_*` | key | internal |
| block_id | Block identifier | string | practice, baseline, habit, standard, interference | key | performance |
| block_type | Block type | string | same as block_id | key | performance |
| trial_number | Trial index in session | number | ≥1 | key | performance |
| stimulus_id | Stimulus instance id | string | free text | raw | performance |
| stimulus_kind | Stimulus kind | string | go_a, go_b, nogo | raw | performance |
| stimulus_shape | Shape cue | string | diamond, hexagon | raw | performance |
| stimulus_color | Color token | string | signal_blue, signal_amber | raw | performance |
| has_stop_cue | Stop cue present | boolean | true/false | raw | performance |
| has_reverse_frame | Interference frame | boolean | true/false | raw | performance |
| go_or_nogo | Trial class | string | go, nogo | raw | performance |
| applicable_rule | Mapping rule | string | standard, reversed_mapping | raw | performance |
| expected_response | Expected response | string | a, b, none | raw | performance |
| actual_response | Observed response | string | a, b, none, invalid | raw | performance |
| accuracy | Trial accuracy | number | 0, 1 | raw | performance |
| reaction_time_ms | Reaction time | number | ≥0 or empty | raw | performance |
| stimulus_onset_ts | Onset timestamp | number | performance.now ms | timing | internal |
| response_timestamp | Response timestamp | number | performance.now ms or empty | timing | internal |
| interstimulus_interval_ms | ISI | number | ≥0 | timing | performance |
| anticipatory_response_flag | Anticipatory flag | boolean | true/false | derived | performance |
| omission_flag | Omission flag | boolean | true/false | derived | performance |
| commission_error_flag | Commission flag | boolean | true/false | derived | performance |
| focus_loss_flag | Focus loss near trial | boolean | true/false | quality | internal |
| timing_irregularity_flag | Frame-drop near trial | boolean | true/false | quality | internal |
| invalid_key_flag | Invalid key press | boolean | true/false | derived | performance |
| scored | Included in primary ICS | boolean | true/false | scoring | internal |

Machine-readable subset also available via `dataDictionary()` in `src/rit/lib/DataExporter.ts`.
