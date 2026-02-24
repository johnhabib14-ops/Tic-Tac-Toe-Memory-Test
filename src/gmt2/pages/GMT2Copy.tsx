import { useEffect, useRef, useState } from 'react';
import { useGMT2State } from '../GMT2State';
import type { GMT2CellSymbol } from '../types';
import { COPY_TARGET_MAP, scoreCopyTask, toResponseGridMap } from '../lib/copyTask';
import GMT2DisplayGrid from '../components/GMT2DisplayGrid';
import GMT2ShapePalette from '../components/GMT2ShapePalette';
import GMT2ReconstructionGrid from '../components/GMT2ReconstructionGrid';

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
    const interval = setInterval(() => {
      setTimeLeftSec((s) => {
        if (s <= 1) {
          clearInterval(interval);
          if (!submittedRef.current) {
            submittedRef.current = true;
            const response = toResponseGridMap(responseMapRef.current);
            const { copy_hits } = scoreCopyTask(COPY_TARGET_MAP, response);
            const copy_total_rt_ms = Date.now() - startTimeRef.current;
            setCopyResult({
              copy_hits,
              copy_total_rt_ms,
              copy_target_map: [...COPY_TARGET_MAP],
              copy_response_map: response,
            });
            setPhase('memory');
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [setCopyResult, setPhase]);

  function submitCopy() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const response = toResponseGridMap(responseMapRef.current);
    const { copy_hits } = scoreCopyTask(COPY_TARGET_MAP, response);
    const copy_total_rt_ms = startTimeRef.current > 0 ? Date.now() - startTimeRef.current : 0;
    setCopyResult({
      copy_hits,
      copy_total_rt_ms,
      copy_target_map: [...COPY_TARGET_MAP],
      copy_response_map: response,
    });
    setPhase('memory');
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
