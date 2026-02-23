import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DisplayGrid from '../components/DisplayGrid';
import type { DisplayMap } from '../types';

function buildRandomExampleMap(): DisplayMap {
  const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const count = 5 + Math.floor(Math.random() * 3); // 5–7 cells
  const shuffled = [...cells].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, count);
  const map: DisplayMap = {};
  chosen.forEach((i) => {
    map[i] = { type: Math.random() < 0.5 ? 'X' : 'O' };
  });
  return map;
}

export default function Instructions() {
  const navigate = useNavigate();
  const [exampleDisplayMap, setExampleDisplayMap] = useState<DisplayMap>({});

  useEffect(() => {
    setExampleDisplayMap(buildRandomExampleMap());
  }, []);

  function handleBegin() {
    navigate('/practice');
  }

  return (
    <div className="page">
      <h1>Instructions</h1>
      <div className="instructions">
        <ul>
          <li>You will see a grid with X and O (and sometimes other shapes to ignore).</li>
          <li>Remember the exact positions of X and O.</li>
          <li>The grid will disappear. Then you will rebuild the grid from memory.</li>
          <li>Tap a shape in the <strong>palette</strong>, then tap a cell in the grid to place it.</li>
          <li>Only X and O count. Ignore other shapes.</li>
          <li>Work as quickly and accurately as you can. Guess if you are unsure.</li>
          <li>Later you will also do a quick copy task: copy a grid into an empty grid as fast as you can.</li>
        </ul>
      </div>
      <p style={{ marginBottom: '0.5rem' }}>Here&apos;s an example of a grid you might see:</p>
      <div className="grid-container" style={{ marginBottom: '1.5rem' }}>
        <DisplayGrid gridSize={4} displayMap={exampleDisplayMap} />
      </div>
      <button onClick={handleBegin}>Begin</button>
    </div>
  );
}
