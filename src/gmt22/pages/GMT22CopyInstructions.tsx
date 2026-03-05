import { useGMT22State } from '../GMT22State';

export default function GMT22CopyInstructions() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1>Part 1: Copy task</h1>
      <p className="subtitle">
        Copy the reference grid (8 symbols: X and O) into the empty grid in the same positions.
      </p>
      <p>
        Choose X or O from the palette, then click a cell to place it. When your copy matches the reference, click <strong>Submit</strong>.
      </p>
      <p style={{ marginTop: '1rem', fontSize: '0.95rem', color: '#555' }}>
        You have 30 seconds; if time runs out, your answers are saved automatically.
      </p>
      <button type="button" onClick={() => setPhase('copy')}>
        Start copy task
      </button>
    </div>
  );
}
