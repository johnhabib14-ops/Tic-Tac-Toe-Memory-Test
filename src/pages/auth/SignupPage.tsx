import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLine from '../../components/brand/BrandLine';
import BrandMark from '../../components/brand/BrandMark';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { signUpProfessional } from '../../lib/platformAuth';

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [institution, setInstitution] = useState('');
  const [role, setRole] = useState<'clinician' | 'researcher'>('clinician');
  const [acceptAgreement, setAcceptAgreement] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (role === 'clinician' && !acceptAgreement) {
      setError('Clinicians must accept the research data agreement.');
      return;
    }
    setBusy(true);
    const result = await signUpProfessional({
      email,
      password,
      displayName,
      institution,
      role,
      acceptResearchAgreement: acceptAgreement,
    });
    setBusy(false);
    if (result.error) {
      if (result.error.includes('Check your email')) {
        setInfo(result.error);
        return;
      }
      setError(result.error);
      return;
    }
    navigate('/app');
  };

  return (
    <div className="page hl-hub">
      <div className="hl-hub-hero">
        <BrandMark size="hero" />
        <h1 className="hl-hub-title">Create professional account</h1>
        <BrandLine />
        <p className="subtitle hl-hub-lead">
          Join the research network. Assessment engines are shared across all modes.
        </p>
      </div>

      {!isSupabaseConfigured() && (
        <p className="hl-muted" role="alert">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable auth.
        </p>
      )}

      <form className="hl-auth-form" onSubmit={onSubmit}>
        <label className="rit-field">
          Display name
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <label className="rit-field">
          Institution
          <input
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </label>
        <label className="rit-field">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="rit-field">
          Password
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
            <span>
              I may use the assessment free of charge. De-identified assessment data may be
              used for research and aggregate findings may be published. No patient identifying
              information is collected for research purposes.
            </span>
          </label>
        )}

        {error && (
          <p className="hl-muted" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="hl-muted" role="status">
            {info}
          </p>
        )}
        <button type="submit" disabled={busy || !isSupabaseConfigured()}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="hl-hub-link">
        Already have an account? <Link to="/auth/login">Sign in</Link>
        {' · '}
        <Link to="/">Battery hub</Link>
      </p>
    </div>
  );
}
