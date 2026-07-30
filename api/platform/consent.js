/**
 * POST /api/platform/consent
 * Record a consent event (link token and/or authenticated actor).
 */
import { createHash } from 'node:crypto';
import {
  handleOptions,
  parseBody,
  sendJson,
  getUserFromAuthHeader,
  supabaseRest,
  writeAuditLog,
  clientIp,
  clientUa,
} from '../_lib/supabase.js';
import { CONSENT_VERSION } from '../_lib/deidentify.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const body = parseBody(req);
  if (body == null) return sendJson(res, 400, { error: 'Invalid JSON' });

  const auth = await getUserFromAuthHeader(req.headers.authorization);
  const token = String(body.token || '').trim();
  const consentVersion = String(body.consentVersion || CONSENT_VERSION);
  const subjectType = String(body.subjectType || 'participant');

  let linkId = null;
  if (token) {
    const linkRes = await supabaseRest({
      schema: 'platform',
      path: `assessment_links?token=eq.${encodeURIComponent(token)}&select=id,revoked_at,expires_at,max_uses,use_count`,
      method: 'GET',
      prefer: null,
    });
    const link = Array.isArray(linkRes.data) ? linkRes.data[0] : null;
    if (!link || link.revoked_at) {
      return sendJson(res, 404, { error: 'Invalid link' });
    }
    linkId = link.id;
  }

  const payloadHash = createHash('sha256')
    .update(JSON.stringify({ consentVersion, subjectType, token: token || null }))
    .digest('hex');

  const insert = await supabaseRest({
    schema: 'platform',
    path: 'consent_events',
    method: 'POST',
    prefer: 'return=representation',
    body: {
      subject_type: subjectType,
      consent_version: consentVersion,
      link_id: linkId,
      actor_user_id: auth?.user?.id || null,
      payload_hash: payloadHash,
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    },
  });

  if (!insert.ok) {
    console.error('consent insert failed', insert.status, insert.text);
    return sendJson(res, 502, { error: 'Failed to record consent' });
  }

  await writeAuditLog({
    actorUserId: auth?.user?.id || null,
    action: 'consent.record',
    resourceType: 'consent_event',
    resourceId: String(Array.isArray(insert.data) ? insert.data[0]?.id : ''),
    ip: clientIp(req),
    userAgent: clientUa(req),
    metadata: { consentVersion, linkId },
  });

  return sendJson(res, 200, { ok: true, consentVersion });
}
