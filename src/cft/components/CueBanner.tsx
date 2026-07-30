import type { RuleFeature, VisualMode } from '../types';
import { getInstructions } from '../config/instructions';

interface Props {
  rule: RuleFeature | null;
  visualMode: VisualMode;
}

/** Top-of-screen rule cue. Instant paint — no animations. */
export default function CueBanner({ rule, visualMode }: Props) {
  const copy = getInstructions(visualMode);
  if (!rule) {
    return <div className="cft-cue cft-cue-empty" aria-hidden />;
  }
  return (
    <div className="cft-cue" role="status" aria-live="polite">
      {copy.cueLabels[rule]}
    </div>
  );
}
