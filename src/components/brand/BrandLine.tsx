/** Shared Habib Labs attribution for the EF Assessment Battery. */
export const HL_BRAND = 'By Habib Labs LLC';

export const HL_EXPERIMENTAL =
  'Experimental research measure under development. Not diagnostic, clinically validated, or normed.';

export default function BrandLine({ className = '' }: { className?: string }) {
  return (
    <p className={`hl-brand ${className}`.trim()}>
      <span className="hl-brand-mono" aria-hidden>
        HL
      </span>
      <span>{HL_BRAND}</span>
    </p>
  );
}
