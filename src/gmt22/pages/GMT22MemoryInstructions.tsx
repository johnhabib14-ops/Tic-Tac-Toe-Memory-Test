import { useGMT22State } from '../GMT22State';

export default function GMT22MemoryInstructions() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1 className="game-title">Memory rounds</h1>
      <p className="subtitle">
        You&apos;ll see a grid, then it disappears. Place the same symbols. Time limit.
      </p>
      <p>
        Some rounds: only place X and O (ignore the +). Other rounds: place X, O, and +.
      </p>
      <ul style={{ textAlign: 'left', maxWidth: '32rem', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
        <li><strong style={{ color: '#1f77b4' }}>Blue: ignore the +.</strong> Only place X and O.</li>
        <li><strong style={{ color: '#ff7f0e' }}>Orange: remember the +.</strong> Place X, O, and +.</li>
      </ul>
      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
        Sometimes a + appears briefly before you place. That&apos;s normal.
      </p>
      <button type="button" onClick={() => setPhase('memory')}>
        Start
      </button>
    </div>
  );
}
