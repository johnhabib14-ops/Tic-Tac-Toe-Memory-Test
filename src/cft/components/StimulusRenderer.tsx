/**
 * Multi-feature stimulus (shape × pattern × number). No entrance animations.
 */
import type { StimulusFeatures, StimulusProperties, VisualMode } from '../types';

interface Props {
  stimulus: StimulusProperties | null;
  visualMode: VisualMode;
  highContrast?: boolean;
  fixation?: boolean;
}

function OneObject({
  features,
  fill,
  stroke,
  striped,
  ox,
  clipId,
}: {
  features: StimulusFeatures;
  fill: string;
  stroke: string;
  striped: boolean;
  ox: number;
  clipId: string;
}) {
  const isCircle = features.shape === 'circle';
  return (
    <g transform={`translate(${ox}, 0)`}>
      <defs>
        <clipPath id={clipId}>
          {isCircle ? (
            <circle cx="40" cy="50" r="28" />
          ) : (
            <rect x="12" y="22" width="56" height="56" rx="4" />
          )}
        </clipPath>
      </defs>
      {isCircle ? (
        <circle cx="40" cy="50" r="28" fill={fill} stroke={stroke} strokeWidth="3" />
      ) : (
        <rect
          x="12"
          y="22"
          width="56"
          height="56"
          rx="4"
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
        />
      )}
      {striped && (
        <g clipPath={`url(#${clipId})`}>
          <line x1="18" y1="18" x2="18" y2="82" stroke="#fff" strokeWidth="5" opacity="0.85" />
          <line x1="30" y1="18" x2="30" y2="82" stroke="#fff" strokeWidth="5" opacity="0.85" />
          <line x1="42" y1="18" x2="42" y2="82" stroke="#fff" strokeWidth="5" opacity="0.85" />
          <line x1="54" y1="18" x2="54" y2="82" stroke="#fff" strokeWidth="5" opacity="0.85" />
          <line x1="66" y1="18" x2="66" y2="82" stroke="#fff" strokeWidth="5" opacity="0.85" />
        </g>
      )}
    </g>
  );
}

export default function StimulusRenderer({
  stimulus,
  visualMode,
  highContrast = false,
  fixation = false,
}: Props) {
  if (fixation || !stimulus) {
    return (
      <div className="cft-stage" aria-hidden>
        <div className="cft-fixation" />
      </div>
    );
  }

  const features = stimulus.features;
  const fill = highContrast
    ? '#111111'
    : visualMode === 'game'
      ? '#2f6fed'
      : '#334155';
  const stroke = highContrast ? '#000' : '#0f172a';
  const striped = features.pattern === 'striped';
  const two = features.number === 'two';
  const baseId = stimulus.label.replace(/[^a-z0-9]/gi, '_');

  return (
    <div className="cft-stage" data-mode={visualMode}>
      <svg
        className="cft-stimulus"
        viewBox={two ? '0 0 180 100' : '0 0 80 100'}
        width={two ? 220 : 120}
        height={two ? 140 : 150}
        role="img"
        aria-label={stimulus.label.replace(/_/g, ' ')}
      >
        <OneObject
          features={features}
          fill={fill}
          stroke={stroke}
          striped={striped}
          ox={0}
          clipId={`${baseId}_a`}
        />
        {two && (
          <OneObject
            features={features}
            fill={fill}
            stroke={stroke}
            striped={striped}
            ox={100}
            clipId={`${baseId}_b`}
          />
        )}
      </svg>
    </div>
  );
}
