import { useGMT22State } from '../GMT22State';

export default function GMT22MemoryInstructions() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1>Part 2: Memory task</h1>
      <p className="subtitle">
        You will see a grid. It will disappear, then you place the same symbols in the same positions in the empty grid. You have a time limit.
      </p>
      <p>
        Symbols are <strong>X</strong>, <strong>O</strong>, and sometimes <strong>+</strong>. Before each grid, the screen will tell you:
      </p>
      <ul style={{ textAlign: 'left', maxWidth: '32rem', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
        <li><span style={{ color: '#1f77b4', fontWeight: 600 }}>IGNORE the plus signs.</span> — Only place X and O. Do not place +.</li>
        <li><span style={{ color: '#ff7f0e', fontWeight: 600 }}>REMEMBER the plus signs.</span> — Place all three in the correct spots.</li>
      </ul>
      <p>
        During the task, the instruction will appear in <strong style={{ color: '#1f77b4' }}>blue</strong> (ignore) or <strong style={{ color: '#ff7f0e' }}>orange</strong> (remember) and bold above each grid so you can tell at a glance whether to ignore or place the +.
      </p>
      <p>
        Read the instruction above each grid; it tells you whether to ignore or remember + for that grid.
      </p>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        Some trials show a brief pause (a cross) before you place — that is normal.
      </p>
      <button type="button" onClick={() => setPhase('memory')}>
        Start memory task
      </button>
    </div>
  );
}
