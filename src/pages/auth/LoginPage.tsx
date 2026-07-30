import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLine from '../../components/brand/BrandLine';
import BrandMark from '../../components/brand/BrandMark';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { signInProfessional } from '../../lib/platformAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await signInProfessional({ email, password });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate('/app');
  };

  return (
    <div className="page hl-hub">
      <div className="hl-hub-hero">
        <BrandMark size="hero" />
        <h1 className="hl-hub-title">Professional sign in</h1>
        <BrandLine />
        <p className="subtitle hl-hub-lead">
          Clinicians and researchers sign in to mint assessment links.
        </p>
      </div>

      {!isSupabaseConfigured() && (
        <p className="hl-muted" role="alert">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable auth.
        </p>
      )}

      <form className="hl-auth-form" onSubmit={onSubmit}>
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="hl-muted" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy || !isSupabaseConfigured()}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="hl-hub-link">
        Need an account? <Link to="/auth/signup">Create professional account</Link>
        {' · '}
        <Link to="/">Battery hub</Link>
      </p>
    </div>
  );
}
