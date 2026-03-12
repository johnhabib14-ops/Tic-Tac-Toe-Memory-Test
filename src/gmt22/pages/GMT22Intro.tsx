import { useGMT22State } from '../GMT22State';

export default function GMT22Intro() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1 className="game-title">Grid Memory</h1>
      <p className="subtitle">
        You&apos;ll see grids of symbols, then place them in the same spots from memory.
      </p>
      <p><strong>Here&apos;s how it works:</strong></p>
      <ul style={{ textAlign: 'left', maxWidth: '32rem', margin: '0 auto 1rem', lineHeight: 1.6 }}>
        <li><strong>Warm up:</strong> Match a grid.</li>
        <li><strong>Main game:</strong> See a grid, then place the symbols from memory. Some rounds you place only X and O; others you also place +. Each screen will say which.</li>
      </ul>
      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
        Takes a few minutes.
      </p>
      <button type="button" onClick={() => setPhase('consent')}>
        Next
      </button>
    </div>
  );
}
