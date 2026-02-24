import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useGMT22State } from '../GMT22State';
import type { GMT22CellSymbol, GMT22GridMap } from '../types';
import type { GMT22ItemBankEntry } from '../lib/memoryTask';
import {
  getPracticeItems,
  encodingMs,
  reconLimitMs,
  normalizeResponseMap,
  scoreTrial,
  isPassed,
  isNearPassed,
} from '../lib/memoryTask';
import GMT22DisplayGrid from '../components/GMT22DisplayGrid';
import GMT22ShapePalette from '../components/GMT22ShapePalette';
import GMT22ReconstructionGrid from '../components/GMT22ReconstructionGrid';

function getEncodingDisplayMap(item: GMT22ItemBankEntry): GMT22GridMap {
  const out: GMT22GridMap = [];
  for (let i = 0; i < 16; i++) {
    const t = item.target_map[i] || '';
    const d = item.distractor_map[i] || '';
    out.push(d === 'Plus' ? 'Plus' : t);
  }
  return out;
}

function paletteIncludesPlus(condition: string): boolean {
  return condition === 'remember_distractor';
}

export default function GMT22Practice() {
  const {
    participant,
    setPhase,
    setPracticeTrials,
    practiceTrials,
    setPracticeFailed,
    setPracticePassedFirstTry,
  } = useGMT22State();

  const [showIntro, setShowIntro] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [showClarification, setShowClarification] = useState(false);
  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhaseLocal] = useState<'encoding' | 'reconstructing'>('encoding');
  const [responseMap, setResponseMap] = useState<Record<number, GMT22CellSymbol>>({});
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [selectedSymbol, setSelectedSymbol] = useState<GMT22CellSymbol | null>(null);
  const reconStartRef = useRef(0);
  const responseMapRef = useRef<Record<number, GMT22CellSymbol>>({});
  const recordedForTrialRef = useRef(-1);

  responseMapRef.current = responseMap;
  useEffect(() => {
    responseMapRef.current = responseMap;
  }, [responseMap]);

  const items: GMT22ItemBankEntry[] =
    participant && retryCount <= 1
      ? getPracticeItems(participant.session_seed)
      : [];
  const currentItem: GMT22ItemBankEntry | null = items[trialIndex] ?? null;

  useEffect(() => {
    if (!currentItem || phase !== 'encoding') return;
    const ms = encodingMs(currentItem.span);
    const t = setTimeout(() => {
      setPhaseLocal('reconstructing');
      reconStartRef.current = Date.now();
      setTimeLeftSec(Math.floor(reconLimitMs(currentItem.span) / 1000));
    }, ms);
    return () => clearTimeout(t);
  }, [currentItem, phase, trialIndex]);

  useEffect(() => {
    if (!currentItem || phase !== 'reconstructing') return;
    let secondsLeft = Math.floor(reconLimitMs(currentItem.span) / 1000);
    setTimeLeftSec(secondsLeft);
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    function tick() {
      if (cancelled) return;
      secondsLeft -= 1;
      setTimeLeftSec(secondsLeft);
      if (secondsLeft <= 0) {
        if (recordedForTrialRef.current !== trialIndex) recordTrial(true);
        return;
      }
      timeoutId = setTimeout(tick, 1000);
    }
    timeoutId = setTimeout(tick, 1000);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [currentItem, phase, trialIndex]);

  function recordTrial(timeout: boolean, responseMapOverride?: Record<number, GMT22CellSymbol>) {
    if (!currentItem || !participant) return;
    if (recordedForTrialRef.current === trialIndex) return;
    recordedForTrialRef.current = trialIndex;
    const source = responseMapOverride ?? responseMapRef.current;
    const response = normalizeResponseMap(source);
    const { hits, commissions, total_targets, accuracy_raw } = scoreTrial(currentItem.target_map, response);
    const recon_rt_ms = reconStartRef.current > 0 ? Date.now() - reconStartRef.current : 0;
    const passed = isPassed(commissions, accuracy_raw);
    const near_passed = isNearPassed(accuracy_raw);
    const trialPayload = {
      condition: currentItem.condition,
      span: currentItem.span,
      trial_index: (trialIndex + 1) as 1 | 2,
      item_id: currentItem.item_id,
      target_map: currentItem.target_map,
      distractor_map: currentItem.distractor_map,
      response_map: response,
      recon_rt_ms,
      hits,
      commissions,
      total_targets,
      accuracy_raw,
      passed,
      near_passed,
      timeout,
    };
    const nextTrials = [...practiceTrials, trialPayload];
    flushSync(() => {
      setPracticeTrials(nextTrials);
      setResponseMap({});
    });

    if (trialIndex < items.length - 1) {
      setTrialIndex(trialIndex + 1);
      setPhaseLocal('encoding');
      return;
    }

    const atLeastOnePassed = nextTrials.some((t) => t.passed);
    if (atLeastOnePassed) {
      setPracticePassedFirstTry(retryCount === 0);
      setPhase('copy_instructions');
      return;
    }
    if (retryCount === 0) {
      setShowClarification(true);
      return;
    }
    setPracticePassedFirstTry(false);
    setPracticeFailed(true);
    setPhase('copy_instructions');
  }

  function handlePlace(cellIndex: number, symbol: GMT22CellSymbol) {
    setResponseMap((prev) => ({ ...prev, [cellIndex]: symbol }));
  }

  function handleSubmit() {
    if (!currentItem || phase !== 'reconstructing') return;
    flushSync(() => recordTrial(false, responseMap));
  }

  function handleTryAgain() {
    setShowClarification(false);
    setRetryCount(1);
    setShowIntro(false);
    setPracticeTrials([]);
    setTrialIndex(0);
    setPhaseLocal('encoding');
    setResponseMap({});
    recordedForTrialRef.current = -1;
  }

  if (!participant) return null;

  if (showIntro) {
    return (
      <div className="page">
        <h1>Practice (2 trials)</h1>
        <p className="subtitle">
          You will see a grid with symbols. It will disappear, then you place the same symbols in the same positions in the empty grid.
        </p>
        <p>
          First trial: only X and O. Second trial: you may see + symbols on the grid — only place X and O and ignore the +. You have a time limit to place your answers. Select a symbol from the palette, then click a cell to place it.
        </p>
        <button type="button" onClick={() => setShowIntro(false)}>
          Start practice
        </button>
      </div>
    );
  }

  if (showClarification) {
    return (
      <div className="page">
        <h1>Practice</h1>
        <p className="subtitle">
          Both practice trials were incorrect. Remember: place symbols in the exact positions you saw. You need 85% or more correct with no extra symbols to pass a trial.
        </p>
        <p>
          Select X or O from the palette, then click a cell to place it. Only place symbols where you saw them.
        </p>
        <button type="button" onClick={handleTryAgain}>
          Try again
        </button>
      </div>
    );
  }

  if (items.length === 0 || !currentItem) {
    return (
      <div className="page">
        <p>Loading…</p>
      </div>
    );
  }

  if (phase === 'encoding') {
    const displayMap = getEncodingDisplayMap(currentItem);
    const instructionStyle = { color: 'red' as const, fontWeight: 'bold' as const };
    return (
      <div className="page">
        <h2 className="grid-title">Practice — Remember the grid</h2>
        <p className="subtitle">
          {currentItem.condition === 'ignore_distractor' && (
            <>Remember only the X and O positions. <span style={instructionStyle}>Ignore the + symbols.</span></>
          )}
          {currentItem.condition === 'baseline' && 'Watch the positions carefully.'}
        </p>
        <div className="grid-container">
          <GMT22DisplayGrid gridMap={displayMap} />
        </div>
      </div>
    );
  }

  const includePlus = paletteIncludesPlus(currentItem.condition);
  return (
    <div className="page">
      <h2 className="grid-title">Practice — Reconstruct the grid</h2>
      <p className="subtitle">
        Place the symbols in the correct positions. Time left: {timeLeftSec}s
      </p>
      <GMT22ShapePalette
        includePlus={includePlus}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
      />
      <div className="grid-container">
        <GMT22ReconstructionGrid
          responseMap={responseMap}
          onPlace={handlePlace}
          onDrop={handlePlace}
          onCellClick={(cellIndex: number) => selectedSymbol && handlePlace(cellIndex, selectedSymbol)}
          paletteIncludesPlus={includePlus}
        />
      </div>
      <button type="button" onClick={handleSubmit} className="copy-submit">
        Submit
      </button>
    </div>
  );
}
