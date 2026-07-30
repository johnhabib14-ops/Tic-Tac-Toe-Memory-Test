-- Platform schema: identities, assessment links, consent, audit.
-- Run in Supabase SQL Editor. Then expose schema "platform" in API settings.
-- See docs/PLATFORM_ARCHITECTURE.md and ADR-001.

CREATE SCHEMA IF NOT EXISTS platform;

CREATE TYPE platform.user_role AS ENUM ('clinician', 'researcher', 'admin');

CREATE TYPE platform.link_mode AS ENUM ('clinical', 'research', 'public');

CREATE TABLE IF NOT EXISTS platform.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  institution TEXT NOT NULL DEFAULT '',
  role platform.user_role NOT NULL,
  research_agreement_accepted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform.assessment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  mode platform.link_mode NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NULL,
  max_uses INTEGER NULL,
  use_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  revoked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assessment_links_owner_idx
  ON platform.assessment_links (owner_user_id);
CREATE INDEX IF NOT EXISTS assessment_links_token_idx
  ON platform.assessment_links (token);

CREATE TABLE IF NOT EXISTS platform.consent_events (
  id BIGSERIAL PRIMARY KEY,
  subject_type TEXT NOT NULL DEFAULT 'participant',
  consent_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  link_id UUID NULL REFERENCES platform.assessment_links (id) ON DELETE SET NULL,
  actor_user_id UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  payload_hash TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT '',
  resource_id TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON platform.audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON platform.audit_logs (created_at DESC);

ALTER TABLE platform.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.assessment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own row; inserts via service role or own signup path
CREATE POLICY profiles_select_own ON platform.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY profiles_update_own ON platform.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_insert_own ON platform.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Links: owners manage their links
CREATE POLICY links_select_own ON platform.assessment_links
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY links_insert_own ON platform.assessment_links
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY links_update_own ON platform.assessment_links
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Consent / audit: authenticated can insert own; select own actor rows
CREATE POLICY consent_insert_authenticated ON platform.consent_events
  FOR INSERT TO authenticated
  WITH CHECK (actor_user_id IS NULL OR actor_user_id = auth.uid());

CREATE POLICY consent_select_own ON platform.consent_events
  FOR SELECT TO authenticated
  USING (actor_user_id = auth.uid());

CREATE POLICY audit_select_own ON platform.audit_logs
  FOR SELECT TO authenticated
  USING (actor_user_id = auth.uid());

-- Grants for PostgREST
GRANT USAGE ON SCHEMA platform TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON platform.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON platform.assessment_links TO authenticated;
GRANT SELECT, INSERT ON platform.consent_events TO authenticated, anon;
GRANT SELECT ON platform.audit_logs TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA platform TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA platform TO authenticated, service_role, anon;
