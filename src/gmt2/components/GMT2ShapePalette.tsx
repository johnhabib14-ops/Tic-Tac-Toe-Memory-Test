import type { GMT2CellSymbol } from '../types';
import SymbolX from '../../components/SymbolX';
import SymbolO from '../../components/SymbolO';
import SymbolPlus from './SymbolPlus';

interface GMT2ShapePaletteProps {
  includePlus: boolean;
  selectedSymbol: GMT2CellSymbol | null;
  onSelectSymbol: (symbol: GMT2CellSymbol | null) => void;
  onDragStart?: (symbol: GMT2CellSymbol) => void;
}

export default function GMT2ShapePalette({
  includePlus,
  selectedSymbol,
  onSelectSymbol,
  onDragStart,
}: GMT2ShapePaletteProps) {
  function handleDragStart(e: React.DragEvent, symbol: GMT2CellSymbol) {
    e.dataTransfer.setData('text/plain', symbol);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(symbol);
  }

  return (
    <div className="palette">
      <div
        className={`palette-item ${selectedSymbol === 'X' ? 'selected' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, 'X')}
        onClick={() => onSelectSymbol(selectedSymbol === 'X' ? null : 'X')}
      >
        <SymbolX />
      </div>
      <div
        className={`palette-item ${selectedSymbol === 'O' ? 'selected' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, 'O')}
        onClick={() => onSelectSymbol(selectedSymbol === 'O' ? null : 'O')}
      >
        <SymbolO />
      </div>
      {includePlus && (
        <div
          className={`palette-item ${selectedSymbol === 'Plus' ? 'selected' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, 'Plus')}
          onClick={() => onSelectSymbol(selectedSymbol === 'Plus' ? null : 'Plus')}
        >
          <SymbolPlus />
        </div>
      )}
      <div
        className={`palette-item ${selectedSymbol === '' ? 'selected' : ''}`}
        onClick={() => onSelectSymbol(selectedSymbol === '' ? null : '')}
      >
        Clear
      </div>
    </div>
  );
}
