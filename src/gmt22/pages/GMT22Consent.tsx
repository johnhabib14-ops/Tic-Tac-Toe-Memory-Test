import { useGMT22State } from '../GMT22State';

export default function GMT22Consent() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1>GMT 2.2 — Research Study (Harder)</h1>
      <p className="subtitle">
        This is a visual working memory task. You will see grids with symbols and be asked to remember and reconstruct their positions. This version is more challenging.
      </p>
      <p>
        By continuing, you agree that your responses may be used for research purposes. The task takes about 10–15 minutes.
      </p>
      <button type="button" onClick={() => setPhase('demographics')}>
        I agree, continue
      </button>
    </div>
  );
}
