import type { DisplayCell } from '../types';

export default function DistractorShape({ cell }: { cell: DisplayCell }) {
  if (cell.type === 'X' || cell.type === 'O') return null;
  const className = 'distractor distractor-svg';
  const common = { className, viewBox: '0 0 32 32', fill: 'none', stroke: 'currentColor' };
  switch (cell.type) {
    case 'TRI':
      return (
        <svg {...common} strokeWidth="2">
          <path d="M16 4 L28 26 L4 26 Z" />
        </svg>
      );
    case 'STAR':
      return (
        <svg {...common} strokeWidth="2">
          <path d="M16 2 L18 12 L28 12 L20 18 L24 28 L16 22 L8 28 L12 18 L2 12 L14 12 Z" />
        </svg>
      );
    case 'DIAMOND':
      return (
        <svg {...common} strokeWidth="2">
          <path d="M16 2 L30 16 L16 30 L2 16 Z" />
        </svg>
      );
    case 'SQUARE':
      return (
        <svg {...common} strokeWidth="2">
          <rect x="4" y="4" width="24" height="24" />
        </svg>
      );
    default:
      return null;
  }
}
