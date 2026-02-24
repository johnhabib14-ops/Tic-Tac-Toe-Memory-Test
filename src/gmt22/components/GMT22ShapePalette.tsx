import type { GMT22CellSymbol } from '../types';
import SymbolX from '../../components/SymbolX';
import SymbolO from '../../components/SymbolO';
import SymbolPlus from './SymbolPlus';

interface GMT22ShapePaletteProps {
  includePlus: boolean;
  selectedSymbol: GMT22CellSymbol | null;
  onSelectSymbol: (s: GMT22CellSymbol | null) => void;
}

export default function GMT22ShapePalette({
  includePlus,
  selectedSymbol,
  onSelectSymbol,
}: GMT22ShapePaletteProps) {
  return (
    <div className="palette">
      <div
        className={`palette-item ${selectedSymbol === 'X' ? 'selected' : ''}`}
        onClick={() => onSelectSymbol(selectedSymbol === 'X' ? null : 'X')}
      >
        <SymbolX />
      </div>
      <div
        className={`palette-item ${selectedSymbol === 'O' ? 'selected' : ''}`}
        onClick={() => onSelectSymbol(selectedSymbol === 'O' ? null : 'O')}
      >
        <SymbolO />
      </div>
      {includePlus && (
        <div
          className={`palette-item ${selectedSymbol === 'Plus' ? 'selected' : ''}`}
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
