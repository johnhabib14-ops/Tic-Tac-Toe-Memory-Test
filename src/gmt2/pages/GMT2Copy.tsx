import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useGMT2State } from '../GMT2State';
import type { GMT2CellSymbol } from '../types';
import { COPY_TARGET_MAP, scoreCopyTask, toResponseGridMap } from '../lib/copyTask';
import GMT2DisplayGrid from '../components/GMT2DisplayGrid';
import GMT2ShapePalette from '../components/GMT2ShapePalette';
import GMT2ReconstructionGrid from '../components/GMT2ReconstructionGrid';
import { pushDebugLog } from '../../lib/debugLog';

export default function GMT2Copy() {
  const { participant, setCopyResult, setPhase } = useGMT2State();
  const [responseMap, setResponseMap] = useState<Record<number, GMT2CellSymbol>>({});
  const [timeLeftSec, setTimeLeftSec] = useState(30);
  const submittedRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const responseMapRef = useRef<Record<number, GMT2CellSymbol>>({});
  responseMapRef.current = responseMap;

  useEffect(() => {
    startTimeRef.current = Date.now();
    // #region agent log
    const _p1 = { sessionId: 'b9aa2a', location: 'GMT2Copy.tsx:copyTimerEffect', message: 'copy timer effect ran', data: { submittedRef: submittedRef.current }, timestamp: Date.now(), hypothesisId: 'H2' };
    pushDebugLog(_p1);
    fetch('http://127.0.0.1:7618/ingest/d02cffea-2b2e-4a1e-93c8-0016355962bd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b9aa2a'},body:JSON.stringify(_p1)}).catch(()=>{});
    // #endregion
    let secondsLeft = 30;
    setTimeLeftSec(secondsLeft);
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    function tick() {
      if (cancelled) return;
      secondsLeft -= 1;
      setTimeLeftSec(secondsLeft);
      if (secondsLeft <= 0) {
        const _p2 = { sessionId: 'b9aa2a', location: 'GMT2Copy.tsx:copyTimeoutBranch', message: 'copy timer hit 0', data: { submittedRef: submittedRef.current }, timestamp: Date.now(), hypothesisId: 'H2' };
        pushDebugLog(_p2);
        console.log('[GMT2Copy] timer hit 0', { submittedRef: submittedRef.current });
        fetch('http://127.0.0.1:7618/ingest/d02cffea-2b2e-4a1e-93c8-0016355962bd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b9aa2a'},body:JSON.stringify(_p2)}).catch(()=>{});
        if (!submittedRef.current) {
          submittedRef.current = true;
          const response = toResponseGridMap(responseMapRef.current);
          const { copy_hits } = scoreCopyTask(COPY_TARGET_MAP, response);
          const copy_total_rt_ms = Date.now() - startTimeRef.current;
          const result = {
            copy_hits,
            copy_total_rt_ms,
            copy_target_map: [...COPY_TARGET_MAP],
            copy_response_map: response,
          };
          flushSync(() => {
            setCopyResult(result);
            setPhase('memory');
          });
        }
        return;
      }
      timeoutId = setTimeout(tick, 1000);
    }
    timeoutId = setTimeout(tick, 1000);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [setCopyResult, setPhase]);

  function submitCopy() {
    // #region agent log
    const _p3 = { sessionId: 'b9aa2a', location: 'GMT2Copy.tsx:submitCopy', message: 'Submit button clicked', data: { submittedRef: submittedRef.current }, timestamp: Date.now(), hypothesisId: 'H3' };
    pushDebugLog(_p3);
    console.log('[GMT2Copy] Submit clicked', { submittedRef: submittedRef.current });
    fetch('http://127.0.0.1:7618/ingest/d02cffea-2b2e-4a1e-93c8-0016355962bd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b9aa2a'},body:JSON.stringify(_p3)}).catch(()=>{});
    // #endregion
    if (submittedRef.current) return;
    submittedRef.current = true;
    const response = toResponseGridMap(responseMapRef.current);
    const { copy_hits } = scoreCopyTask(COPY_TARGET_MAP, response);
    const copy_total_rt_ms = startTimeRef.current > 0 ? Date.now() - startTimeRef.current : 0;
    flushSync(() => {
      setCopyResult({
        copy_hits,
        copy_total_rt_ms,
        copy_target_map: [...COPY_TARGET_MAP],
        copy_response_map: response,
      });
      setPhase('memory');
    });
  }

  function handlePlace(cellIndex: number, symbol: GMT2CellSymbol) {
    setResponseMap((prev) => ({ ...prev, [cellIndex]: symbol }));
  }

  function handleDrop(cellIndex: number, symbol: GMT2CellSymbol) {
    handlePlace(cellIndex, symbol);
  }

  const [selected, setSelected] = useState<GMT2CellSymbol | null>(null);

  if (!participant) return null;

  return (
    <div className="page copy-page">
      <h2 className="grid-title">Copy the grid</h2>
      <p className="subtitle">
        Copy the reference grid into the empty grid. You have {timeLeftSec} seconds.
      </p>
      <div className="copy-page-layout">
        <div className="copy-reference">
          <p className="copy-section-label">Reference (copy this)</p>
          <div className="grid-container copy-grid-wrap">
            <GMT2DisplayGrid gridMap={COPY_TARGET_MAP} />
          </div>
        </div>
        <div className="copy-response">
          <p className="copy-section-label">Your copy</p>
          <GMT2ShapePalette
            includePlus={false}
            selectedSymbol={selected}
            onSelectSymbol={setSelected}
          />
          <div className="grid-container copy-grid-wrap">
            <GMT2ReconstructionGrid
              responseMap={responseMap}
              onPlace={handlePlace}
              onDrop={handleDrop}
              onCellClick={(cell) => selected && handlePlace(cell, selected)}
              paletteIncludesPlus={false}
            />
          </div>
          <button
            type="button"
            onClick={() => submitCopy()}
            className="copy-submit"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
