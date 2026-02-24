-- Run in Supabase SQL Editor AFTER gmt22_submissions exists.
-- Adds columns for GMT2 refinement addendum: condition_order, practice flags, span_consistency_flag per condition.
-- Safe to re-run: uses ADD COLUMN IF NOT EXISTS.

ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS condition_order TEXT NOT NULL DEFAULT '';
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS practice_failed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS practice_passed_first_try BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS span_consistency_flag_baseline BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS span_consistency_flag_ignore_distractor BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS span_consistency_flag_remember_distractor BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS span_consistency_flag_delay BOOLEAN NOT NULL DEFAULT false;
