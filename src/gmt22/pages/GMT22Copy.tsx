import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useGMT22State } from '../GMT22State';
import type { GMT22CellSymbol } from '../types';
import { COPY_TARGET_MAP, scoreCopyTask, toResponseGridMap } from '../lib/copyTask';
import GMT2DisplayGrid from '../../gmt2/components/GMT2DisplayGrid';
import GMT2ShapePalette from '../../gmt2/components/GMT2ShapePalette';
import GMT2ReconstructionGrid from '../../gmt2/components/GMT2ReconstructionGrid';
import { COPY_TIME_LIMIT_MS } from '../types';

export default function GMT22Copy() {
  const { participant, setCopyResult, setPhase } = useGMT22State();
  const [responseMap, setResponseMap] = useState<Record<number, GMT22CellSymbol>>({});
  const [timeLeftSec, setTimeLeftSec] = useState(Math.floor(COPY_TIME_LIMIT_MS / 1000));
  const submittedRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const responseMapRef = useRef<Record<number, GMT22CellSymbol>>({});
  responseMapRef.current = responseMap;
  useEffect(() => {
    responseMapRef.current = responseMap;
  }, [responseMap]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const limitSec = Math.floor(COPY_TIME_LIMIT_MS / 1000);
    let secondsLeft = limitSec;
    setTimeLeftSec(secondsLeft);
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    function tick() {
      if (cancelled) return;
      secondsLeft -= 1;
      setTimeLeftSec(secondsLeft);
      if (secondsLeft <= 0) {
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
            setPhase('memory_instructions');
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

  function submitCopy(responseMapOverride?: Record<number, GMT22CellSymbol>) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const source = responseMapOverride ?? responseMapRef.current;
    const response = toResponseGridMap(source);
    const { copy_hits } = scoreCopyTask(COPY_TARGET_MAP, response);
    const copy_total_rt_ms = startTimeRef.current > 0 ? Date.now() - startTimeRef.current : 0;
    flushSync(() => {
      setCopyResult({
        copy_hits,
        copy_total_rt_ms,
        copy_target_map: [...COPY_TARGET_MAP],
        copy_response_map: response,
      });
      setPhase('memory_instructions');
    });
  }

  function handlePlace(cellIndex: number, symbol: GMT22CellSymbol) {
    setResponseMap((prev) => ({ ...prev, [cellIndex]: symbol }));
  }

  function handleDrop(cellIndex: number, symbol: GMT22CellSymbol) {
    handlePlace(cellIndex, symbol);
  }

  const [selected, setSelected] = useState<GMT22CellSymbol | null>(null);

  if (!participant) return null;

  return (
    <div className="page copy-page">
      <h2 className="grid-title">Copy the grid</h2>
      <p className="subtitle">
        Copy the reference grid into the empty grid (8 symbols). You have {timeLeftSec} seconds.
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
            onClick={() => submitCopy(responseMap)}
            className="copy-submit"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
