-- Research schema: de-identified behavioral data only. No PHI, no patient/clinician FKs.
-- Run after platform_schema.sql. Expose schema "research" in API settings.

CREATE SCHEMA IF NOT EXISTS research;

CREATE TABLE IF NOT EXISTS research.administrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_mode TEXT NOT NULL DEFAULT '',
  task TEXT NOT NULL DEFAULT '',
  session_id TEXT NOT NULL UNIQUE,
  anonymous_participant_id TEXT NOT NULL DEFAULT '',
  study_code TEXT NOT NULL DEFAULT '',
  battery_session_id TEXT NOT NULL DEFAULT '',
  task_version TEXT NOT NULL DEFAULT '',
  scoring_version TEXT NOT NULL DEFAULT '',
  consent_version TEXT NOT NULL DEFAULT '',
  demographic_bins JSONB NOT NULL DEFAULT '{}',
  device JSONB NOT NULL DEFAULT '{}',
  timing JSONB NOT NULL DEFAULT '{}',
  scores JSONB NOT NULL DEFAULT '{}',
  validity JSONB NOT NULL DEFAULT '{}',
  trials JSONB NOT NULL DEFAULT '[]',
  data_retention_policy TEXT NOT NULL DEFAULT '',
  link_token_hash TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS research_admin_mode_idx
  ON research.administrations (source_mode);
CREATE INDEX IF NOT EXISTS research_admin_task_idx
  ON research.administrations (task);
CREATE INDEX IF NOT EXISTS research_admin_study_idx
  ON research.administrations (study_code);

ALTER TABLE research.administrations ENABLE ROW LEVEL SECURITY;

-- No direct anon/authenticated insert; service role only for pipeline writes.
-- Authenticated researchers may SELECT rows tied to their study_code via app later;
-- Phase 1: deny select to authenticated (exports via service API later).
CREATE POLICY research_deny_all ON research.administrations
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

GRANT USAGE ON SCHEMA research TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA research TO service_role;
