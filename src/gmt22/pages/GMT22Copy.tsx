import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useGMT22State } from '../GMT22State';
import type { GMT22CellSymbol } from '../types';
import { getCopyItemForSession, scoreCopyTask, toResponseGridMap } from '../lib/copyTask';
import GMT22DisplayGrid from '../components/GMT22DisplayGrid';
import GMT22ShapePalette from '../components/GMT22ShapePalette';
import GMT22ReconstructionGrid from '../components/GMT22ReconstructionGrid';
import { COPY_TIME_LIMIT_MS } from '../types';

export default function GMT22Copy() {
  const { participant, setCopyResult, setPhase } = useGMT22State();
  const copyItem = useMemo(
    () => (participant ? getCopyItemForSession(participant.session_seed) : null),
    [participant]
  );
  const targetMap = copyItem ? copyItem.target_map : [];
  const [responseMap, setResponseMap] = useState<Record<number, GMT22CellSymbol>>({});
  const [timeLeftSec, setTimeLeftSec] = useState(Math.floor(COPY_TIME_LIMIT_MS / 1000));
  const [highlightCell, setHighlightCell] = useState<number | null>(null);
  const submittedRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const responseMapRef = useRef<Record<number, GMT22CellSymbol>>({});
  responseMapRef.current = responseMap;
  useEffect(() => {
    responseMapRef.current = responseMap;
  }, [responseMap]);

  useEffect(() => {
    if (!copyItem) return;
    const item = copyItem;
    const target = item.target_map;
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
          const { copy_hits } = scoreCopyTask(target, response);
          const copy_total_rt_ms = Math.max(0, Date.now() - startTimeRef.current);
          const result = {
            copy_item_id: item.copy_item_id,
            copy_hits,
            copy_total_rt_ms,
            copy_target_map: [...target],
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
  }, [copyItem, setCopyResult, setPhase]);

  function submitCopy(responseMapOverride?: Record<number, GMT22CellSymbol>) {
    if (submittedRef.current || !copyItem) return;
    submittedRef.current = true;
    const source = responseMapOverride ?? responseMapRef.current;
    const response = toResponseGridMap(source);
    const { copy_hits } = scoreCopyTask(targetMap, response);
    const copy_total_rt_ms = Math.max(0, startTimeRef.current > 0 ? Date.now() - startTimeRef.current : 0);
    flushSync(() => {
      setCopyResult({
        copy_item_id: copyItem.copy_item_id,
        copy_hits,
        copy_total_rt_ms,
        copy_target_map: [...targetMap],
        copy_response_map: response,
      });
      setPhase('memory_instructions');
    });
  }

  function handlePlace(cellIndex: number, symbol: GMT22CellSymbol) {
    setResponseMap((prev) => ({ ...prev, [cellIndex]: symbol }));
    setHighlightCell(cellIndex);
  }
  useEffect(() => {
    if (highlightCell === null) return;
    const t = setTimeout(() => setHighlightCell(null), 250);
    return () => clearTimeout(t);
  }, [highlightCell]);

  function handleDrop(cellIndex: number, symbol: GMT22CellSymbol) {
    handlePlace(cellIndex, symbol);
  }

  const [selected, setSelected] = useState<GMT22CellSymbol | null>(null);

  if (!participant || !copyItem) return null;

  return (
    <div className="page copy-page">
      <h2 className="grid-title">Match this grid</h2>
      <p className="subtitle">
        Copy the grid into the empty one (8 symbols). You have {timeLeftSec} seconds.
      </p>
      <div className="copy-page-layout">
        <div className="copy-reference">
          <p className="copy-section-label">Copy this</p>
          <div className="grid-container copy-grid-wrap">
            <GMT22DisplayGrid gridMap={targetMap} />
          </div>
        </div>
        <div className="copy-response">
          <p className="copy-section-label">Your grid</p>
          <GMT22ShapePalette
            includePlus={false}
            selectedSymbol={selected}
            onSelectSymbol={setSelected}
          />
          <div className="grid-container copy-grid-wrap">
            <GMT22ReconstructionGrid
              responseMap={responseMap}
              onPlace={handlePlace}
              onDrop={handleDrop}
              onCellClick={(cellIndex: number) => selected !== null && handlePlace(cellIndex, selected)}
              paletteIncludesPlus={false}
              highlightCell={highlightCell}
            />
          </div>
          <button
            type="button"
            onClick={() => submitCopy(responseMap)}
            className="copy-submit"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
