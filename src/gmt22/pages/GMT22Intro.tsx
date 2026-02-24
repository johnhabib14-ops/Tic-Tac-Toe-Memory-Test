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
        <li><strong>Practice</strong> — Two short trials so you can learn the task (see a grid, then place the same symbols in the same positions).</li>
        <li><strong>Copy task</strong> — You copy a reference grid (2 symbols: X and O) into an empty grid. This checks that you can use the interface.</li>
        <li><strong>Memory task</strong> — You see grids that disappear, then place the symbols from memory. Sometimes you will ignore extra symbols or remember them; the instructions on each screen tell you what to do.</li>
      </ul>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        The whole session usually takes a few minutes. You can take your time on the instruction screens.
      </p>
      <button type="button" onClick={() => setPhase('consent')}>
        Continue
      </button>
    </div>
  );
}
