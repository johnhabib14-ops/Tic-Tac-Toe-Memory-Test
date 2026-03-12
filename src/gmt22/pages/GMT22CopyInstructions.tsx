import { useGMT22State } from '../GMT22State';

export default function GMT22CopyInstructions() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1 className="game-title">Warm up</h1>
      <p className="subtitle">
        Match the grid above in the empty grid below. Same positions.
      </p>
      <p>
        Pick X or O, click a cell to place it. When it matches, click Done.
      </p>
      <p style={{ marginTop: '1rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
        You have 30 seconds; if time runs out, your answers are saved.
      </p>
      <button type="button" onClick={() => setPhase('copy')}>
        Start
      </button>
    </div>
  );
}
