import { useGMT22State } from '../GMT22State';

export default function GMT22Consent() {
  const { setPhase } = useGMT22State();

  return (
    <div className="page">
      <h1>GMT 2</h1>
      <p className="subtitle">
        You will see grids with symbols and reconstruct their positions. By continuing, you agree that your responses may be used for research.
      </p>
      <p>
        The task has three parts: Practice (2 trials), a copy task, then a memory task.
      </p>
      <button type="button" onClick={() => setPhase('demographics')}>
        I agree, continue
      </button>
    </div>
  );
}
