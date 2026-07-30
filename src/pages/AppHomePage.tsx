import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLine from '../components/brand/BrandLine';
import BrandMark from '../components/brand/BrandMark';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  completeProfile,
  fetchOwnProfile,
  mintAssessmentLink,
  signOutProfessional,
  type PlatformProfile,
} from '../lib/platformAuth';

export default function AppHomePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PlatformProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [mintMode, setMintMode] = useState<'clinical' | 'research' | 'public'>('clinical');
  const [busy, setBusy] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [institution, setInstitution] = useState('');
  const [role, setRole] = useState<'clinician' | 'researcher'>('clinician');
  const [acceptAgreement, setAcceptAgreement] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        setError('Supabase is not configured.');
        return;
      }
      const sb = getSupabase()!;
      const { data } = await sb.auth.getSession();
      if (!data.session) {
        if (!cancelled) navigate('/auth/login');
        return;
      }
      if (!cancelled) setEmail(data.session.user.email ?? null);
      const p = await fetchOwnProfile();
      if (!cancelled) {
        setProfile(p);
        setNeedsProfile(!p);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const onCompleteProfile = async () => {
    setBusy(true);
    setError(null);
    const result = await completeProfile({
      displayName,
      institution,
      role,
      acceptResearchAgreement: acceptAgreement,
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setProfile(result.profile ?? null);
    setNeedsProfile(false);
  };

  const onMint = async () => {
    setBusy(true);
    setError(null);
    setLinkUrl(null);
    const result = await mintAssessmentLink({
      mode: mintMode,
      maxUses: null,
      metadata: {},
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.link) {
      const origin = window.location.origin;
      const base = import.meta.env.BASE_URL || '/';
      const path = `${base.replace(/\/$/, '')}${result.link.path}`;
      setLinkUrl(`${origin}${path}`);
    }
  };

  const onSignOut = async () => {
    await signOutProfessional();
    navigate('/auth/login');
  };

  if (loading) {
    return (
      <div className="page">
        <p className="hl-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="page hl-hub">
      <div className="hl-hub-hero">
        <BrandMark size="hero" />
        <h1 className="hl-hub-title">Professional home</h1>
        <BrandLine />
        <p className="subtitle hl-hub-lead">
          Phase 1 spine stub — mint assessment links. Full dashboards come in later phases.
        </p>
      </div>

      {email && <p className="hl-muted">Signed in as {email}</p>}
      {profile && (
        <p className="hl-muted">
          Role: <strong>{profile.role}</strong>
          {profile.institution ? ` · ${profile.institution}` : ''}
        </p>
      )}

      {needsProfile && (
        <div className="hl-auth-form">
          <h2>Complete your profile</h2>
          <label className="rit-field">
            Display name
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
          <label className="rit-field">
            Institution
            <input value={institution} onChange={(e) => setInstitution(e.target.value)} />
          </label>
          <label className="rit-field">
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'clinician' | 'researcher')}
            >
              <option value="clinician">Clinician</option>
              <option value="researcher">Researcher</option>
            </select>
          </label>
          {role === 'clinician' && (
            <label className="hl-auth-check">
              <input
                type="checkbox"
                checked={acceptAgreement}
                onChange={(e) => setAcceptAgreement(e.target.checked)}
              />
              <span>I accept the research data agreement for free clinical use.</span>
            </label>
          )}
          <button type="button" onClick={onCompleteProfile} disabled={busy}>
            Save profile
          </button>
        </div>
      )}

      {profile && (
        <div className="hl-auth-form">
          <h2>Mint assessment link</h2>
          <label className="rit-field">
            Mode
            <select
              value={mintMode}
              onChange={(e) =>
                setMintMode(e.target.value as 'clinical' | 'research' | 'public')
              }
            >
              <option value="clinical">Clinical</option>
              <option value="research">Research</option>
              <option value="public">Public</option>
            </select>
          </label>
          <button type="button" onClick={onMint} disabled={busy}>
            {busy ? 'Creating…' : 'Create link'}
          </button>
          {linkUrl && (
            <p className="hl-muted" role="status">
              Share this link with a participant:
              <br />
              <a href={linkUrl}>{linkUrl}</a>
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="hl-muted" role="alert">
          {error}
        </p>
      )}

      <p className="hl-hub-link">
        <Link to="/">Battery hub</Link>
        {' · '}
        <button type="button" className="secondary" onClick={onSignOut}>
          Sign out
        </button>
      </p>
    </div>
  );
}
