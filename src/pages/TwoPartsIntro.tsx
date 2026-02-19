import { useNavigate } from 'react-router-dom';

export default function TwoPartsIntro() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1>This test has two parts</h1>
      <div className="instructions">
        <p className="subtitle">
          <strong>Part 1: Copy task.</strong> You will copy a grid of X and O into an empty grid as accurately and quickly as you can.
        </p>
        <p className="subtitle">
          <strong>Part 2: Memory task.</strong> You will briefly see grids, then rebuild them from memory.
        </p>
      </div>
      <button onClick={() => navigate('/copy-instructions')}>Next</button>
    </div>
  );
}
