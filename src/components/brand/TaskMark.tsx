/** Small task accent marks for hub task rows. */

export type TaskMarkKind = 'gmt' | 'rit' | 'cft';

const LABELS: Record<TaskMarkKind, string> = {
  gmt: 'Grid Memory',
  rit: 'Response Inhibition',
  cft: 'Cognitive Flexibility',
};

export default function TaskMark({
  kind,
  className = '',
}: {
  kind: TaskMarkKind;
  className?: string;
}) {
  return (
    <span className={`hl-task-mark hl-task-mark--${kind} ${className}`.trim()} aria-hidden>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        {kind === 'gmt' && (
          <>
            <rect x="4" y="4" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.75" />
            <path d="M4 11.5h20M4 16.5h20M11.5 4v20M16.5 4v20" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="9" cy="9" r="2" fill="var(--accent, #0f6b6b)" />
            <circle cx="19" cy="19" r="2" fill="var(--accent-gold, #d4a017)" />
          </>
        )}
        {kind === 'rit' && (
          <>
            <circle cx="9" cy="14" r="5.5" stroke="var(--accent, #0f6b6b)" strokeWidth="1.75" fill="color-mix(in srgb, var(--accent, #0f6b6b) 18%, transparent)" />
            <circle cx="19" cy="14" r="5.5" stroke="currentColor" strokeWidth="1.75" />
            <path d="M16.5 11.5l5 5M21.5 11.5l-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </>
        )}
        {kind === 'cft' && (
          <>
            <path
              d="M7 8h6a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H9"
              stroke="var(--accent, #0f6b6b)"
              strokeWidth="1.75"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M7 20h8a4 4 0 0 0 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" fill="none" />
            <path d="M18 8l3 3-3 3M18 20l3-3" stroke="var(--accent-gold, #d4a017)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>
      <span className="visually-hidden">{LABELS[kind]}</span>
    </span>
  );
}
