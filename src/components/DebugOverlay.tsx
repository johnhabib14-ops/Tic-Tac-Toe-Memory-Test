import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getDebugLogs, subscribeDebugLog } from '../lib/debugLog';

export default function DebugOverlay() {
  const location = useLocation();
  const show = new URLSearchParams(location.search).get('debug') === '1';
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!show) return;
    const unsub = subscribeDebugLog(() => setTick((n) => n + 1));
    return unsub;
  }, [show]);

  if (!show) return null;

  const logs = getDebugLogs();
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: 200,
        overflow: 'auto',
        background: 'rgba(0,0,0,0.9)',
        color: '#0f0',
        fontSize: 11,
        padding: 8,
        zIndex: 9999,
        fontFamily: 'monospace',
      }}
    >
      <div style={{ marginBottom: 4 }}>Debug log (session b9aa2a):</div>
      {logs.length === 0 && <div>No entries yet. Reproduce the issue.</div>}
      {logs.map((e, i) => (
        <div key={i}>
          {new Date(e.t).toISOString().slice(11, 23)} {e.loc} — {e.msg}{' '}
          {e.data != null ? JSON.stringify(e.data) : ''}
        </div>
      ))}
    </div>
  );
}
