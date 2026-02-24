import { useGMT22State } from '../GMT22State';

export default function GMT22MemoryInstructions() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1>Part 2: Memory task</h1>
      <p className="subtitle">
        You will see a grid, then place the same symbols in the same positions in the empty grid.
      </p>
      <p>
        Symbols are <strong>X</strong>, <strong>O</strong>, and sometimes <strong>+</strong>. Before each grid, the screen will tell you:
      </p>
      <ul style={{ textAlign: 'left', maxWidth: '32rem', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
        <li><span style={{ color: 'red', fontWeight: 'bold' }}>Ignore the +</span> — Only place X and O. Do not place +.</li>
        <li><span style={{ color: 'red', fontWeight: 'bold' }}>Remember X, O, and +</span> — Place all three in the correct spots.</li>
        <li><span style={{ color: 'red', fontWeight: 'bold' }}>No +</span> — Just place X and O.</li>
      </ul>
      <p>
        During the task, this instruction will appear in <strong style={{ color: 'red' }}>red and bold</strong> above each grid so you can tell at a glance whether to ignore or place the +.
      </p>
      <p>
        Follow the line of text on each screen; it tells you whether to ignore or remember + for that grid.
      </p>
      <button type="button" onClick={() => setPhase('memory')}>
        Start memory task
      </button>
    </div>
  );
}
