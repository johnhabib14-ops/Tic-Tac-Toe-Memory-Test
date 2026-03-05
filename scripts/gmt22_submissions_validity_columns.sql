-- Run in Supabase SQL Editor. Adds columns for validity/reliability addendum.
-- Safe to re-run: uses ADD COLUMN IF NOT EXISTS.

ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS copy_item_id TEXT NOT NULL DEFAULT '';
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS attention_check_failed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS pairing_fallback_used BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE gmt22_submissions ADD COLUMN IF NOT EXISTS memory_early_stopped BOOLEAN NOT NULL DEFAULT false;
