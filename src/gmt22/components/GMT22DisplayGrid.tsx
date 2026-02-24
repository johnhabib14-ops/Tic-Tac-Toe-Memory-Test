import type { GMT22GridMap } from '../types';
import SymbolX from '../../components/SymbolX';
import SymbolO from '../../components/SymbolO';
import SymbolPlus from './SymbolPlus';

interface GMT22DisplayGridProps {
  gridMap: GMT22GridMap;
}

const GRID_SIZE = 4;
const N = GRID_SIZE * GRID_SIZE;

export default function GMT22DisplayGrid({ gridMap }: GMT22DisplayGridProps) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, 56px)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 56px)`,
      }}
    >
      {Array.from({ length: N }, (_, i) => {
        const sym = gridMap[i] ?? '';
        return (
          <div key={i} className="grid-cell">
            <span className="cell-number">{i + 1}</span>
            {sym === 'X' && <SymbolX />}
            {sym === 'O' && <SymbolO />}
            {sym === 'Plus' && <SymbolPlus />}
          </div>
        );
      })}
    </div>
  );
}
