import { useEffect, useRef, useState, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useGMT22State } from '../GMT22State';
import type { GMT22CellSymbol, GMT22Condition, GMT22GridMap } from '../types';
import type { GMT22ItemBankEntry } from '../lib/memoryTask';
import {
  getTrialsForSession,
  encodingMs,
  reconLimitMs,
  normalizeResponseMap,
  scoreTrial,
} from '../lib/memoryTask';
import GMT22DisplayGrid from '../components/GMT22DisplayGrid';
import GMT22ShapePalette from '../components/GMT22ShapePalette';
import GMT22ReconstructionGrid from '../components/GMT22ReconstructionGrid';
import FixationCross from '../../components/FixationCross';
import { DELAY_FIXATION_MS } from '../types';

/** Encoding display: ignore_distractor = target + distractor; else target only (remember has Plus in target_map). */
function getEncodingDisplayMap(item: GMT22ItemBankEntry): GMT22GridMap {
  const out: GMT22GridMap = [];
  for (let i = 0; i < 16; i++) {
    const t = item.target_map[i] || '';
    const d = item.distractor_map[i] || '';
    out.push(d === 'Plus' ? 'Plus' : t);
  }
  return out;
}

function paletteIncludesPlus(condition: GMT22Condition): boolean {
  return condition === 'remember_distractor';
}

export default function GMT22Memory() {
  const { participant, addMemoryTrial, setPhase } = useGMT22State();
  const trials = useMemo(
    () => (participant ? getTrialsForSession(participant.session_seed) : []),
    [participant]
  );
  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhaseLocal] = useState<'encoding' | 'delay_fixation' | 'reconstructing'>('encoding');
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

  const currentItem: GMT22ItemBankEntry | null = trials[trialIndex] ?? null;
  const isLastTrial = trialIndex >= trials.length - 1;

  useEffect(() => {
    if (!currentItem || phase !== 'encoding') return;
    const ms = encodingMs(currentItem.span);
    const t = setTimeout(() => {
      if (currentItem.condition === 'delay') {
        setPhaseLocal('delay_fixation');
      } else {
        setPhaseLocal('reconstructing');
        reconStartRef.current = Date.now();
        setTimeLeftSec(Math.floor(reconLimitMs(currentItem.span) / 1000));
      }
    }, ms);
    return () => clearTimeout(t);
  }, [currentItem, phase, trialIndex]);

  useEffect(() => {
    if (!currentItem || phase !== 'delay_fixation') return;
    const t = setTimeout(() => {
      setPhaseLocal('reconstructing');
      reconStartRef.current = Date.now();
      setTimeLeftSec(Math.floor(reconLimitMs(currentItem.span) / 1000));
    }, DELAY_FIXATION_MS);
    return () => clearTimeout(t);
  }, [currentItem, phase]);

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
    const { hits, commissions, accuracy_raw } = scoreTrial(currentItem.target_map, response);
    const recon_rt_ms = reconStartRef.current > 0 ? Date.now() - reconStartRef.current : 0;
    const clean_trial = commissions === 0;
    const trialPayload = {
      condition: currentItem.condition,
      span: currentItem.span,
      target_map: currentItem.target_map,
      response_map: response,
      recon_rt_ms,
      hits,
      commissions,
      accuracy_raw,
      timeout,
      clean_trial,
    };
    const last = isLastTrial;
    flushSync(() => {
      addMemoryTrial(trialPayload);
      setResponseMap({});
      if (last) {
        setPhase('results');
      } else {
        setTrialIndex((i) => i + 1);
        setPhaseLocal('encoding');
      }
    });
  }

  function handlePlace(cellIndex: number, symbol: GMT22CellSymbol) {
    setResponseMap((prev) => ({ ...prev, [cellIndex]: symbol }));
  }

  function handleSubmit() {
    if (!currentItem || phase !== 'reconstructing') return;
    flushSync(() => recordTrial(false, responseMap));
  }

  if (!participant || trials.length === 0) return null;

  if (!currentItem) {
    return (
      <div className="page">
        <p>Loading…</p>
      </div>
    );
  }

  if (phase === 'encoding') {
    const displayMap = getEncodingDisplayMap(currentItem);
    const encodingSubtitle =
      currentItem.condition === 'ignore_distractor'
        ? 'Remember only the X and O positions. Ignore the + symbols.'
        : currentItem.condition === 'remember_distractor'
          ? 'Remember the positions of X, O, and +.'
          : 'Watch the positions carefully.';
    return (
      <div className="page">
        <h2 className="grid-title">Remember the grid</h2>
        <p className="subtitle">{encodingSubtitle}</p>
        <div className="grid-container">
          <GMT22DisplayGrid gridMap={displayMap} />
        </div>
      </div>
    );
  }

  if (phase === 'delay_fixation') {
    return (
      <div className="page">
        <FixationCross />
      </div>
    );
  }

  const includePlus = paletteIncludesPlus(currentItem.condition);
  return (
    <div className="page">
      <h2 className="grid-title">Reconstruct the grid</h2>
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
