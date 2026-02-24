-- Run this in Supabase SQL Editor AFTER gmt22_submissions exists.
-- Adds flattened scalar columns for SPSS/research-friendly CSV export (one column per variable, no JSON).
-- Run once. Safe to re-run: uses ADD COLUMN IF NOT EXISTS.

-- Mean accuracy per condition (0–1)
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS mean_accuracy_baseline NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS mean_accuracy_ignore_distractor NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS mean_accuracy_remember_distractor NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS mean_accuracy_delay NUMERIC NOT NULL DEFAULT 0;

-- Mean RT per condition (ms)
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS mean_rt_baseline NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS mean_rt_ignore_distractor NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS mean_rt_remember_distractor NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS mean_rt_delay NUMERIC NOT NULL DEFAULT 0;

-- Total commissions per condition
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS total_commissions_baseline INTEGER NOT NULL DEFAULT 0;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS total_commissions_ignore_distractor INTEGER NOT NULL DEFAULT 0;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS total_commissions_remember_distractor INTEGER NOT NULL DEFAULT 0;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS total_commissions_delay INTEGER NOT NULL DEFAULT 0;

-- Clean trial rate per condition (0–1)
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS clean_trial_rate_baseline NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS clean_trial_rate_ignore_distractor NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS clean_trial_rate_remember_distractor NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS clean_trial_rate_delay NUMERIC NOT NULL DEFAULT 0;

-- Copy task time in seconds (for SPSS convenience)
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS copy_rt_sec NUMERIC NOT NULL DEFAULT 0;

-- Backfill existing rows from JSONB columns
UPDATE gmt22_submissions
SET
  mean_accuracy_baseline = COALESCE((mean_accuracy_per_condition->>'baseline')::numeric, 0),
  mean_accuracy_ignore_distractor = COALESCE((mean_accuracy_per_condition->>'ignore_distractor')::numeric, 0),
  mean_accuracy_remember_distractor = COALESCE((mean_accuracy_per_condition->>'remember_distractor')::numeric, 0),
  mean_accuracy_delay = COALESCE((mean_accuracy_per_condition->>'delay')::numeric, 0),
  mean_rt_baseline = COALESCE((mean_rt_per_condition->>'baseline')::numeric, 0),
  mean_rt_ignore_distractor = COALESCE((mean_rt_per_condition->>'ignore_distractor')::numeric, 0),
  mean_rt_remember_distractor = COALESCE((mean_rt_per_condition->>'remember_distractor')::numeric, 0),
  mean_rt_delay = COALESCE((mean_rt_per_condition->>'delay')::numeric, 0),
  total_commissions_baseline = COALESCE((total_commissions_per_condition->>'baseline')::integer, 0),
  total_commissions_ignore_distractor = COALESCE((total_commissions_per_condition->>'ignore_distractor')::integer, 0),
  total_commissions_remember_distractor = COALESCE((total_commissions_per_condition->>'remember_distractor')::integer, 0),
  total_commissions_delay = COALESCE((total_commissions_per_condition->>'delay')::integer, 0),
  clean_trial_rate_baseline = COALESCE((clean_trial_rate_per_condition->>'baseline')::numeric, 0),
  clean_trial_rate_ignore_distractor = COALESCE((clean_trial_rate_per_condition->>'ignore_distractor')::numeric, 0),
  clean_trial_rate_remember_distractor = COALESCE((clean_trial_rate_per_condition->>'remember_distractor')::numeric, 0),
  clean_trial_rate_delay = COALESCE((clean_trial_rate_per_condition->>'delay')::numeric, 0),
  copy_rt_sec = CASE WHEN copy_total_rt_ms > 0 THEN copy_total_rt_ms / 1000.0 ELSE 0 END;
