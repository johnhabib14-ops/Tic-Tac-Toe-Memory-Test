import { useNavigate } from 'react-router-dom';
import ReconstructionGrid from '../components/ReconstructionGrid';
import type { ResponseMap } from '../types';

export default function BigGridWarning() {
  const navigate = useNavigate();
  const responseMap: ResponseMap = {};

  function handleNext() {
    navigate('/test', { state: { startLevel: 19 } });
  }

  return (
    <div className="page">
      <h1>Coming up: Bigger grid</h1>
      <p className="subtitle">
        In the next part, the grid will be <strong>4 by 4</strong> (16 cells).
      </p>
      <p>Here is what the empty bigger grid looks like:</p>
      <div className="grid-container" style={{ marginTop: '1rem' }}>
        <ReconstructionGrid
          gridSize={4}
          responseMap={responseMap}
          onPlace={() => {}}
          onDrop={() => {}}
          onCellClick={() => {}}
        />
      </div>
      <button onClick={handleNext} style={{ marginTop: '2rem' }}>Next</button>
    </div>
  );
}
