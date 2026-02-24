import { useEffect, useRef, useState, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useGMT2State } from '../GMT2State';
import type { GMT2CellSymbol, GMT2Condition, GMT2GridMap } from '../types';
import type { GMT2ItemBankEntry } from '../lib/memoryTask';
import {
  getTrialsForSession,
  encodingMs,
  reconLimitMs,
  normalizeResponseMap,
  scoreTrial,
} from '../lib/memoryTask';
import GMT2DisplayGrid from '../components/GMT2DisplayGrid';
import GMT2ShapePalette from '../components/GMT2ShapePalette';
import GMT2ReconstructionGrid from '../components/GMT2ReconstructionGrid';
import FixationCross from '../../components/FixationCross';
import { pushDebugLog } from '../../lib/debugLog';

const DELAY_FIXATION_MS = 4000;

/** Build encoding display map: for ignore_distractor merge target + distractor; else target only. */
function getEncodingDisplayMap(item: GMT2ItemBankEntry): GMT2GridMap {
  const out: GMT2GridMap = [];
  for (let i = 0; i < 16; i++) {
    const t = item.target_map[i] || '';
    const d = item.distractor_map[i] || '';
    out.push(d === 'Plus' ? 'Plus' : t);
  }
  return out;
}

/** Palette includes Plus only for remember_distractor. */
function paletteIncludesPlus(condition: GMT2Condition): boolean {
  return condition === 'remember_distractor';
}

export default function GMT2Memory() {
  const { participant, addMemoryTrial, setPhase } = useGMT2State();
  const trials = useMemo(
    () => (participant ? getTrialsForSession(participant.session_seed) : []),
    [participant]
  );
  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhaseLocal] = useState<'encoding' | 'delay_fixation' | 'reconstructing'>(
    'encoding'
  );
  const [responseMap, setResponseMap] = useState<Record<number, GMT2CellSymbol>>({});
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [selectedSymbol, setSelectedSymbol] = useState<GMT2CellSymbol | null>(null);
  const reconStartRef = useRef(0);
  const responseMapRef = useRef<Record<number, GMT2CellSymbol>>({});
  const recordedForTrialRef = useRef(-1);
  responseMapRef.current = responseMap;

  const currentItem: GMT2ItemBankEntry | null = trials[trialIndex] ?? null;
  const isLastTrial = trialIndex >= trials.length - 1;

  // Encoding phase: show grid then advance after encodingMs(span)
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

  // Delay fixation: 4000 ms then reconstruction
  useEffect(() => {
    if (!currentItem || phase !== 'delay_fixation') return;
    const t = setTimeout(() => {
      setPhaseLocal('reconstructing');
      reconStartRef.current = Date.now();
      setTimeLeftSec(Math.floor(reconLimitMs(currentItem.span) / 1000));
    }, DELAY_FIXATION_MS);
    return () => clearTimeout(t);
  }, [currentItem, phase]);

  // Reconstruction countdown via recursive setTimeout (logic at 0 runs in callback, not in setState updater)
  useEffect(() => {
    if (!currentItem || phase !== 'reconstructing') return;
    // #region agent log
    const _p1 = { sessionId: 'b9aa2a', location: 'GMT2Memory.tsx:reconEffect', message: 'recon interval started', data: { trialIndex, condition: currentItem?.condition, span: currentItem?.span }, timestamp: Date.now(), hypothesisId: 'H1' };
    pushDebugLog(_p1);
    fetch('http://127.0.0.1:7618/ingest/d02cffea-2b2e-4a1e-93c8-0016355962bd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b9aa2a'},body:JSON.stringify(_p1)}).catch(()=>{});
    // #endregion
    let secondsLeft = Math.floor(reconLimitMs(currentItem.span) / 1000);
    setTimeLeftSec(secondsLeft);
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    function tick() {
      if (cancelled) return;
      secondsLeft -= 1;
      setTimeLeftSec(secondsLeft);
      if (secondsLeft <= 0) {
        const willCall = recordedForTrialRef.current !== trialIndex;
        const _p2 = { sessionId: 'b9aa2a', location: 'GMT2Memory.tsx:timeoutBranch', message: 'timer hit 0', data: { trialIndex, recordedForTrialRef: recordedForTrialRef.current, willCallRecordTrial: willCall }, timestamp: Date.now(), hypothesisId: 'H1', runId: 'post-fix' };
        pushDebugLog(_p2);
        console.log('[GMT2Memory] timer hit 0', { trialIndex, willCall });
        fetch('http://127.0.0.1:7618/ingest/d02cffea-2b2e-4a1e-93c8-0016355962bd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b9aa2a'},body:JSON.stringify(_p2)}).catch(()=>{});
        if (willCall) recordTrial(true);
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

  function recordTrial(timeout: boolean) {
    // #region agent log
    const _p3 = { sessionId: 'b9aa2a', location: 'GMT2Memory.tsx:recordTrial', message: 'recordTrial called', data: { timeout, trialIndex, recordedRef: recordedForTrialRef.current, willSkip: recordedForTrialRef.current === trialIndex }, timestamp: Date.now(), hypothesisId: 'H1' };
    pushDebugLog(_p3);
    fetch('http://127.0.0.1:7618/ingest/d02cffea-2b2e-4a1e-93c8-0016355962bd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b9aa2a'},body:JSON.stringify(_p3)}).catch(()=>{});
    // #endregion
    if (!currentItem || !participant) {
      console.log('[GMT2Memory] recordTrial early return: no currentItem or participant');
      return;
    }
    if (recordedForTrialRef.current === trialIndex) {
      console.log('[GMT2Memory] recordTrial early return: already recorded for trial', trialIndex);
      return;
    }
    console.log('[GMT2Memory] recordTrial proceeding', { trialIndex, timeout });
    recordedForTrialRef.current = trialIndex;
    const response = normalizeResponseMap(responseMapRef.current);
    const { hits, commissions, accuracy_raw } = scoreTrial(currentItem.target_map, response);
    const recon_rt_ms = reconStartRef.current > 0 ? Date.now() - reconStartRef.current : 0;
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

  function handlePlace(cellIndex: number, symbol: GMT2CellSymbol) {
    setResponseMap((prev) => ({ ...prev, [cellIndex]: symbol }));
  }

  function handleSubmit() {
    // #region agent log
    const _p4 = { sessionId: 'b9aa2a', location: 'GMT2Memory.tsx:handleSubmit', message: 'Submit button clicked', data: { hasCurrentItem: !!currentItem, phase }, timestamp: Date.now(), hypothesisId: 'H3' };
    pushDebugLog(_p4);
    console.log('[GMT2Memory] Submit clicked', { hasCurrentItem: !!currentItem, phase });
    fetch('http://127.0.0.1:7618/ingest/d02cffea-2b2e-4a1e-93c8-0016355962bd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b9aa2a'},body:JSON.stringify(_p4)}).catch(()=>{});
    // #endregion
    if (!currentItem || phase !== 'reconstructing') return;
    flushSync(() => recordTrial(false));
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
    return (
      <div className="page">
        <h2 className="grid-title">Remember the grid</h2>
        <p className="subtitle">Watch the positions carefully.</p>
        <div className="grid-container">
          <GMT2DisplayGrid gridMap={displayMap} />
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

  // reconstructing
  const includePlus = paletteIncludesPlus(currentItem.condition);
  return (
    <div className="page">
      <h2 className="grid-title">Reconstruct the grid</h2>
      <p className="subtitle">
        Place the symbols in the correct positions. Time left: {timeLeftSec}s
      </p>
      <GMT2ShapePalette
        includePlus={includePlus}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
      />
      <div className="grid-container">
        <GMT2ReconstructionGrid
          responseMap={responseMap}
          onPlace={handlePlace}
          onDrop={handlePlace}
          onCellClick={(cell) => selectedSymbol && handlePlace(cell, selectedSymbol)}
          paletteIncludesPlus={includePlus}
        />
      </div>
      <button type="button" onClick={handleSubmit} className="copy-submit">
        Submit
      </button>
    </div>
  );
}
