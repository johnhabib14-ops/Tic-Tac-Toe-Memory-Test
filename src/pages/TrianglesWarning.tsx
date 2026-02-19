import { useNavigate } from 'react-router-dom';
import DistractorShape from '../components/DistractorShape';

export default function TrianglesWarning() {
  const navigate = useNavigate();

  function handleNext() {
    navigate('/test', { state: { startLevel: 10 } });
  }

  return (
    <div className="page">
      <h1>Coming up: (+) symbol</h1>
      <p className="subtitle">
        In the next part of the test, you will see the <strong>(+)</strong> symbol in some cells
        alongside X and O. Please <strong>ignore the (+)</strong> symbol. Only the positions
        of X and O matter.
      </p>
      <p>Here is an example of the (+) symbol (ignore it):</p>
      <div className="grid-container" style={{ marginTop: '1rem' }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(1, 56px)', gridTemplateRows: '56px' }}>
          <div className="grid-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DistractorShape cell={{ type: 'TRI' }} />
          </div>
        </div>
      </div>
      <button onClick={handleNext} style={{ marginTop: '2rem' }}>Next</button>
    </div>
  );
}
