-- Clinical schema: PHI — clinician-owned patients and administrations.
-- Run after platform_schema.sql. Expose schema "clinical" in API settings.

CREATE SCHEMA IF NOT EXISTS clinical;

CREATE TABLE IF NOT EXISTS clinical.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  display_label TEXT NOT NULL DEFAULT '',
  given_name TEXT NOT NULL DEFAULT '',
  family_name TEXT NOT NULL DEFAULT '',
  date_of_birth DATE NULL,
  sex TEXT NOT NULL DEFAULT '',
  education TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT '',
  handedness TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  cultural_background TEXT NOT NULL DEFAULT '',
  mrn TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS patients_clinician_idx
  ON clinical.patients (clinician_user_id);

CREATE TABLE IF NOT EXISTS clinical.administrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NULL REFERENCES clinical.patients (id) ON DELETE SET NULL,
  clinician_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  link_id UUID NULL REFERENCES platform.assessment_links (id) ON DELETE SET NULL,
  battery_session_id TEXT NOT NULL DEFAULT '',
  task TEXT NOT NULL DEFAULT '',
  session_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed',
  demographics JSONB NOT NULL DEFAULT '{}',
  scores JSONB NOT NULL DEFAULT '{}',
  trials JSONB NOT NULL DEFAULT '[]',
  device JSONB NOT NULL DEFAULT '{}',
  validity JSONB NOT NULL DEFAULT '{}',
  examiner_notes TEXT NOT NULL DEFAULT '',
  raw_payload JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS clinical_admin_clinician_idx
  ON clinical.administrations (clinician_user_id);
CREATE INDEX IF NOT EXISTS clinical_admin_session_idx
  ON clinical.administrations (session_id);
CREATE INDEX IF NOT EXISTS clinical_admin_patient_idx
  ON clinical.administrations (patient_id);

ALTER TABLE clinical.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical.administrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY patients_all_own ON clinical.patients
  FOR ALL TO authenticated
  USING (clinician_user_id = auth.uid())
  WITH CHECK (clinician_user_id = auth.uid());

CREATE POLICY administrations_all_own ON clinical.administrations
  FOR ALL TO authenticated
  USING (clinician_user_id = auth.uid())
  WITH CHECK (clinician_user_id = auth.uid());

GRANT USAGE ON SCHEMA clinical TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON clinical.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clinical.administrations TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA clinical TO service_role;
