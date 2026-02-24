-- Run this in Supabase SQL editor to create the GMT 2.1 submissions table.
-- Table: gmt2_submissions (do not mix with existing submissions table).

CREATE TABLE IF NOT EXISTS gmt2_submissions (
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
  global_accuracy NUMERIC NOT NULL DEFAULT 0,
  global_mean_rt NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If the table already exists, add the column with:
-- ALTER TABLE gmt2_submissions ADD COLUMN IF NOT EXISTS participant_id TEXT NOT NULL DEFAULT '';

-- If RLS is enabled and you get "new row violates row-level security policy", run scripts/gmt2_submissions_rls.sql in the SQL Editor.
