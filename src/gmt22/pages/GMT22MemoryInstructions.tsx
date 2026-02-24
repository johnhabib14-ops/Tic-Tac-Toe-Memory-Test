import { useGMT22State } from '../GMT22State';

export default function GMT22MemoryInstructions() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1>Part 2: Memory task</h1>
      <p className="subtitle">
        You will see a series of grids to remember. After each grid, you will reconstruct it by placing symbols in the correct positions.
      </p>
      <p>
        <strong>Symbols:</strong> Most grids use <strong>X</strong> and <strong>O</strong>. Some grids also include a <strong>+</strong> symbol.
      </p>
      <p>
        <strong>Important:</strong> Before each grid we will tell you what to do:
      </p>
      <ul style={{ textAlign: 'left', maxWidth: '32rem', margin: '0 auto 1rem' }}>
        <li><strong>Ignore the +</strong> — Only remember and place X and O. Do not place +.</li>
        <li><strong>Remember X, O, and +</strong> — Remember all symbols including + and place them in the correct positions.</li>
        <li>If there is no +, just remember and place X and O.</li>
      </ul>
      <p>
        Read the instruction on each screen carefully. You will have a time limit to reconstruct each grid.
      </p>
      <button type="button" onClick={() => setPhase('memory')}>
        Continue
      </button>
    </div>
  );
}
