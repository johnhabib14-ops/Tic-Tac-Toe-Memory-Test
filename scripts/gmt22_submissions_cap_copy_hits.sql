-- One-off backfill: cap copy_hits at 8 for any existing rows (legacy pre-fix data).
-- Copy task has at most 8 targets; older submissions could have stored 9 due to item bank/spec drift.
-- Safe to re-run (idempotent).

UPDATE gmt22_submissions
SET copy_hits = 8
WHERE copy_hits > 8;
