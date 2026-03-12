import { useGMT22State } from '../GMT22State';

export default function GMT22Intro() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1>GMT 2 — Grid Memory Task</h1>
      <p className="subtitle">
        You&apos;ll see grids of symbols, then place them in the same spots from memory.
      </p>
      <p><strong>What will happen:</strong></p>
      <ul style={{ textAlign: 'left', maxWidth: '32rem', margin: '0 auto 1rem', lineHeight: 1.6 }}>
        <li><strong>Practice</strong> — See a grid, then place the same symbols in the same spots.</li>
        <li><strong>Copy</strong> — Match the top grid in the empty grid below.</li>
        <li><strong>Memory</strong> — Same idea, but the grid disappears first. Some rounds you&apos;ll only place X and O; others you&apos;ll also place +. Each screen will say which.</li>
      </ul>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        Takes a few minutes.
      </p>
      <button type="button" onClick={() => setPhase('consent')}>
        Continue
      </button>
    </div>
  );
}
