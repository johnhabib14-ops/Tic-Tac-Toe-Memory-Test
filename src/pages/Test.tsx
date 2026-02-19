import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppState } from '../context/AppState';
import { NUM_LEVELS } from '../lib/levelConfig';
import { generateTrial } from '../lib/trialGenerator';
import { scoreGrid, normalizeResponseMap } from '../lib/scoring';
import type { TrialConfig, GridTrial, ResponseMap, CellSymbol, TrialRecord } from '../types';
import DisplayGrid from '../components/DisplayGrid';
import FixationCross from '../components/FixationCross';
import ShapePalette from '../components/ShapePalette';
import ReconstructionGrid from '../components/ReconstructionGrid';

type Phase = 'getReady' | 'displaying' | 'fixation' | 'reconstructing';

export default function Test() {
  const navigate = useNavigate();
  const location = useLocation();
  const { participant, addTrial } = useAppState();
  const startLevel = (location.state as { startLevel?: number } | null)?.startLevel;
  const [level, setLevel] = useState(startLevel ?? 1);
  const [trialConfig, setTrialConfig] = useState<TrialConfig | null>(null);
  const [phase, setPhase] = useState<Phase>('getReady');
  const [responseMap, setResponseMap] = useState<ResponseMap>({});
  const [reconstructionStartMs, setReconstructionStartMs] = useState<number>(0);
  const [timeLeftSec, setTimeLeftSec] = useState(120);
  const [passed, setPassed] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<CellSymbol | null>(null);
  const [hasRecordedThisTrial, setHasRecordedThisTrial] = useState(false);
  const [showNextAfterTimeout, setShowNextAfterTimeout] = useState(false);
  const responseMapRef = useRef<ResponseMap>({});
  responseMapRef.current = responseMap;
  const reconstructionStartRef = useRef(0);
  reconstructionStartRef.current = reconstructionStartMs;
  const handleNextRef = useRef<() => void>(() => {});
  const recentOutcomesRef = useRef<boolean[]>([]);

  const currentGrid: GridTrial | null = trialConfig?.grids[0] ?? null;

  // Clear location state so we don't re-use startLevel on refresh
  useEffect(() => {
    if (startLevel != null && level === startLevel) {
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [startLevel, level, location.pathname]);

  useEffect(() => {
    if (!participant) {
      navigate('/');
      return;
    }
    if (level > NUM_LEVELS) {
      navigate('/results');
      return;
    }
  }, [participant, level, navigate]);

  useEffect(() => {
    if (!participant || level > NUM_LEVELS) return;
    const config = generateTrial(level, 0, participant.sessionSeed);
    setTrialConfig(config);
    setPhase('getReady');
    setResponseMap({});
    setPassed(false);
    setHasRecordedThisTrial(false);
    setShowNextAfterTimeout(false);
  }, [level, participant?.sessionSeed]);

  useEffect(() => {
    if (!trialConfig || !currentGrid) return;
    if (phase === 'getReady') {
      const t = setTimeout(() => setPhase('displaying'), 500);
      return () => clearTimeout(t);
    }
    if (phase === 'displaying') {
      const t = setTimeout(() => setPhase('fixation'), trialConfig.displayTimeMs);
      return () => clearTimeout(t);
    }
    if (phase === 'fixation') {
      const t = setTimeout(() => {
        setPhase('reconstructing');
        setReconstructionStartMs(Date.now());
        setTimeLeftSec(Math.floor(trialConfig.reconstructionTimeLimitMs / 1000));
      }, trialConfig.delayMs);
      return () => clearTimeout(t);
    }
  }, [phase, trialConfig, currentGrid]);

  useEffect(() => {
    if (phase !== 'reconstructing' || passed || showNextAfterTimeout || !currentGrid || !participant || !trialConfig) return;
    const interval = setInterval(() => {
      setTimeLeftSec((s) => {
        if (s <= 1) {
          clearInterval(interval);
          const normalized = normalizeResponseMap(responseMapRef.current, currentGrid.gridSize);
          const result = scoreGrid(
            currentGrid.targetMap,
            normalized,
            currentGrid.numTargets,
            currentGrid.gridSize
          );
          const reactionTimeMs = reconstructionStartRef.current > 0 ? Date.now() - reconstructionStartRef.current : 0;
          const record: TrialRecord = {
            participantId: participant.id,
            level: trialConfig.level,
            trialIndex: 0,
            gridIndex: 0,
            gridSize: currentGrid.gridSize,
            numTargets: currentGrid.numTargets,
            numGrids: 1,
            displayTimeMs: trialConfig.displayTimeMs,
            delayMs: trialConfig.delayMs,
            distractorCount: Object.keys(currentGrid.displayMap).length - currentGrid.numTargets,
            targetMap: currentGrid.targetMap,
            responseMap: normalized,
            correctPlacements: result.correctPlacements,
            commissionErrors: result.commissionErrors,
            wrongShapeInTarget: result.wrongShapeInTarget,
            omissionErrors: result.omissionErrors,
            accuracyPercent: result.accuracyPercent,
            reactionTimeMs,
            trialCorrectBinary: result.trialCorrectBinary,
          };
          addTrial(record);
          recentOutcomesRef.current = [...recentOutcomesRef.current, result.trialCorrectBinary].slice(-3);
          setHasRecordedThisTrial(true);
          setPassed(result.trialCorrectBinary);
          setShowNextAfterTimeout(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, passed, showNextAfterTimeout, currentGrid, participant, trialConfig, addTrial]);

  function handlePlace(cellIndex: number, symbol: CellSymbol) {
    setResponseMap((prev) => ({ ...prev, [cellIndex]: symbol }));
  }

  function handleDrop(cellIndex: number, symbol: CellSymbol) {
    handlePlace(cellIndex, symbol);
  }

  function handleCellClick(cellIndex: number) {
    if (selectedSymbol) handlePlace(cellIndex, selectedSymbol);
  }

  function handleNextClick() {
    if (!currentGrid || !participant || !trialConfig) return;
    if (!hasRecordedThisTrial) {
      const normalized = normalizeResponseMap(responseMapRef.current, currentGrid.gridSize);
      const result = scoreGrid(
        currentGrid.targetMap,
        normalized,
        currentGrid.numTargets,
        currentGrid.gridSize
      );
      const reactionTimeMs = reconstructionStartRef.current > 0 ? Date.now() - reconstructionStartRef.current : 0;
      const record: TrialRecord = {
        participantId: participant.id,
        level: trialConfig.level,
        trialIndex: 0,
        gridIndex: 0,
        gridSize: currentGrid.gridSize,
        numTargets: currentGrid.numTargets,
        numGrids: 1,
        displayTimeMs: trialConfig.displayTimeMs,
        delayMs: trialConfig.delayMs,
        distractorCount: Object.keys(currentGrid.displayMap).length - currentGrid.numTargets,
        targetMap: currentGrid.targetMap,
        responseMap: normalized,
        correctPlacements: result.correctPlacements,
        commissionErrors: result.commissionErrors,
        wrongShapeInTarget: result.wrongShapeInTarget,
        omissionErrors: result.omissionErrors,
        accuracyPercent: result.accuracyPercent,
        reactionTimeMs,
        trialCorrectBinary: result.trialCorrectBinary,
      };
      addTrial(record);
      recentOutcomesRef.current = [...recentOutcomesRef.current, result.trialCorrectBinary].slice(-3);
      setHasRecordedThisTrial(true);
      setPassed(result.trialCorrectBinary);
      setShowNextAfterTimeout(true);
    }
    handleNextRef.current();
  }

  function handleNext() {
    if (!trialConfig || !currentGrid) return;
    const last3 = recentOutcomesRef.current;
    if (last3.length >= 3 && last3.every((o) => !o)) {
      navigate('/results');
      return;
    }
    if (level === 9) {
      navigate('/test/triangles-warning');
      return;
    }
    if (level === 18) {
      navigate('/test/big-grid-warning');
      return;
    }
    if (level >= NUM_LEVELS) {
      navigate('/results');
      return;
    }
    setLevel((l) => l + 1);
  }
  handleNextRef.current = handleNext;

  useEffect(() => {
    if (phase !== 'reconstructing' || !currentGrid || !(passed || showNextAfterTimeout)) return;
    const t = setTimeout(() => handleNextRef.current(), 400);
    return () => clearTimeout(t);
  }, [phase, passed, showNextAfterTimeout, currentGrid]);

  if (!participant) return null;
  if (level > NUM_LEVELS) return null;
  if (!trialConfig || !currentGrid) return <div className="page">Loading...</div>;

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

  if (phase === 'reconstructing') {
    return (
      <div className="page grid-container">
        <h2 className="grid-title">Rebuild the grid</h2>
        {trialConfig.responseDecoysEnabled && (
          <p className="reminder">Only X and O count. Ignore other shapes (e.g. the + symbol).</p>
        )}
        <div className="timer">Time left: {timeLeftSec}s</div>
        <ShapePalette
          decoysEnabled={trialConfig.responseDecoysEnabled}
          onDragStart={() => {}}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={setSelectedSymbol}
        />
        <ReconstructionGrid
          gridSize={currentGrid.gridSize}
          responseMap={responseMap}
          onPlace={handlePlace}
          onDrop={handleDrop}
          onCellClick={handleCellClick}
        />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
          <button type="button" onClick={handleNextClick}>Next</button>
        </div>
      </div>
    );
  }

  return null;
}
