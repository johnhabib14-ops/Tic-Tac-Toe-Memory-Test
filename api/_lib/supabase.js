/**
 * Shared Supabase REST helpers for Vercel serverless platform APIs.
 */

export function getSupabaseEnv() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return { url, anonKey, serviceKey };
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function sendJson(res, status, body) {
  const headers = corsHeaders();
  for (const [k, v] of Object.entries(headers)) {
    res.setHeader(k, v);
  }
  return res.status(status).json(body);
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    for (const [k, v] of Object.entries(corsHeaders())) {
      res.setHeader(k, v);
    }
    return res.status(204).end();
  }
  return null;
}

export function parseBody(req) {
  if (req.body == null) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return null;
    }
  }
  return req.body;
}

/**
 * PostgREST request against a specific schema profile.
 */
export async function supabaseRest({
  schema,
  path,
  method = 'GET',
  body,
  prefer = 'return=representation',
  useServiceRole = true,
  userJwt = null,
}) {
  const { url, anonKey, serviceKey } = getSupabaseEnv();
  if (!url) throw new Error('SUPABASE_URL not configured');
  const key = useServiceRole ? serviceKey || anonKey : anonKey;
  if (!key) throw new Error('Supabase key not configured');

  const headers = {
    apikey: key,
    Authorization: `Bearer ${userJwt || key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Profile': schema,
    'Content-Profile': schema,
  };
  if (prefer) headers.Prefer = prefer;

  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: response.ok, status: response.status, data, text };
}

/**
 * Validate JWT via Supabase Auth and return user.
 */
export async function getUserFromAuthHeader(authHeader) {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) return null;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) return null;
  const user = await response.json();
  return { user, accessToken: token };
}

export async function setUserAppMetadata(userId, appMetadata) {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) throw new Error('Service role required');
  const response = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ app_metadata: appMetadata }),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: response.ok, status: response.status, data };
}

export async function writeAuditLog({
  actorUserId = null,
  action,
  resourceType = '',
  resourceId = '',
  ip = '',
  userAgent = '',
  metadata = {},
}) {
  return supabaseRest({
    schema: 'platform',
    path: 'audit_logs',
    method: 'POST',
    prefer: 'return=minimal',
    body: {
      actor_user_id: actorUserId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      ip: String(ip || '').slice(0, 128),
      user_agent: String(userAgent || '').slice(0, 512),
      metadata,
    },
  });
}

export function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
  return req.headers['x-real-ip'] || '';
}

export function clientUa(req) {
  return req.headers['user-agent'] || '';
}
