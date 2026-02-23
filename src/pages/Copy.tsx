import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppState';
import { generateTrial } from '../lib/trialGenerator';
import { scoreGrid, normalizeResponseMap } from '../lib/scoring';
import type { GridTrial, ResponseMap, CellSymbol } from '../types';
import DisplayGrid from '../components/DisplayGrid';
import ShapePalette from '../components/ShapePalette';
import ReconstructionGrid from '../components/ReconstructionGrid';

const COPY_SEED_OFFSET = 50000; // so copy grid is independent from main test

export default function Copy() {
  const navigate = useNavigate();
  const { participant, setCopyResult } = useAppState();
  const [copyGrid, setCopyGrid] = useState<GridTrial | null>(null);
  const [responseMap, setResponseMap] = useState<ResponseMap>({});
  const [selectedSymbol, setSelectedSymbol] = useState<CellSymbol | null>(null);
  const startTimeRef = useRef<number>(0);
  const responseMapRef = useRef<ResponseMap>({});
  responseMapRef.current = responseMap;

  useEffect(() => {
    if (!participant) {
      navigate('/');
      return;
    }
    // Level 20 = 4x4 full grid (16 targets) for copy task
    const config = generateTrial(20, 0, participant.sessionSeed + COPY_SEED_OFFSET);
    setCopyGrid(config.grids[0]);
    startTimeRef.current = Date.now();
  }, [participant, navigate]);

  function handlePlace(cellIndex: number, symbol: CellSymbol) {
    setResponseMap((prev) => ({ ...prev, [cellIndex]: symbol }));
  }

  function handleSubmit(e?: React.MouseEvent) {
    e?.preventDefault?.();
    if (!copyGrid || !participant) return;
    const normalized = normalizeResponseMap(responseMapRef.current, copyGrid.gridSize);
    const result = scoreGrid(
      copyGrid.targetMap,
      normalized,
      copyGrid.numTargets,
      copyGrid.gridSize
    );
    const timeMs = startTimeRef.current > 0 ? Date.now() - startTimeRef.current : 0;
    setCopyResult({ score: result.correctPlacements, timeMs });
    navigate('/instructions');
  }

  if (!participant) return null;
  if (!copyGrid) return <div className="page">Loading...</div>;

  return (
    <div className="page grid-container">
      <h2 className="grid-title">Copy the grid</h2>
      <p className="subtitle">Copy the grid below into the empty grid as fast and accurately as you can.</p>
      <p style={{ fontWeight: 600, marginBottom: 0 }}>Reference grid (copy this):</p>
      <DisplayGrid gridSize={copyGrid.gridSize} displayMap={copyGrid.displayMap} />
      <p style={{ fontWeight: 600, marginBottom: 0 }}>Your copy:</p>
      <ShapePalette
        decoysEnabled={false}
        onDragStart={() => {}}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
      />
      <ReconstructionGrid
        gridSize={copyGrid.gridSize}
        responseMap={responseMap}
        onPlace={handlePlace}
        onDrop={(cell, sym) => handlePlace(cell, sym)}
        onCellClick={(cell) => selectedSymbol && handlePlace(cell, selectedSymbol)}
      />
      <button type="button" onClick={handleSubmit} style={{ marginTop: '1rem' }}>Submit</button>
    </div>
  );
}
