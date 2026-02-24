-- Run this in Supabase SQL Editor after gmt22_submissions exists.
-- Creates a view with one row per memory trial for long-format export (SPSS, R repeated-measures).
-- Export this view to CSV for trial-level analysis.

CREATE OR REPLACE VIEW gmt22_trials AS
SELECT
  s.id AS submission_id,
  s.session_id,
  s.participant_id,
  t.trial_idx,
  (t.trial->>'condition')::text AS condition,
  (t.trial->>'span')::integer AS span,
  (t.trial->>'hits')::integer AS hits,
  (t.trial->>'commissions')::integer AS commissions,
  (t.trial->>'accuracy_raw')::numeric AS accuracy_raw,
  (t.trial->>'recon_rt_ms')::numeric AS recon_rt_ms,
  (t.trial->>'timeout')::boolean AS timeout,
  (t.trial->>'clean_trial')::boolean AS clean_trial
FROM gmt22_submissions s,
     jsonb_array_elements(s.memory_trials) WITH ORDINALITY AS t(trial, trial_idx);

-- Usage: In Supabase Table Editor, open "gmt22_trials" (view) and export to CSV.
-- Columns: submission_id, session_id, participant_id, trial_idx, condition, span, hits, commissions, accuracy_raw, recon_rt_ms, timeout, clean_trial
