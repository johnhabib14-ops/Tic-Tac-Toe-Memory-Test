import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1>Grid Memory Test (GMT)</h1>
      <p className="subtitle">
        A brief visual memory task. You will see grids quickly and try to remember exact symbol positions.
      </p>
      <button onClick={() => navigate('/demographics')}>Begin</button>
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button
          type="button"
          className="secondary"
          onClick={() => navigate('/gmt2')}
        >
          Start GMT 2.1 (research version)
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => navigate('/gmt22')}
        >
          Start GMT 2.2 (harder research version)
        </button>
      </div>
    </div>
  );
}
