import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppState';

export default function Instructions() {
  const navigate = useNavigate();
  const { practiceMode, setPracticeMode } = useAppState();

  function handleBegin() {
    if (practiceMode) {
      navigate('/practice');
    } else {
      navigate('/test');
    }
  }

  return (
    <div className="page">
      <h1>Instructions</h1>
      <div className="instructions">
        <ul>
          <li>You will see a grid with X and O (and sometimes other shapes to ignore).</li>
          <li>Remember the exact positions of X and O.</li>
          <li>The grid will disappear. Then you will rebuild the grid from memory.</li>
          <li>Place shapes from the <strong>palette</strong> into the grid (drag or tap shape then tap cell).</li>
          <li>Only X and O count. Ignore other shapes.</li>
          <li>Some trials will show two grids one after another. You must remember both in order.</li>
          <li>Work as quickly and accurately as you can. Guess if you are unsure.</li>
        </ul>
      </div>
      <div className="toggle-row">
        <input
          type="checkbox"
          id="practice"
          checked={practiceMode}
          onChange={(e) => setPracticeMode(e.target.checked)}
        />
        <label htmlFor="practice">Practice trials (recommended)</label>
      </div>
      <button onClick={handleBegin}>Begin</button>
    </div>
  );
}
