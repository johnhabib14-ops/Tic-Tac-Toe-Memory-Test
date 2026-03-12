import { useGMT22State } from '../GMT22State';

export default function GMT22Consent() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1>GMT 2</h1>
      <p className="subtitle">
        You&apos;ll see grids and place symbols in the same positions. By continuing, you agree your responses may be used for research.
      </p>
      <p>
        Three parts: practice (2 tries), copy task, then memory task.
      </p>
      <button type="button" onClick={() => setPhase('demographics')}>
        I agree, continue
      </button>
    </div>
  );
}
