import { apiBaseUrl, getSupabase, isSupabaseConfigured } from './supabaseClient';

export type ProfessionalRole = 'clinician' | 'researcher' | 'admin';

export interface PlatformProfile {
  user_id: string;
  display_name: string;
  institution: string;
  role: ProfessionalRole;
  research_agreement_accepted_at: string | null;
}

export async function getAccessToken(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function signUpProfessional(input: {
  email: string;
  password: string;
  displayName: string;
  institution: string;
  role: 'clinician' | 'researcher';
  acceptResearchAgreement: boolean;
}): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)' };
  }
  const sb = getSupabase()!;
  const { data, error } = await sb.auth.signUp({
    email: input.email,
    password: input.password,
  });
  if (error) return { error: error.message };
  if (!data.session) {
    return {
      error:
        'Account created. Check your email to confirm, then sign in to complete your profile.',
    };
  }
  return completeProfile({
    displayName: input.displayName,
    institution: input.institution,
    role: input.role,
    acceptResearchAgreement: input.acceptResearchAgreement,
  });
}

export async function signInProfessional(input: {
  email: string;
  password: string;
}): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase is not configured' };
  }
  const sb = getSupabase()!;
  const { error } = await sb.auth.signInWithPassword(input);
  return { error: error?.message ?? null };
}

export async function signOutProfessional(): Promise<void> {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
}

export async function completeProfile(input: {
  displayName: string;
  institution: string;
  role: 'clinician' | 'researcher';
  acceptResearchAgreement: boolean;
}): Promise<{ error: string | null; profile?: PlatformProfile }> {
  const base = apiBaseUrl();
  const token = await getAccessToken();
  if (!base) return { error: 'VITE_API_URL is not set' };
  if (!token) return { error: 'Not signed in' };

  const res = await fetch(`${base}/api/platform/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      displayName: input.displayName,
      institution: input.institution,
      role: input.role,
      acceptResearchAgreement: input.acceptResearchAgreement,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json.error || `Profile failed (${res.status})` };
  return { error: null, profile: json.profile };
}

export async function fetchOwnProfile(): Promise<PlatformProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: sessionData } = await sb.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await sb
    .schema('platform')
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PlatformProfile;
}

export async function mintAssessmentLink(input: {
  mode: 'clinical' | 'research' | 'public';
  expiresAt?: string | null;
  maxUses?: number | null;
  metadata?: Record<string, unknown>;
}): Promise<{ error: string | null; link?: { token: string; path: string; mode: string } }> {
  const base = apiBaseUrl();
  const token = await getAccessToken();
  if (!base) return { error: 'VITE_API_URL is not set' };
  if (!token) return { error: 'Not signed in' };

  const res = await fetch(`${base}/api/platform/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json.error || `Link create failed (${res.status})` };
  return { error: null, link: json.link };
}

export async function validateAssessmentLink(token: string): Promise<{
  error: string | null;
  link?: {
    id: string;
    mode: 'clinical' | 'research' | 'public';
    expiresAt: string | null;
    metadata: Record<string, unknown>;
    token: string;
  };
}> {
  const base = apiBaseUrl();
  if (!base) return { error: 'VITE_API_URL is not set' };
  const res = await fetch(
    `${base}/api/platform/links?token=${encodeURIComponent(token)}`
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json.error || 'Invalid link' };
  return { error: null, link: json.link };
}

export async function recordConsent(input: {
  token?: string;
  consentVersion?: string;
}): Promise<{ error: string | null }> {
  const base = apiBaseUrl();
  if (!base) return { error: 'VITE_API_URL is not set' };
  const authToken = await getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${base}/api/platform/consent`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return { error: json.error || 'Consent failed' };
  }
  return { error: null };
}
