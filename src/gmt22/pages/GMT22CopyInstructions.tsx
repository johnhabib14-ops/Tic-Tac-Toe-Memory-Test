import { useGMT22State } from '../GMT22State';

export default function GMT22CopyInstructions() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1>Part 1: Copy task</h1>
      <p className="subtitle">
        You will see a reference grid with 8 symbols (X and O). Copy it exactly into the empty grid by placing X and O in the correct positions.
      </p>
      <p>
        You have 30 seconds. Use the palette to select a symbol, then click a cell to place it. Click <strong>Submit</strong> when done, or your answers will be saved automatically when time runs out.
      </p>
      <button type="button" onClick={() => setPhase('copy')}>
        Continue
      </button>
    </div>
  );
}
