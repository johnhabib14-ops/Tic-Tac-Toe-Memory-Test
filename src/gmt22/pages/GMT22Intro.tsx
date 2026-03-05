import { useGMT22State } from '../GMT22State';

export default function GMT22Intro() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1>GMT 2 — Grid Memory Task</h1>
      <p className="subtitle">
        This task measures how well you can remember and reproduce the positions of symbols in a grid. Your responses help researchers understand visual and spatial memory.
      </p>
      <p><strong>What will happen:</strong></p>
      <ul style={{ textAlign: 'left', maxWidth: '32rem', margin: '0 auto 1rem', lineHeight: 1.6 }}>
        <li><strong>Practice</strong> — Two trials: see a grid, then place the same symbols in the same positions.</li>
        <li><strong>Copy task</strong> — Copy a reference grid (X and O) into an empty grid.</li>
        <li><strong>Memory task</strong> — See grids that disappear, then place symbols from memory. Instructions on each screen say whether to ignore or remember the +.</li>
      </ul>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        Takes a few minutes. Take your time on instructions.
      </p>
      <button type="button" onClick={() => setPhase('consent')}>
        Continue
      </button>
    </div>
  );
}
