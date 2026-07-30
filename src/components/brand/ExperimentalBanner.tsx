import { HL_EXPERIMENTAL } from './BrandLine';

export default function ExperimentalBanner({
  className = '',
  compact = false,
}: {
  className?: string;
  /** Shorter line for results pages */
  compact?: boolean;
}) {
  return (
    <p
      className={`hl-experimental ${compact ? 'hl-experimental-compact' : ''} ${className}`.trim()}
      role="note"
    >
      {compact
        ? 'Provisional experimental scores only. Not diagnostic or normed.'
        : HL_EXPERIMENTAL}
    </p>
  );
}
