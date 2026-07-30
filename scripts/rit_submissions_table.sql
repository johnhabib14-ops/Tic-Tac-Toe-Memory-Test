-- Run in Supabase SQL Editor to create the RIT submissions table (v0.2).
-- Separate from gmt22_submissions. No PHI columns; public mode stays anonymous.

CREATE TABLE IF NOT EXISTS rit_submissions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  anonymous_participant_id TEXT NOT NULL DEFAULT '',
  study_id TEXT NOT NULL DEFAULT '',
  administration_mode TEXT NOT NULL DEFAULT '',
  visual_mode TEXT NOT NULL DEFAULT '',
  task_version TEXT NOT NULL DEFAULT '',
  scoring_version TEXT NOT NULL DEFAULT '',
  study_version TEXT NOT NULL DEFAULT '',
  consent_version TEXT NOT NULL DEFAULT '',
  randomization_seed BIGINT NOT NULL DEFAULT 0,
  start_time TIMESTAMPTZ NULL,
  completion_time TIMESTAMPTZ NULL,
  total_duration_ms BIGINT NULL,
  device_type TEXT NOT NULL DEFAULT '',
  input_method TEXT NOT NULL DEFAULT '',
  practice_repetitions INTEGER NOT NULL DEFAULT 0,
  timing_quality TEXT NOT NULL DEFAULT '',
  completion_status TEXT NOT NULL DEFAULT '',
  provisional_ics NUMERIC NULL,
  commission_error_rate NUMERIC NULL,
  omission_error_rate NUMERIC NULL,
  mean_correct_rt_ms NUMERIC NULL,
  median_correct_rt_ms NUMERIC NULL,
  rt_sd_ms NUMERIC NULL,
  rt_cv NUMERIC NULL,
  anticipatory_count INTEGER NOT NULL DEFAULT 0,
  post_error_slowing_ms NUMERIC NULL,
  high_interference_accuracy NUMERIC NULL,
  high_interference_mean_rt_ms NUMERIC NULL,
  speed_accuracy_tradeoff NUMERIC NULL,
  -- Block summaries (flat)
  accuracy_practice NUMERIC NULL,
  mean_rt_practice NUMERIC NULL,
  accuracy_baseline NUMERIC NULL,
  mean_rt_baseline NUMERIC NULL,
  accuracy_habit NUMERIC NULL,
  mean_rt_habit NUMERIC NULL,
  accuracy_standard NUMERIC NULL,
  mean_rt_standard NUMERIC NULL,
  accuracy_interference NUMERIC NULL,
  mean_rt_interference NUMERIC NULL,
  -- Validity
  validity_flags TEXT NOT NULL DEFAULT '',
  flag_excessive_omissions BOOLEAN NOT NULL DEFAULT false,
  flag_chance_accuracy BOOLEAN NOT NULL DEFAULT false,
  flag_extremely_rapid BOOLEAN NOT NULL DEFAULT false,
  flag_repeated_anticipatory BOOLEAN NOT NULL DEFAULT false,
  flag_excessive_focus_loss BOOLEAN NOT NULL DEFAULT false,
  flag_incomplete_session BOOLEAN NOT NULL DEFAULT false,
  flag_abnormal_timing BOOLEAN NOT NULL DEFAULT false,
  flag_unsupported_device BOOLEAN NOT NULL DEFAULT false,
  flag_repeated_response_pattern BOOLEAN NOT NULL DEFAULT false,
  flag_practice_failed BOOLEAN NOT NULL DEFAULT false,
  flag_rule_not_understood BOOLEAN NOT NULL DEFAULT false,
  -- Payloads
  trials JSONB NOT NULL DEFAULT '[]',
  demographics JSONB NOT NULL DEFAULT '{}',
  examiner_notes TEXT NULL,
  data_retention_policy TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rit_submissions_study_id_idx ON rit_submissions (study_id);
CREATE INDEX IF NOT EXISTS rit_submissions_task_version_idx ON rit_submissions (task_version);
CREATE INDEX IF NOT EXISTS rit_submissions_visual_mode_idx ON rit_submissions (visual_mode);

-- Enable RLS after create; then run rit_submissions_rls.sql
ALTER TABLE rit_submissions ENABLE ROW LEVEL SECURITY;
