/** Neutral fixation marker (dot). Avoids using + which is a task symbol in the grid. */
export default function FixationCross() {
  return <div className="fixation" aria-hidden="true">&#8226;</div>;
}
