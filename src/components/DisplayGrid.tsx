import type { DisplayMap } from '../types';
import SymbolX from './SymbolX';
import SymbolO from './SymbolO';
import DistractorShape from './DistractorShape';

interface DisplayGridProps {
  gridSize: number;
  displayMap: DisplayMap;
}

export default function DisplayGrid({ gridSize, displayMap }: DisplayGridProps) {
  const n = gridSize * gridSize;
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 56px)`,
        gridTemplateRows: `repeat(${gridSize}, 56px)`,
      }}
    >
      {Array.from({ length: n }, (_, i) => {
        const cell = displayMap[i];
        const num = i + 1;
        if (!cell) {
          return (
            <div key={i} className="grid-cell">
              <span className="cell-number">{num}</span>
            </div>
          );
        }
        if (cell.type === 'X') {
          return (
            <div key={i} className="grid-cell">
              <span className="cell-number">{num}</span>
              <SymbolX />
            </div>
          );
        }
        if (cell.type === 'O') {
          return (
            <div key={i} className="grid-cell">
              <span className="cell-number">{num}</span>
              <SymbolO />
            </div>
          );
        }
        return (
          <div key={i} className="grid-cell">
            <span className="cell-number">{num}</span>
            <DistractorShape cell={cell} />
          </div>
        );
      })}
    </div>
  );
}
