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
        The grid will disappear, then you place the symbols in the empty grid in the same positions. You will have a time limit to place your answers.
      </p>
      <p>
        Symbols are <strong>X</strong>, <strong>O</strong>, and sometimes <strong>+</strong>. Before each grid, the screen will tell you:
      </p>
      <ul style={{ textAlign: 'left', maxWidth: '32rem', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
        <li><span style={{ color: 'red', fontWeight: 'bold' }}>Ignore the +</span> — Only place X and O. Do not place +.</li>
        <li><span style={{ color: 'green', fontWeight: 'bold' }}>Remember X, O, and +</span> — Place all three in the correct spots.</li>
      </ul>
      <p>
        During the task, the instruction will appear in <strong style={{ color: 'red' }}>red</strong> (ignore) or <strong style={{ color: 'green' }}>green</strong> (remember) and bold above each grid so you can tell at a glance whether to ignore or place the +.
      </p>
      <p>
        Follow the line of text on each screen; it tells you whether to ignore or remember + for that grid.
      </p>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        In some trials you will see a brief pause (a cross) before the placement screen — that is normal.
      </p>
      <button type="button" onClick={() => setPhase('memory')}>
        Start memory task
      </button>
    </div>
  );
}
