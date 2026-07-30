import type { TimingEvent, TimingQuality } from '../types';

/**
 * Browser timing is imperfect. This monitor tracks focus/visibility and
 * coarse frame irregularities to produce a session timing-quality flag.
 */
export class TimingMonitor {
  events: TimingEvent[] = [];
  focusLossCount = 0;
  hiddenCount = 0;
  frameDropHints = 0;
  private lastFrameTs: number | null = null;
  private rafId: number | null = null;
  private running = false;

  start(): void {
    if (this.running || typeof window === 'undefined') return;
    this.running = true;
    const onVis = () => {
      const hidden = document.visibilityState === 'hidden';
      this.events.push({
        type: hidden ? 'visibility_hidden' : 'visibility_visible',
        timestamp: performance.now(),
      });
      if (hidden) this.hiddenCount++;
    };
    const onBlur = () => {
      this.focusLossCount++;
      this.events.push({ type: 'focus_loss', timestamp: performance.now() });
    };
    const onFocus = () => {
      this.events.push({ type: 'focus_gain', timestamp: performance.now() });
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    (this as unknown as { _cleanup?: () => void })._cleanup = () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };

    const loop = (ts: number) => {
      if (this.lastFrameTs != null) {
        const delta = ts - this.lastFrameTs;
        // Hint of dropped frames if gap >> 2 frames at 60Hz
        if (delta > 50) {
          this.frameDropHints++;
          this.events.push({ type: 'frame_drop', timestamp: ts });
        }
      }
      this.lastFrameTs = ts;
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId != null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
    }
    const cleanup = (this as unknown as { _cleanup?: () => void })._cleanup;
    cleanup?.();
  }

  quality(): TimingQuality {
    if (typeof window === 'undefined') return 'unknown';
    return classifyTimingQuality(this.focusLossCount, this.frameDropHints, this.hiddenCount);
  }

  /** Flag a single trial if a focus loss occurred near onset */
  trialHadFocusIssue(stimulusOnsetTs: number, windowMs = 2000): boolean {
    return this.events.some(
      (e) =>
        (e.type === 'focus_loss' || e.type === 'visibility_hidden') &&
        e.timestamp >= stimulusOnsetTs - 50 &&
        e.timestamp <= stimulusOnsetTs + windowMs
    );
  }

  trialHadTimingIrregularity(stimulusOnsetTs: number, windowMs = 1000): boolean {
    return this.events.some(
      (e) =>
        e.type === 'frame_drop' &&
        e.timestamp >= stimulusOnsetTs - 50 &&
        e.timestamp <= stimulusOnsetTs + windowMs
    );
  }
}

export function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function detectRefreshRate(): number | null {
  // Not reliably available in all browsers; leave null unless computed externally
  return null;
}

/** Pure ordinal for unit tests and TimingMonitor.quality() */
export function classifyTimingQuality(
  focusLossCount: number,
  frameDropHints: number,
  hiddenCount: number
): TimingQuality {
  if (focusLossCount >= 5 || frameDropHints >= 20 || hiddenCount >= 3) return 'poor';
  if (focusLossCount >= 2 || frameDropHints >= 8 || hiddenCount >= 1) return 'fair';
  return 'good';
}
