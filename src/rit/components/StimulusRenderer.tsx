import type { StimulusProperties, VisualMode } from '../types';

interface Props {
  stimulus: StimulusProperties | null;
  visualMode: VisualMode;
  highContrast?: boolean;
  /** When true, show fixation only */
  fixation?: boolean;
}

/**
 * Instant stimulus paint — no entrance animations (RT integrity).
 * Color is always combined with shape + optional stop ring.
 */
export default function StimulusRenderer({
  stimulus,
  visualMode,
  highContrast = false,
  fixation = false,
}: Props) {
  if (fixation || !stimulus) {
    return (
      <div className="rit-stage" aria-hidden>
        <div className="rit-fixation" />
      </div>
    );
  }

  const blue = highContrast ? '#0044aa' : visualMode === 'game' ? '#2f6fed' : '#2b5ea8';
  const amber = highContrast ? '#a65f00' : visualMode === 'game' ? '#e0a000' : '#c49200';
  const fill = stimulus.colorToken === 'signal_blue' ? blue : amber;
  const stop = highContrast ? '#111' : '#2a2a2a';

  return (
    <div className="rit-stage" data-mode={visualMode}>
      {stimulus.hasReverseFrame && (
        <div className="rit-reverse-frame" aria-hidden />
      )}
      <svg
        className="rit-stimulus"
        viewBox="0 0 120 120"
        width="160"
        height="160"
        role="img"
        aria-label={stimulus.label.replace(/_/g, ' ')}
      >
        {stimulus.shape === 'diamond' ? (
          <polygon
            points="60,12 108,60 60,108 12,60"
            fill={fill}
            stroke={highContrast ? '#000' : '#1a1a1a'}
            strokeWidth="3"
          />
        ) : (
          <polygon
            points="60,10 95,30 110,65 95,100 60,110 25,100 10,65 25,30"
            fill={fill}
            stroke={highContrast ? '#000' : '#1a1a1a'}
            strokeWidth="3"
          />
        )}
        {/* Texture cue independent of color */}
        {stimulus.shape === 'diamond' ? (
          <line x1="60" y1="28" x2="60" y2="92" stroke="#fff" strokeWidth="4" opacity="0.55" />
        ) : (
          <>
            <line x1="35" y1="40" x2="85" y2="80" stroke="#fff" strokeWidth="3" opacity="0.5" />
            <line x1="35" y1="80" x2="85" y2="40" stroke="#fff" strokeWidth="3" opacity="0.5" />
          </>
        )}
        {stimulus.hasStopCue && (
          <>
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke={stop}
              strokeWidth="8"
            />
            <line
              x1="28"
              y1="28"
              x2="92"
              y2="92"
              stroke={stop}
              strokeWidth="8"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </div>
  );
}
