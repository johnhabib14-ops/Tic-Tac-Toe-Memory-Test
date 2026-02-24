import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1>Grid Memory Test (GMT)</h1>
      <p className="subtitle">
        A brief visual memory task. You will see grids quickly and try to remember exact symbol positions.
      </p>
      <button onClick={() => navigate('/demographics')}>Begin game</button>
      <button
        type="button"
        className="secondary"
        style={{ marginTop: '1rem' }}
        onClick={() => navigate('/gmt2')}
      >
        GMT 2
      </button>
    </div>
  );
}
