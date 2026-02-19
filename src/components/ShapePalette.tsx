import { useState } from 'react';
import type { CellSymbol } from '../types';
import SymbolX from './SymbolX';
import SymbolO from './SymbolO';
import DistractorShape from './DistractorShape';

// Triangles only as decoys
const DECOY_TYPES: Array<{ id: CellSymbol; cell: { type: 'TRI' } }> = [
  { id: 'TRI', cell: { type: 'TRI' } },
];

interface ShapePaletteProps {
  decoysEnabled: boolean;
  onDragStart: (symbol: CellSymbol) => void;
  selectedSymbol: CellSymbol | null;
  onSelectSymbol: (symbol: CellSymbol | null) => void;
}

export default function ShapePalette({
  decoysEnabled,
  onDragStart,
  selectedSymbol,
  onSelectSymbol,
}: ShapePaletteProps) {
  const [dragging, setDragging] = useState<CellSymbol | null>(null);

  function handleDragStart(e: React.DragEvent, symbol: CellSymbol) {
    e.dataTransfer.setData('text/plain', symbol);
    e.dataTransfer.effectAllowed = 'copy';
    setDragging(symbol);
    onDragStart(symbol);
  }

  function handleDragEnd() {
    setDragging(null);
  }

  return (
    <div className="palette">
      <div
        className={`palette-item ${selectedSymbol === 'X' ? 'selected' : ''} ${dragging === 'X' ? 'dragging' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, 'X')}
        onDragEnd={handleDragEnd}
        onClick={() => onSelectSymbol(selectedSymbol === 'X' ? null : 'X')}
      >
        <SymbolX />
      </div>
      <div
        className={`palette-item ${selectedSymbol === 'O' ? 'selected' : ''} ${dragging === 'O' ? 'dragging' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, 'O')}
        onDragEnd={handleDragEnd}
        onClick={() => onSelectSymbol(selectedSymbol === 'O' ? null : 'O')}
      >
        <SymbolO />
      </div>
      <div
        className={`palette-item ${selectedSymbol === 'EMPTY' ? 'selected' : ''}`}
        onClick={() => onSelectSymbol(selectedSymbol === 'EMPTY' ? null : 'EMPTY')}
      >
        Clear
      </div>
      {decoysEnabled &&
        DECOY_TYPES.map(({ id, cell }) => (
          <div
            key={id}
            className={`palette-item ${selectedSymbol === id ? 'selected' : ''} ${dragging === id ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, id)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelectSymbol(selectedSymbol === id ? null : id)}
          >
            <DistractorShape cell={cell} />
          </div>
        ))}
    </div>
  );
}
