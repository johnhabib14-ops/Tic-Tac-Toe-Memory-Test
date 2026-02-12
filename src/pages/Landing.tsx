import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1>Tic Tac Toe Memory Test</h1>
      <p className="subtitle">
        A brief visual memory task. You will see grids quickly and try to remember exact symbol positions.
      </p>
      <button onClick={() => navigate('/demographics')}>Begin</button>
    </div>
  );
}
