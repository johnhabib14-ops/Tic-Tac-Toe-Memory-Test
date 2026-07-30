/**
 * POST /api/platform/profile
 * Authenticated: create/update platform.profiles and set app_metadata.role (service role).
 */
import {
  handleOptions,
  parseBody,
  sendJson,
  getUserFromAuthHeader,
  setUserAppMetadata,
  supabaseRest,
  writeAuditLog,
  clientIp,
  clientUa,
} from '../_lib/supabase.js';
import { RESEARCH_AGREEMENT_VERSION } from '../_lib/deidentify.js';

const ALLOWED_ROLES = new Set(['clinician', 'researcher']);

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const auth = await getUserFromAuthHeader(req.headers.authorization);
  if (!auth?.user?.id) {
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  const body = parseBody(req);
  if (body == null) return sendJson(res, 400, { error: 'Invalid JSON' });

  const role = String(body.role || '');
  if (!ALLOWED_ROLES.has(role)) {
    return sendJson(res, 400, { error: 'role must be clinician or researcher' });
  }

  const displayName = String(body.displayName ?? body.display_name ?? '').slice(0, 200);
  const institution = String(body.institution ?? '').slice(0, 200);
  const acceptAgreement = Boolean(body.acceptResearchAgreement);

  if (role === 'clinician' && !acceptAgreement) {
    return sendJson(res, 400, {
      error: 'Clinicians must accept the research data agreement',
      code: 'RESEARCH_AGREEMENT_REQUIRED',
    });
  }

  const existing = await supabaseRest({
    schema: 'platform',
    path: `profiles?user_id=eq.${auth.user.id}&select=*`,
    method: 'GET',
    prefer: null,
  });

  const now = new Date().toISOString();
  const profileRow = {
    user_id: auth.user.id,
    display_name: displayName,
    institution,
    role,
    research_agreement_accepted_at:
      role === 'clinician' ? now : null,
    updated_at: now,
  };

  let profileResult;
  if (existing.ok && Array.isArray(existing.data) && existing.data.length > 0) {
    // Role changes after signup are not allowed in Phase 1 (prevent privilege escalation via client).
    const currentRole = existing.data[0].role;
    profileRow.role = currentRole;
    if (currentRole === 'clinician' && !existing.data[0].research_agreement_accepted_at && acceptAgreement) {
      profileRow.research_agreement_accepted_at = now;
    } else {
      profileRow.research_agreement_accepted_at =
        existing.data[0].research_agreement_accepted_at;
    }
    profileResult = await supabaseRest({
      schema: 'platform',
      path: `profiles?user_id=eq.${auth.user.id}`,
      method: 'PATCH',
      body: {
        display_name: profileRow.display_name,
        institution: profileRow.institution,
        research_agreement_accepted_at: profileRow.research_agreement_accepted_at,
        updated_at: now,
      },
    });
  } else {
    profileResult = await supabaseRest({
      schema: 'platform',
      path: 'profiles',
      method: 'POST',
      body: { ...profileRow, created_at: now },
    });
  }

  if (!profileResult.ok) {
    console.error('profile upsert failed', profileResult.status, profileResult.text);
    return sendJson(res, 502, { error: 'Failed to save profile', detail: String(profileResult.text).slice(0, 200) });
  }

  const metaRole =
    (Array.isArray(profileResult.data) && profileResult.data[0]?.role) ||
    profileRow.role;
  await setUserAppMetadata(auth.user.id, {
    role: metaRole,
    research_agreement_version:
      metaRole === 'clinician' ? RESEARCH_AGREEMENT_VERSION : null,
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    action: 'profile.upsert',
    resourceType: 'profile',
    resourceId: auth.user.id,
    ip: clientIp(req),
    userAgent: clientUa(req),
    metadata: { role: metaRole },
  });

  const saved = Array.isArray(profileResult.data) ? profileResult.data[0] : profileResult.data;
  return sendJson(res, 200, { ok: true, profile: saved });
}
