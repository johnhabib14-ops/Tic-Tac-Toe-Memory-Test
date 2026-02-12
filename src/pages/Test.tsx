import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppState';
import { NUM_LEVELS } from '../lib/levelConfig';
import { generateTrial } from '../lib/trialGenerator';
import { scoreGrid, normalizeResponseMap } from '../lib/scoring';
import type { TrialConfig, GridTrial, ResponseMap, CellSymbol, TrialRecord } from '../types';
import DisplayGrid from '../components/DisplayGrid';
import FixationCross from '../components/FixationCross';
import ShapePalette from '../components/ShapePalette';
import ReconstructionGrid from '../components/ReconstructionGrid';

type Phase =
  | 'getReady'
  | 'displaying'
  | 'interGridBlank'
  | 'fixation'
  | 'reconstructing';

export default function Test() {
  const navigate = useNavigate();
  const { participant, addTrial } = useAppState();
  const [level, setLevel] = useState(1);
  const [trialIndex, setTrialIndex] = useState(0);
  const [trialConfig, setTrialConfig] = useState<TrialConfig | null>(null);
  const [gridIndex, setGridIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('getReady');
  const [responseMap, setResponseMap] = useState<ResponseMap>({});
  const [reconstructionStartMs, setReconstructionStartMs] = useState<number>(0);
  const [timeLeftSec, setTimeLeftSec] = useState(120);
  const [passed, setPassed] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<CellSymbol | null>(null);
  const [trialOutcomes, setTrialOutcomes] = useState<boolean[]>([]); // perfect or not per trial (for discontinue)
  const [currentTrialGridResults, setCurrentTrialGridResults] = useState<boolean[]>([]); // per-grid pass for current trial
  const [hasRecordedThisGrid, setHasRecordedThisGrid] = useState(false);
  const [showNextAfterTimeout, setShowNextAfterTimeout] = useState(false);
  const responseMapRef = useRef<ResponseMap>({});
  responseMapRef.current = responseMap;
  const reconstructionStartRef = useRef(0);
  reconstructionStartRef.current = reconstructionStartMs;
  const handleNextRef = useRef<() => void>(() => {});

  const currentGrid: GridTrial | null =
    trialConfig && trialConfig.grids[gridIndex] ? trialConfig.grids[gridIndex] : null;
  const isTwoGrids = trialConfig ? trialConfig.grids.length > 1 : false;

  // Redirect if no participant
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

  // Generate trial when level/trialIndex changes
  useEffect(() => {
    if (!participant || level > NUM_LEVELS) return;
    const config = generateTrial(level, trialIndex, participant.sessionSeed);
    setTrialConfig(config);
    setGridIndex(0);
    setPhase('getReady');
    setResponseMap({});
    setPassed(false);
    setCurrentTrialGridResults([]);
    setHasRecordedThisGrid(false);
    setShowNextAfterTimeout(false);
  }, [level, trialIndex, participant?.sessionSeed]);

  // Phase timers: getReady 500ms -> display -> interGrid blank -> fixation -> reconstructing
  useEffect(() => {
    if (!trialConfig || !currentGrid) return;
    if (phase === 'getReady') {
      const t = setTimeout(() => setPhase('displaying'), 500);
      return () => clearTimeout(t);
    }
    if (phase === 'displaying') {
      const t = setTimeout(() => {
        if (gridIndex < trialConfig.grids.length - 1) {
          setPhase('interGridBlank');
        } else {
          setPhase('fixation');
        }
      }, trialConfig.displayTimeMs);
      return () => clearTimeout(t);
    }
    if (phase === 'interGridBlank') {
      const t = setTimeout(() => {
        setGridIndex((i) => i + 1);
        setPhase('displaying');
      }, trialConfig.interGridBlankMs);
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
  }, [phase, trialConfig, currentGrid, gridIndex]);

  // 2-minute countdown during reconstruction; on timeout submit with latest responseMap
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
            trialIndex: trialConfig.trialIndex,
            gridIndex,
            gridSize: currentGrid.gridSize,
            numTargets: currentGrid.numTargets,
            numGrids: trialConfig.grids.length,
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
          setCurrentTrialGridResults((prev) => {
            const next = [...prev];
            next[gridIndex] = result.trialCorrectBinary;
            return next;
          });
          setHasRecordedThisGrid(true);
          setPassed(result.trialCorrectBinary);
          setShowNextAfterTimeout(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, passed, showNextAfterTimeout, currentGrid, participant, trialConfig, gridIndex, addTrial]);

  function handlePlace(cellIndex: number, symbol: CellSymbol) {
    setResponseMap((prev) => ({ ...prev, [cellIndex]: symbol }));
  }

  function handleDrop(cellIndex: number, symbol: CellSymbol) {
    handlePlace(cellIndex, symbol);
  }

  function handleCellClick(cellIndex: number) {
    if (selectedSymbol) {
      handlePlace(cellIndex, selectedSymbol);
    }
  }

  function handleSubmit(e?: React.MouseEvent) {
    e?.preventDefault?.();
    if (!currentGrid || !participant || !trialConfig) return;
    const latestResponse = responseMapRef.current;
    const normalized = normalizeResponseMap(latestResponse, currentGrid.gridSize);
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
      trialIndex: trialConfig.trialIndex,
      gridIndex,
      gridSize: currentGrid.gridSize,
      numTargets: currentGrid.numTargets,
      numGrids: trialConfig.grids.length,
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
    if (!hasRecordedThisGrid) {
      addTrial(record);
      setCurrentTrialGridResults((prev) => {
        const next = [...prev];
        next[gridIndex] = result.trialCorrectBinary;
        return next;
      });
      setHasRecordedThisGrid(true);
    } else {
      setCurrentTrialGridResults((prev) => {
        const next = [...prev];
        next[gridIndex] = result.trialCorrectBinary;
        return next;
      });
    }
    setPassed(result.trialCorrectBinary);
    setShowNextAfterTimeout(true);
  }

  function handleNext() {
    if (!trialConfig || !currentGrid) return;
    if (gridIndex < trialConfig.grids.length - 1) {
      setGridIndex((i) => i + 1);
      setPhase('reconstructing');
      setResponseMap({});
      setPassed(false);
      setShowNextAfterTimeout(false);
      setReconstructionStartMs(Date.now());
      setTimeLeftSec(Math.floor(trialConfig.reconstructionTimeLimitMs / 1000));
      setHasRecordedThisGrid(false);
    } else {
      const trialPerfect = currentTrialGridResults.length > 0 && currentTrialGridResults.every(Boolean);
      const newOutcomes = [...trialOutcomes, trialPerfect];
      setTrialOutcomes(newOutcomes);

      if (newOutcomes.length >= 3) {
        const last3 = newOutcomes.slice(-3);
        if (last3.every((o) => !o)) {
          navigate('/results');
          return;
        }
      }

      if (trialIndex < 1) {
        setTrialIndex(1);
      } else {
        setTrialIndex(0);
        setLevel((l) => l + 1);
      }
      if (level > NUM_LEVELS) {
        navigate('/results');
      }
    }
  }
  handleNextRef.current = handleNext;

  // Auto-advance shortly after submit or timeout so user goes to next item right away
  useEffect(() => {
    if (phase !== 'reconstructing' || !currentGrid || !(passed || showNextAfterTimeout)) return;
    const t = setTimeout(() => {
      handleNextRef.current();
    }, 400);
    return () => clearTimeout(t);
  }, [phase, passed, showNextAfterTimeout, currentGrid]);

  if (!participant) return null;
  if (level > NUM_LEVELS) return null;

  if (!trialConfig || !currentGrid) {
    return <div className="page">Loading...</div>;
  }

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

  if (phase === 'interGridBlank') {
    return <div className="page" />;
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
        <h2 className="grid-title">
          Rebuild the grid
          {isTwoGrids ? ` (Grid ${gridIndex + 1} of 2)` : ''}
        </h2>
        {trialConfig.responseDecoysEnabled && (
          <p className="reminder">Only X and O count. Ignore other shapes.</p>
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
          <button type="button" onClick={(e) => handleSubmit(e)}>Submit</button>
        </div>
      </div>
    );
  }

  return null;
}
