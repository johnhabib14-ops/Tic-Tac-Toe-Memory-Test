import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_PIN_STORAGE_KEY } from './PinGate';
import { downloadSessionsCsv, downloadSessionsJson, type SessionRow } from '../lib/exportSessions';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export default function Data() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_URL) {
      setError('API not configured');
      setLoading(false);
      return;
    }
    const pin = sessionStorage.getItem(ADMIN_PIN_STORAGE_KEY);
    if (!pin) {
      navigate('/pin', { replace: true });
      return;
    }
    fetch(`${API_URL}/api/sessions?pin=${encodeURIComponent(pin)}`)
      .then((r) => {
        if (r.status === 401) {
          sessionStorage.removeItem(ADMIN_PIN_STORAGE_KEY);
          navigate('/pin', { replace: true });
          return null;
        }
        if (!r.ok) throw new Error('Failed to load data');
        return r.json();
      })
      .then((data) => {
        const raw = Array.isArray(data) ? data : [];
        const list = raw.map((r: SessionRow & { location?: string }) => ({
          ...r,
          education: r.education ?? r.location ?? '',
        }));
        if (data != null) setSessions(list);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setSessions([]);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_PIN_STORAGE_KEY);
    navigate('/pin', { replace: true });
  }

  if (loading) {
    return (
      <div className="page">
        <h1>Researcher Data</h1>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Researcher Data</h1>
      {error && <p className="form-error">{error}</p>}
      <p className="history-count" style={{ marginBottom: '1rem' }}>
        Total submissions: <strong>{sessions.length}</strong>
      </p>
      <section className="history-section" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Export</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => downloadSessionsJson(sessions)}
            disabled={sessions.length === 0}
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => downloadSessionsCsv(sessions)}
            disabled={sessions.length === 0}
          >
            Export CSV
          </button>
        </div>
      </section>
      <button type="button" className="secondary" onClick={handleLogout}>
        Lock / Sign out
      </button>
    </div>
  );
}
