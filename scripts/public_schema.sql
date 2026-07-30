-- Public schema: anonymous public administrations (separate from clinical norms).
-- Run after platform_schema.sql. Expose schema "public_anon" as "public_data"
-- Note: Postgres schema cannot be named conflicting with reserved usage casually;
-- we use schema name "public_data" to avoid colliding with Postgres "public".
-- Application code and docs refer to this as the Public database.

CREATE SCHEMA IF NOT EXISTS public_data;

CREATE TABLE IF NOT EXISTS public_data.administrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task TEXT NOT NULL DEFAULT '',
  session_id TEXT NOT NULL UNIQUE,
  anonymous_participant_id TEXT NOT NULL DEFAULT '',
  battery_session_id TEXT NOT NULL DEFAULT '',
  task_version TEXT NOT NULL DEFAULT '',
  scoring_version TEXT NOT NULL DEFAULT '',
  consent_version TEXT NOT NULL DEFAULT '',
  research_consent BOOLEAN NOT NULL DEFAULT false,
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

CREATE INDEX IF NOT EXISTS public_admin_task_idx ON public_data.administrations (task);
CREATE INDEX IF NOT EXISTS public_admin_research_consent_idx
  ON public_data.administrations (research_consent);

ALTER TABLE public_data.administrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_data_deny_authenticated ON public_data.administrations
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

GRANT USAGE ON SCHEMA public_data TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public_data TO service_role;
