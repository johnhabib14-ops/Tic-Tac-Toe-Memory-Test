import type { GMT2GridMap } from '../types';
import SymbolX from '../../components/SymbolX';
import SymbolO from '../../components/SymbolO';
import SymbolPlus from './SymbolPlus';

interface GMT2DisplayGridProps {
  gridMap: GMT2GridMap;
}

export default function GMT2DisplayGrid({ gridMap }: GMT2DisplayGridProps) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: 'repeat(4, 56px)',
        gridTemplateRows: 'repeat(4, 56px)',
      }}
    >
      {Array.from({ length: 16 }, (_, i) => {
        const sym = gridMap[i] || '';
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
