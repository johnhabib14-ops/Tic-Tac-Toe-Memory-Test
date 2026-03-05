-- Run in Supabase SQL Editor if you get 502 "Could not save results" on submit.
-- Adds any columns the API expects that may be missing from older schemas.
-- Safe to re-run: uses ADD COLUMN IF NOT EXISTS.
--
-- If you still get 502 after this, run (in order):
-- 1. gmt22_submissions_table.sql (creates table)
-- 2. gmt22_submissions_add_flat_columns.sql
-- 3. gmt22_submissions_span_summary_columns.sql
-- 4. gmt22_submissions_refinement_columns.sql
-- 5. gmt22_submissions_validity_columns.sql
-- 6. This file (gmt22_submissions_fix_missing_columns.sql)
-- 7. gmt22_submissions_rls.sql (if RLS is enabled)

ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS memory_early_stopped BOOLEAN NOT NULL DEFAULT false;
