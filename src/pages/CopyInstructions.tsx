import { useNavigate } from 'react-router-dom';

export default function CopyInstructions() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1>Part 1: Copy task</h1>
      <p className="subtitle">
        You will see a grid with X and O symbols. Your task is to copy it exactly into the empty grid below as fast and accurately as you can.
      </p>
      <p className="subtitle">
        Use the palette to place X or O in each cell. You get 1 point for each correctly placed shape (16 points maximum).
      </p>
      <button onClick={() => navigate('/copy')}>Next</button>
    </div>
  );
}
