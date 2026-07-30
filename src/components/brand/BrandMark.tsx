/** EF Assessment Battery mark — three linked constructs on a ghost grid. */

type BrandMarkProps = {
  className?: string;
  /** Hero mark (~80px) vs compact hub mark */
  size?: 'hero' | 'md' | 'sm';
  /** Show product name beside/under the mark */
  withWordmark?: boolean;
  title?: string;
};

const SIZE_PX = { hero: 80, md: 48, sm: 32 } as const;

export function EfMarkSvg({ size = 80, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.18">
        <line x1="40" y1="24" x2="40" y2="104" />
        <line x1="64" y1="24" x2="64" y2="104" />
        <line x1="88" y1="24" x2="88" y2="104" />
        <line x1="24" y1="40" x2="104" y2="40" />
        <line x1="24" y1="64" x2="104" y2="64" />
        <line x1="24" y1="88" x2="104" y2="88" />
      </g>
      <g stroke="#0f6b6b" strokeWidth="4" strokeLinecap="round">
        <path d="M42 80 L64 48" />
        <path d="M86 80 L64 48" />
        <path d="M42 80 L86 80" />
      </g>
      <circle cx="64" cy="48" r="11" fill="#e8f4f4" stroke="#0f6b6b" strokeWidth="3" />
      <circle cx="42" cy="80" r="11" fill="#0f6b6b" />
      <circle cx="86" cy="80" r="11" fill="#d4a017" />
      <circle cx="64" cy="48" r="3.5" fill="#0f6b6b" />
      <circle cx="42" cy="80" r="3.5" fill="#e8f4f4" />
      <circle cx="86" cy="80" r="3.5" fill="#0f1720" />
    </svg>
  );
}

export default function BrandMark({
  className = '',
  size = 'hero',
  withWordmark = false,
  title = 'EF Assessment Battery',
}: BrandMarkProps) {
  const px = SIZE_PX[size];

  return (
    <div className={`hl-brand-mark hl-brand-mark--${size} ${className}`.trim()}>
      <EfMarkSvg size={px} className="hl-brand-mark-svg" />
      {withWordmark ? <span className="hl-brand-mark-word">{title}</span> : null}
    </div>
  );
}
