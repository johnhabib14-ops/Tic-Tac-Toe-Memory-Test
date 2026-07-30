-- Run in Supabase SQL Editor after rit_submissions exists.
-- Long-format trial export for SPSS / R (one row per trial).
-- Assumes trials JSONB stores TrialRecord objects (camelCase keys from the client).

CREATE OR REPLACE VIEW rit_trials AS
SELECT
  s.id AS submission_id,
  s.session_id,
  s.anonymous_participant_id,
  s.study_id,
  s.visual_mode,
  s.task_version,
  s.scoring_version,
  t.trial_idx,
  (t.trial->>'blockId')::text AS block_id,
  (t.trial->>'blockType')::text AS block_type,
  (t.trial->>'trialNumber')::integer AS trial_number,
  (t.trial->>'stimulusId')::text AS stimulus_id,
  (t.trial->'stimulusProperties'->>'kind')::text AS stimulus_kind,
  (t.trial->'stimulusProperties'->>'shape')::text AS stimulus_shape,
  (t.trial->'stimulusProperties'->>'colorToken')::text AS stimulus_color,
  (t.trial->'stimulusProperties'->>'hasStopCue')::boolean AS has_stop_cue,
  (t.trial->'stimulusProperties'->>'hasReverseFrame')::boolean AS has_reverse_frame,
  (t.trial->>'goNoGo')::text AS go_or_nogo,
  (t.trial->>'applicableRule')::text AS applicable_rule,
  (t.trial->>'expectedResponse')::text AS expected_response,
  (t.trial->>'actualResponse')::text AS actual_response,
  (t.trial->>'accuracy')::integer AS accuracy,
  (t.trial->>'reactionTimeMs')::numeric AS reaction_time_ms,
  (t.trial->>'stimulusOnsetTs')::numeric AS stimulus_onset_ts,
  (t.trial->>'responseTimestamp')::numeric AS response_timestamp,
  (t.trial->>'interstimulusIntervalMs')::numeric AS interstimulus_interval_ms,
  COALESCE((t.trial->>'anticipatoryResponseFlag')::boolean, false) AS anticipatory_response_flag,
  COALESCE((t.trial->>'omissionFlag')::boolean, false) AS omission_flag,
  COALESCE((t.trial->>'commissionErrorFlag')::boolean, false) AS commission_error_flag,
  COALESCE((t.trial->>'focusLossFlag')::boolean, false) AS focus_loss_flag,
  COALESCE((t.trial->>'timingIrregularityFlag')::boolean, false) AS timing_irregularity_flag,
  COALESCE((t.trial->>'invalidKeyFlag')::boolean, false) AS invalid_key_flag,
  COALESCE((t.trial->>'scored')::boolean, false) AS scored
FROM rit_submissions s,
     jsonb_array_elements(s.trials) WITH ORDINALITY AS t(trial, trial_idx);

-- Usage: Supabase Table Editor → rit_trials → Export CSV
