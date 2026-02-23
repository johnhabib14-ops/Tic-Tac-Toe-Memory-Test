import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_PIN_STORAGE_KEY = 'memory_test_admin_pin';

export default function PinGate() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function handleUnlock() {
    if (!pin.trim()) {
      setError('Enter PIN');
      return;
    }
    try {
      sessionStorage.setItem(ADMIN_PIN_STORAGE_KEY, pin);
    } catch {
      // ignore
    }
    setError('');
    navigate('/data');
  }

  function handleCancel() {
    setPin('');
    setError('');
    navigate('/');
  }

  return (
    <div className="page">
      <h1>Researcher Data</h1>
      <p className="subtitle">Enter the admin PIN to view and export submission data.</p>
      <div style={{ maxWidth: 280, margin: '0 auto', textAlign: 'left' }}>
        <label>
          PIN
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter PIN"
            style={{ marginTop: 0.25 + 'rem', width: '100%' }}
          />
        </label>
        {error && <p className="form-error" style={{ marginTop: '0.5rem' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
          <button type="button" onClick={handleUnlock}>Unlock</button>
          <button type="button" className="secondary" onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export { ADMIN_PIN_STORAGE_KEY };
