import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppState';
import type { GridTrial, ResponseMap, CellSymbol } from '../types';
import { scoreGrid, normalizeResponseMap } from '../lib/scoring';
import DisplayGrid from '../components/DisplayGrid';
import FixationCross from '../components/FixationCross';
import ShapePalette from '../components/ShapePalette';
import ReconstructionGrid from '../components/ReconstructionGrid';

const PRACTICE_TRIALS: { displayMs: number; delayMs: number; grid: GridTrial }[] = [
  {
    displayMs: 2000,
    delayMs: 0,
    grid: {
      gridSize: 4,
      numTargets: 1,
      targetMap: { 7: 'X' },
      displayMap: { 7: { type: 'X' } },
    },
  },
  {
    displayMs: 2000,
    delayMs: 0,
    grid: {
      gridSize: 4,
      numTargets: 2,
      targetMap: { 2: 'X', 13: 'O' },
      displayMap: { 2: { type: 'X' }, 13: { type: 'O' } },
    },
  },
];

type Phase = 'getReady' | 'displaying' | 'fixation' | 'reconstructing';

export default function Practice() {
  const navigate = useNavigate();
  const { participant } = useAppState();
  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('getReady');
  const [responseMap, setResponseMap] = useState<ResponseMap>({});
  const [selectedSymbol, setSelectedSymbol] = useState<CellSymbol | null>(null);
  const [bothPassed, setBothPassed] = useState(false);
  const [showTryAgain, setShowTryAgain] = useState(false);

  const config = PRACTICE_TRIALS[trialIndex];
  const currentGrid = config?.grid ?? null;

  useEffect(() => {
    if (!participant) {
      navigate('/');
      return;
    }
  }, [participant, navigate]);

  useEffect(() => {
    if (!config) return;
    setPhase('getReady');
    setResponseMap({});
  }, [trialIndex]);

  useEffect(() => {
    if (!config || !currentGrid) return;
    if (phase === 'getReady') {
      const t = setTimeout(() => setPhase('displaying'), 500);
      return () => clearTimeout(t);
    }
    if (phase === 'displaying') {
      const t = setTimeout(() => setPhase('fixation'), config.displayMs);
      return () => clearTimeout(t);
    }
    if (phase === 'fixation') {
      const t = setTimeout(() => setPhase('reconstructing'), config.delayMs || 500);
      return () => clearTimeout(t);
    }
  }, [phase, config]);

  function handlePlace(cellIndex: number, symbol: CellSymbol) {
    setResponseMap((prev) => ({ ...prev, [cellIndex]: symbol }));
  }

  function handleNextClick() {
    if (!currentGrid) return;
    const normalized = normalizeResponseMap(responseMap, currentGrid.gridSize);
    const result = scoreGrid(
      currentGrid.targetMap,
      normalized,
      currentGrid.numTargets,
      currentGrid.gridSize
    );
    if (!result.trialCorrectBinary) {
      setShowTryAgain(true);
      return;
    }
    if (trialIndex === 0) {
      setTrialIndex(1);
      setShowTryAgain(false);
    } else {
      setBothPassed(true);
    }
  }

  function handleTryAgain() {
    setTrialIndex(0);
    setShowTryAgain(false);
    setResponseMap({});
    setPhase('getReady');
  }

  if (!participant) return null;

  if (showTryAgain) {
    return (
      <div className="page">
        <h2>Practice</h2>
        <p>You need to pass both practice trials to continue. Please try again.</p>
        <button onClick={handleTryAgain}>Try again</button>
      </div>
    );
  }

  if (bothPassed) {
    return (
      <div className="page">
        <h2>Practice complete. The test will now begin.</h2>
        <button onClick={() => navigate('/test')}>Start Test</button>
      </div>
    );
  }

  if (!config || !currentGrid) return null;

  if (phase === 'getReady') {
    return (
      <div className="page">
        <div className="get-ready">Get ready</div>
      </div>
    );
  }

  if (phase === 'displaying') {
    return (
      <div className="page grid-container">
        <DisplayGrid gridSize={currentGrid.gridSize} displayMap={currentGrid.displayMap} />
      </div>
    );
  }

  if (phase === 'fixation') {
    return (
      <div className="page">
        <FixationCross />
      </div>
    );
  }

  return (
    <div className="page grid-container">
      <h2 className="grid-title">Rebuild the grid (Practice)</h2>
      <ShapePalette
        decoysEnabled={false}
        onDragStart={() => {}}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
      />
      <ReconstructionGrid
        gridSize={currentGrid.gridSize}
        responseMap={responseMap}
        onPlace={handlePlace}
        onDrop={(cell, sym) => handlePlace(cell, sym)}
        onCellClick={(cell) => selectedSymbol && handlePlace(cell, selectedSymbol)}
      />
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
        <button type="button" onClick={handleNextClick}>
          {trialIndex === 0 ? 'Next' : 'Finish practice'}
        </button>
      </div>
    </div>
  );
}
