import type { GMT2CellSymbol } from '../types';
import SymbolX from '../../components/SymbolX';
import SymbolO from '../../components/SymbolO';
import SymbolPlus from './SymbolPlus';

interface GMT2ReconstructionGridProps {
  responseMap: Record<number, GMT2CellSymbol> | GMT2CellSymbol[];
  onPlace: (cellIndex: number, symbol: GMT2CellSymbol) => void;
  onDrop: (cellIndex: number, symbol: GMT2CellSymbol) => void;
  onCellClick: (cellIndex: number) => void;
  paletteIncludesPlus?: boolean;
}

export default function GMT2ReconstructionGrid({
  responseMap,
  onDrop,
  onCellClick,
  paletteIncludesPlus = false,
}: GMT2ReconstructionGridProps) {
  function getCell(i: number): GMT2CellSymbol {
    const v = Array.isArray(responseMap) ? responseMap[i] : responseMap[i];
    return v === 'X' || v === 'O' || v === 'Plus' ? v : '';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    e.currentTarget.classList.add('droppable-over');
  }

  function handleDragLeave(e: React.DragEvent) {
    e.currentTarget.classList.remove('droppable-over');
  }

  function handleDrop(e: React.DragEvent, cellIndex: number) {
    e.preventDefault();
    e.currentTarget.classList.remove('droppable-over');
    const symbol = e.dataTransfer.getData('text/plain') as GMT2CellSymbol;
    if (symbol && (symbol === 'X' || symbol === 'O' || (paletteIncludesPlus && symbol === 'Plus'))) {
      onDrop(cellIndex, symbol);
    }
  }

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: 'repeat(4, 56px)',
        gridTemplateRows: 'repeat(4, 56px)',
      }}
    >
      {Array.from({ length: 16 }, (_, i) => {
        const sym = getCell(i);
        return (
          <div
            key={i}
            className="grid-cell reconstruction"
            onClick={() => onCellClick(i)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, i)}
          >
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
