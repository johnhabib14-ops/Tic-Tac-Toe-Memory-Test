-- Run this in Supabase SQL editor to create the GMT 2.2 submissions table.
-- Table: gmt22_submissions (separate from gmt2_submissions).

CREATE TABLE IF NOT EXISTS gmt22_submissions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  participant_id TEXT NOT NULL DEFAULT '',
  birth_year INTEGER NOT NULL DEFAULT 0,
  gender TEXT NOT NULL DEFAULT '',
  education TEXT NOT NULL DEFAULT '',
  device_type TEXT NOT NULL DEFAULT '',
  copy_hits INTEGER NOT NULL DEFAULT 0,
  copy_total_rt_ms INTEGER NOT NULL DEFAULT 0,
  copy_target_map JSONB NOT NULL DEFAULT '[]',
  copy_response_map JSONB NOT NULL DEFAULT '[]',
  memory_trials JSONB NOT NULL DEFAULT '[]',
  mean_accuracy_per_condition JSONB NOT NULL DEFAULT '{}',
  mean_rt_per_condition JSONB NOT NULL DEFAULT '{}',
  total_commissions_per_condition JSONB NOT NULL DEFAULT '{}',
  clean_trial_rate_per_condition JSONB NOT NULL DEFAULT '{}',
  global_accuracy NUMERIC NOT NULL DEFAULT 0,
  global_mean_rt NUMERIC NOT NULL DEFAULT 0,
  global_clean_trial_rate NUMERIC NOT NULL DEFAULT 0,
  -- SPSS-friendly flat columns (one per condition)
  mean_accuracy_baseline NUMERIC NOT NULL DEFAULT 0,
  mean_accuracy_ignore_distractor NUMERIC NOT NULL DEFAULT 0,
  mean_accuracy_remember_distractor NUMERIC NOT NULL DEFAULT 0,
  mean_accuracy_delay NUMERIC NOT NULL DEFAULT 0,
  mean_rt_baseline NUMERIC NOT NULL DEFAULT 0,
  mean_rt_ignore_distractor NUMERIC NOT NULL DEFAULT 0,
  mean_rt_remember_distractor NUMERIC NOT NULL DEFAULT 0,
  mean_rt_delay NUMERIC NOT NULL DEFAULT 0,
  total_commissions_baseline INTEGER NOT NULL DEFAULT 0,
  total_commissions_ignore_distractor INTEGER NOT NULL DEFAULT 0,
  total_commissions_remember_distractor INTEGER NOT NULL DEFAULT 0,
  total_commissions_delay INTEGER NOT NULL DEFAULT 0,
  clean_trial_rate_baseline NUMERIC NOT NULL DEFAULT 0,
  clean_trial_rate_ignore_distractor NUMERIC NOT NULL DEFAULT 0,
  clean_trial_rate_remember_distractor NUMERIC NOT NULL DEFAULT 0,
  clean_trial_rate_delay NUMERIC NOT NULL DEFAULT 0,
  copy_rt_sec NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If RLS is enabled, run scripts/gmt22_submissions_rls.sql in the SQL Editor.
