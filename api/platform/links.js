/**
 * GET  /api/platform/links?token=...  — public validate
 * POST /api/platform/links            — authenticated mint
 */
import { randomBytes, createHash } from 'node:crypto';
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

const ALLOWED_MODES = new Set(['clinical', 'research', 'public']);

function mintToken() {
  return randomBytes(24).toString('base64url');
}

function isLinkUsable(link) {
  if (!link) return false;
  if (link.revoked_at) return false;
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) return false;
  if (link.max_uses != null && link.use_count >= link.max_uses) return false;
  return true;
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method === 'GET') {
    const token = String(req.query?.token || '').trim();
    if (!token) return sendJson(res, 400, { error: 'token required' });

    const result = await supabaseRest({
      schema: 'platform',
      path: `assessment_links?token=eq.${encodeURIComponent(token)}&select=*`,
      method: 'GET',
      prefer: null,
    });

    if (!result.ok) {
      return sendJson(res, 502, { error: 'Lookup failed' });
    }
    const link = Array.isArray(result.data) ? result.data[0] : null;
    if (!link || !isLinkUsable(link)) {
      return sendJson(res, 404, { error: 'Invalid or expired link', code: 'LINK_INVALID' });
    }

    return sendJson(res, 200, {
      ok: true,
      link: {
        id: link.id,
        mode: link.mode,
        expiresAt: link.expires_at,
        metadata: link.metadata || {},
        token,
      },
    });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const auth = await getUserFromAuthHeader(req.headers.authorization);
  if (!auth?.user?.id) {
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  const body = parseBody(req);
  if (body == null) return sendJson(res, 400, { error: 'Invalid JSON' });

  const mode = String(body.mode || '');
  if (!ALLOWED_MODES.has(mode)) {
    return sendJson(res, 400, { error: 'mode must be clinical, research, or public' });
  }

  // Load profile for role checks
  const profileRes = await supabaseRest({
    schema: 'platform',
    path: `profiles?user_id=eq.${auth.user.id}&select=*`,
    method: 'GET',
    prefer: null,
  });
  const profile = Array.isArray(profileRes.data) ? profileRes.data[0] : null;
  if (!profile) {
    return sendJson(res, 403, { error: 'Complete professional profile first', code: 'PROFILE_REQUIRED' });
  }
  if (mode === 'clinical' && profile.role !== 'clinician' && profile.role !== 'admin') {
    return sendJson(res, 403, { error: 'Only clinicians can mint clinical links' });
  }
  if (mode === 'clinical' && !profile.research_agreement_accepted_at) {
    return sendJson(res, 403, { error: 'Research agreement required', code: 'RESEARCH_AGREEMENT_REQUIRED' });
  }

  const token = mintToken();
  const expiresAt = body.expiresAt || body.expires_at || null;
  const maxUses = body.maxUses ?? body.max_uses ?? null;
  const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};

  const insert = await supabaseRest({
    schema: 'platform',
    path: 'assessment_links',
    method: 'POST',
    body: {
      token,
      mode,
      owner_user_id: auth.user.id,
      expires_at: expiresAt,
      max_uses: maxUses,
      metadata,
    },
  });

  if (!insert.ok) {
    console.error('link mint failed', insert.status, insert.text);
    return sendJson(res, 502, { error: 'Failed to create link', detail: String(insert.text).slice(0, 200) });
  }

  const created = Array.isArray(insert.data) ? insert.data[0] : insert.data;
  await writeAuditLog({
    actorUserId: auth.user.id,
    action: 'link.create',
    resourceType: 'assessment_link',
    resourceId: created?.id || '',
    ip: clientIp(req),
    userAgent: clientUa(req),
    metadata: {
      mode,
      token_hash: createHash('sha256').update(token).digest('hex').slice(0, 16),
    },
  });

  return sendJson(res, 200, {
    ok: true,
    link: {
      id: created.id,
      token,
      mode: created.mode,
      expiresAt: created.expires_at,
      maxUses: created.max_uses,
      metadata: created.metadata,
      path: `/a/${token}`,
    },
  });
}
