import { useGMT2State } from '../GMT2State';

export default function GMT2Consent() {
  const { setPhase } = useGMT2State();

  return (
    <div className="page">
      <h1>GMT 2.1</h1>
      <p className="subtitle">
        This is a short visual working memory task. You will see grids with symbols and be asked to remember and reconstruct their positions.
      </p>
      <p>
        By continuing, you agree that your responses may be used for research purposes. The task takes about 8–12 minutes.
      </p>
      <button type="button" onClick={() => setPhase('demographics')}>
        I agree, continue
      </button>
    </div>
  );
}
