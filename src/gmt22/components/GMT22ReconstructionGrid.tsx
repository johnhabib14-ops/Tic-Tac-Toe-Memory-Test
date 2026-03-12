import type { GMT22CellSymbol } from '../types';
import SymbolX from '../../components/SymbolX';
import SymbolO from '../../components/SymbolO';
import SymbolPlus from './SymbolPlus';

interface GMT22ReconstructionGridProps {
  responseMap: Record<number, GMT22CellSymbol>;
  onPlace: (cellIndex: number, symbol: GMT22CellSymbol) => void;
  onDrop: (cellIndex: number, symbol: GMT22CellSymbol) => void;
  onCellClick: (cellIndex: number) => void;
  paletteIncludesPlus: boolean;
  /** When set, this cell briefly shows a placement animation. */
  highlightCell?: number | null;
}

const GRID_SIZE = 4;
const N = GRID_SIZE * GRID_SIZE;

export default function GMT22ReconstructionGrid({
  responseMap,
  onPlace: _onPlace,
  onDrop,
  onCellClick,
  paletteIncludesPlus,
  highlightCell = null,
}: GMT22ReconstructionGridProps) {
  void _onPlace;
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
    const symbol = e.dataTransfer.getData('text/plain') as GMT22CellSymbol;
    if (symbol !== undefined && symbol !== null) onDrop(cellIndex, symbol);
  }

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, 56px)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 56px)`,
      }}
    >
      {Array.from({ length: N }, (_, i) => {
        const sym = responseMap[i] ?? '';
        return (
          <div
            key={i}
            className={`grid-cell reconstruction${highlightCell === i ? ' cell-just-placed' : ''}`}
            onClick={() => onCellClick(i)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, i)}
          >
            <span className="cell-number">{i + 1}</span>
            {sym === 'X' && <SymbolX />}
            {sym === 'O' && <SymbolO />}
            {sym === 'Plus' && paletteIncludesPlus && <SymbolPlus />}
          </div>
        );
      })}
    </div>
  );
}
