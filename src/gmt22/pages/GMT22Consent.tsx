import { useGMT22State } from '../GMT22State';

export default function GMT22Consent() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1 className="game-title">Grid Memory</h1>
      <p className="subtitle">
        You&apos;ll see grids and place symbols in the same positions. By continuing, you agree your responses may be used for research.
      </p>
      <p>
        Quick warm up, then memory rounds.
      </p>
      <button type="button" onClick={() => setPhase('demographics')}>
        I&apos;m in
      </button>
    </div>
  );
}
