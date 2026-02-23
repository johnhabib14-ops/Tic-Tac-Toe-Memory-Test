import type { ResponseMap, CellSymbol } from '../types';
import SymbolX from './SymbolX';
import SymbolO from './SymbolO';
import DistractorShape from './DistractorShape';

const DECOY_MAP: Record<string, { type: 'TRI' | 'STAR' | 'DIAMOND' | 'SQUARE' }> = {
  TRI: { type: 'TRI' },
  STAR: { type: 'STAR' },
  DIAMOND: { type: 'DIAMOND' },
  SQUARE: { type: 'SQUARE' },
};

interface ReconstructionGridProps {
  gridSize: number;
  responseMap: ResponseMap;
  onPlace: (cellIndex: number, symbol: CellSymbol) => void;
  onDrop: (cellIndex: number, symbol: CellSymbol) => void;
  onCellClick: (cellIndex: number) => void;
}

export default function ReconstructionGrid({
  gridSize,
  responseMap,
  onPlace: _onPlace,
  onDrop,
  onCellClick,
}: ReconstructionGridProps) {
  void _onPlace;
  const n = gridSize * gridSize;

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
    const symbol = e.dataTransfer.getData('text/plain') as CellSymbol;
    if (symbol) onDrop(cellIndex, symbol);
  }

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 56px)`,
        gridTemplateRows: `repeat(${gridSize}, 56px)`,
      }}
    >
      {Array.from({ length: n }, (_, i) => {
        const sym = responseMap[i] ?? 'EMPTY';
        const cell = (
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
            {sym !== 'X' && sym !== 'O' && sym !== 'EMPTY' && DECOY_MAP[sym] && (
              <DistractorShape cell={DECOY_MAP[sym]} />
            )}
          </div>
        );
        return cell;
      })}
    </div>
  );
}
