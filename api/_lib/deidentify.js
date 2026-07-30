/**
 * De-identify assessment payloads before research / public_data writes.
 * Strips PHI and free-text clinical fields; keeps demographic bins + behavioral data.
 */

const PHI_DEMOGRAPHIC_KEYS = new Set([
  'name',
  'fullName',
  'full_name',
  'givenName',
  'given_name',
  'familyName',
  'family_name',
  'firstName',
  'first_name',
  'lastName',
  'last_name',
  'email',
  'phone',
  'mrn',
  'medicalRecordNumber',
  'medical_record_number',
  'address',
  'street',
  'ssn',
  'dateOfBirth',
  'date_of_birth',
  'dob',
  'patientId',
  'patient_id',
  'clinicianId',
  'clinician_id',
  'examinerName',
  'examiner_name',
  'notes',
  'examinerNotes',
  'examiner_notes',
]);

const ALLOWED_DEMOGRAPHIC_KEYS = new Set([
  'age',
  'sex',
  'gender',
  'education',
  'language',
  'handedness',
  'country',
  'culturalBackground',
  'cultural_background',
  'location',
]);

/**
 * @param {Record<string, unknown>|null|undefined} demographics
 * @returns {Record<string, unknown>}
 */
export function binDemographics(demographics) {
  const src = demographics && typeof demographics === 'object' ? demographics : {};
  const out = {};
  for (const [key, value] of Object.entries(src)) {
    if (PHI_DEMOGRAPHIC_KEYS.has(key)) continue;
    if (!ALLOWED_DEMOGRAPHIC_KEYS.has(key)) continue;
    if (value == null || value === '') continue;
    out[key] = value;
  }
  return out;
}

/**
 * Remove known PHI keys from a plain object (shallow + nested demographics/notes).
 * @param {Record<string, unknown>} obj
 */
export function stripPhiKeys(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PHI_DEMOGRAPHIC_KEYS.has(key)) continue;
    if (key === 'demographics' && value && typeof value === 'object') {
      out[key] = binDemographics(/** @type {Record<string, unknown>} */ (value));
      continue;
    }
    out[key] = value;
  }
  return out;
}

/**
 * Build a research.administrations row from a platform submit body.
 * @param {object} input
 */
export function toResearchRow(input) {
  const {
    sourceMode = '',
    task = '',
    sessionId = '',
    anonymousParticipantId = '',
    studyCode = '',
    batterySessionId = '',
    taskVersion = '',
    scoringVersion = '',
    consentVersion = '',
    demographics = {},
    device = {},
    timing = {},
    scores = {},
    validity = {},
    trials = [],
    dataRetentionPolicy = '',
    linkTokenHash = '',
  } = input || {};

  return {
    source_mode: String(sourceMode || ''),
    task: String(task || ''),
    session_id: String(sessionId || ''),
    anonymous_participant_id: String(anonymousParticipantId || ''),
    study_code: String(studyCode || ''),
    battery_session_id: String(batterySessionId || ''),
    task_version: String(taskVersion || ''),
    scoring_version: String(scoringVersion || ''),
    consent_version: String(consentVersion || ''),
    demographic_bins: binDemographics(demographics),
    device: device && typeof device === 'object' ? stripPhiKeys(device) : {},
    timing: timing && typeof timing === 'object' ? timing : {},
    scores: scores && typeof scores === 'object' ? stripPhiKeys(scores) : {},
    validity: validity && typeof validity === 'object' ? validity : {},
    trials: Array.isArray(trials) ? trials : [],
    data_retention_policy: String(dataRetentionPolicy || ''),
    link_token_hash: String(linkTokenHash || ''),
  };
}

/**
 * Build a public_data.administrations row.
 */
export function toPublicRow(input) {
  const research = toResearchRow(input);
  return {
    task: research.task,
    session_id: research.session_id,
    anonymous_participant_id: research.anonymous_participant_id,
    battery_session_id: research.battery_session_id,
    task_version: research.task_version,
    scoring_version: research.scoring_version,
    consent_version: research.consent_version,
    research_consent: Boolean(input?.researchConsent),
    demographic_bins: research.demographic_bins,
    device: research.device,
    timing: research.timing,
    scores: research.scores,
    validity: research.validity,
    trials: research.trials,
    data_retention_policy: research.data_retention_policy,
    link_token_hash: research.link_token_hash,
  };
}

/**
 * Assert research payload has no PHI keys (for tests / guards).
 * @param {Record<string, unknown>} row
 * @returns {string[]} list of offending paths
 */
export function findPhiLeaks(row) {
  const leaks = [];
  const walk = (node, path) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      const next = path ? `${path}.${key}` : key;
      if (PHI_DEMOGRAPHIC_KEYS.has(key)) leaks.push(next);
      walk(value, next);
    }
  };
  walk(row, '');
  return leaks;
}

export const CONSENT_VERSION = 'platform-consent-v1';
export const RESEARCH_AGREEMENT_VERSION = 'clinician-research-agreement-v1';
