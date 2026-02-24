import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useGMT22State } from '../GMT22State';
import type { GMT22CellSymbol, GMT22Condition, GMT22GridMap } from '../types';
import type { GMT22ItemBankEntry } from '../lib/memoryTask';
import {
  getItemForTrial,
  encodingMs,
  reconLimitMs,
  normalizeResponseMap,
  scoreTrial,
  isPassed,
} from '../lib/memoryTask';
import GMT22DisplayGrid from '../components/GMT22DisplayGrid';
import GMT22ShapePalette from '../components/GMT22ShapePalette';
import GMT22ReconstructionGrid from '../components/GMT22ReconstructionGrid';
import FixationCross from '../../components/FixationCross';
import { DELAY_FIXATION_MS, getConditionOrder } from '../types';

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
  const {
    participant,
    memoryTrials,
    addMemoryTrial,
    setPhase,
    setAttentionCheckFailed,
  } = useGMT22State();

  const [showAttentionCheck, setShowAttentionCheck] = useState(true);
  const [conditionIndex, setConditionIndex] = useState(0);
  const [span, setSpan] = useState(2);
  const [trialIndexInSpan, setTrialIndexInSpan] = useState(1 as 1 | 2);

  const [phase, setPhaseLocal] = useState<'encoding' | 'delay_fixation' | 'reconstructing'>('encoding');
  const [responseMap, setResponseMap] = useState<Record<number, GMT22CellSymbol>>({});
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [selectedSymbol, setSelectedSymbol] = useState<GMT22CellSymbol | null>(null);
  const [gridFrozen, setGridFrozen] = useState(false);
  const reconStartRef = useRef(0);
  const responseMapRef = useRef<Record<number, GMT22CellSymbol>>({});
  const alreadyRecordedRef = useRef<Record<string, boolean>>({});
  const reconTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  responseMapRef.current = responseMap;
  useEffect(() => {
    responseMapRef.current = responseMap;
  }, [responseMap]);

  useEffect(() => {
    if (phase === 'encoding') setGridFrozen(false);
  }, [phase]);

  const conditionOrder = participant ? getConditionOrder(participant.condition_order) : [];
  const condition = conditionOrder[conditionIndex];
  const currentItem: GMT22ItemBankEntry | null =
    participant && conditionIndex < conditionOrder.length && !showAttentionCheck
      ? getItemForTrial(condition, span, trialIndexInSpan, participant.session_seed)
      : null;

  const trialKey = `${conditionIndex}-${span}-${trialIndexInSpan}`;

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
  }, [currentItem, phase, trialKey]);

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
    if (reconTimeoutIdRef.current) {
      clearTimeout(reconTimeoutIdRef.current);
      reconTimeoutIdRef.current = null;
    }
    let secondsLeft = Math.floor(reconLimitMs(currentItem.span) / 1000);
    setTimeLeftSec(secondsLeft);
    let cancelled = false;
    function tick() {
      if (cancelled) return;
      secondsLeft -= 1;
      setTimeLeftSec(secondsLeft);
      if (secondsLeft <= 0) {
        if (!alreadyRecordedRef.current[trialKey]) recordTrial(true);
        return;
      }
      reconTimeoutIdRef.current = setTimeout(tick, 1000);
    }
    reconTimeoutIdRef.current = setTimeout(tick, 1000);
    return () => {
      cancelled = true;
      if (reconTimeoutIdRef.current) {
        clearTimeout(reconTimeoutIdRef.current);
        reconTimeoutIdRef.current = null;
      }
    };
  }, [currentItem, phase, trialKey]);

  function recordTrial(timeout: boolean, responseMapOverride?: Record<number, GMT22CellSymbol>) {
    if (!currentItem || !participant) return;
    const key = trialKey;
    if (alreadyRecordedRef.current[key]) return;
    alreadyRecordedRef.current[key] = true;
    const source = responseMapOverride ?? responseMapRef.current;
    const response = normalizeResponseMap(source);
    const { hits, commissions, omissions, binding_errors, total_targets, accuracy_raw } = scoreTrial(currentItem.target_map, response);
    const recon_rt_ms = reconStartRef.current > 0 ? Date.now() - reconStartRef.current : 0;
    const passed = isPassed(commissions, accuracy_raw);
    const trialPayload = {
      condition: currentItem.condition,
      span: currentItem.span,
      trial_index: trialIndexInSpan,
      item_id: currentItem.item_id,
      target_map: currentItem.target_map,
      distractor_map: currentItem.distractor_map,
      response_map: response,
      recon_rt_ms,
      hits,
      commissions,
      omissions,
      binding_errors,
      total_targets,
      accuracy_raw,
      passed,
      timeout,
    };
    flushSync(() => {
      addMemoryTrial(trialPayload);
      setResponseMap({});
    });

    if (trialIndexInSpan === 1) {
      setTrialIndexInSpan(2);
      setPhaseLocal('encoding');
      return;
    }

    const conditionTrials = [...memoryTrials, trialPayload].filter((t) => t.condition === condition && t.span === span);
    const atLeastOnePassed = conditionTrials.some((t) => t.passed);

    if (atLeastOnePassed) {
      if (span < 7) {
        setSpan(span + 1);
        setTrialIndexInSpan(1);
        setPhaseLocal('encoding');
      } else {
        const nextConditionIndex = conditionIndex + 1;
        if (nextConditionIndex >= conditionOrder.length) {
          setPhase('results');
        } else {
          setConditionIndex(nextConditionIndex);
          setSpan(2);
          setTrialIndexInSpan(1);
          setPhaseLocal('encoding');
        }
      }
      return;
    }

    const nextConditionIndex = conditionIndex + 1;
    if (nextConditionIndex >= conditionOrder.length) {
      setPhase('results');
      return;
    }
    setConditionIndex(nextConditionIndex);
    setSpan(2);
    setTrialIndexInSpan(1);
    setPhaseLocal('encoding');
  }

  function handleAttentionCheckSubmit() {
    const response = normalizeResponseMap(responseMapRef.current);
    const pass = response[0] === 'X' && response.slice(1).every((c) => c === '');
    if (!pass) setAttentionCheckFailed(true);
    setShowAttentionCheck(false);
    setResponseMap({});
    setPhaseLocal('encoding');
  }

  function handlePlace(cellIndex: number, symbol: GMT22CellSymbol) {
    setResponseMap((prev) => ({ ...prev, [cellIndex]: symbol }));
  }

  function handleSubmit() {
    if (!currentItem || phase !== 'reconstructing' || gridFrozen) return;
    const captured = { ...responseMapRef.current };
    setGridFrozen(true);
    flushSync(() => recordTrial(false, captured));
  }

  if (!participant) return null;

  if (showAttentionCheck) {
    return (
      <div className="page">
        <h2 className="grid-title">Attention check</h2>
        <p className="subtitle">
          Place X in the top left cell then press Submit.
        </p>
        <GMT22ShapePalette
          includePlus={false}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={setSelectedSymbol}
        />
        <div className="grid-container">
          <GMT22ReconstructionGrid
            responseMap={responseMap}
            onPlace={handlePlace}
            onDrop={handlePlace}
            onCellClick={(cellIndex: number) => selectedSymbol && handlePlace(cellIndex, selectedSymbol)}
            paletteIncludesPlus={false}
          />
        </div>
        <button type="button" onClick={handleAttentionCheckSubmit} className="copy-submit">
          Submit
        </button>
      </div>
    );
  }

  if (conditionIndex >= conditionOrder.length || !currentItem) {
    return (
      <div className="page">
        <p>Loading…</p>
      </div>
    );
  }

  if (phase === 'encoding') {
    const displayMap = getEncodingDisplayMap(currentItem);
    const cond = currentItem.condition;
    const encodingInstruction =
      cond === 'ignore_distractor' ? 'Ignore the plus signs.' :
      cond === 'remember_distractor' ? 'Remember the plus signs.' :
      'Place the symbols you saw.';
    return (
      <div className="page">
        <h2 className="grid-title">Remember the grid</h2>
        <p className="subtitle">{encodingInstruction}</p>
        <div className="grid-container" style={{ pointerEvents: 'none' }} aria-hidden="false">
          <GMT22DisplayGrid gridMap={displayMap} />
        </div>
      </div>
    );
  }

  if (phase === 'delay_fixation') {
    return (
      <div className="page">
        <FixationCross />
        <p className="subtitle" style={{ marginTop: '1rem' }}>
          Brief pause — then you will place the symbols.
        </p>
      </div>
    );
  }

  const includePlus = paletteIncludesPlus(currentItem.condition);
  const disabled = gridFrozen;
  return (
    <div className="page">
      <h2 className="grid-title">Reconstruct the grid</h2>
      <p className="subtitle">
        Place the symbols you saw. Time left: {timeLeftSec}s
      </p>
      <GMT22ShapePalette
        includePlus={includePlus}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={disabled ? () => {} : setSelectedSymbol}
      />
      <div className="grid-container">
        <GMT22ReconstructionGrid
          responseMap={responseMap}
          onPlace={disabled ? () => {} : handlePlace}
          onDrop={disabled ? () => {} : handlePlace}
          onCellClick={disabled ? () => {} : (cellIndex: number) => selectedSymbol && handlePlace(cellIndex, selectedSymbol)}
          paletteIncludesPlus={includePlus}
        />
      </div>
      <button type="button" onClick={handleSubmit} className="copy-submit" disabled={disabled}>
        Submit
      </button>
    </div>
  );
}
