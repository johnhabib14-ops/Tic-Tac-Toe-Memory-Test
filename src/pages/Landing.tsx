import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1 className="game-title">Grid Memory</h1>
      <p className="subtitle">
        Remember the grid. Place the symbols.
      </p>
      <button onClick={() => navigate('/gmt2')}>Play</button>
    </div>
  );
}
