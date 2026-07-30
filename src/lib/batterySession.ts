/**
 * Full / demo battery session — sequenced GMT → RIT → CFT with handoff.
 */

const SESSION_KEY = 'ef_battery_session_v1';
/** Legacy demo-only key; cleared when starting a new battery session. */
const LEGACY_DEMO_TOUR_KEY = 'ef_battery_demo_tour_v1';

export type BatteryStep = 'gmt' | 'rit' | 'cft';
export type BatteryMode = 'full' | 'demo';

export interface BatterySessionState {
  active: boolean;
  mode: BatteryMode;
  index: number;
  steps: BatteryStep[];
  batteryId: string;
  startedAt: string;
}

const FULL_PATHS: Record<BatteryStep, string> = {
  gmt: '/gmt2',
  rit: '/rit',
  cft: '/cft',
};

const DEMO_PATHS: Record<BatteryStep, string> = {
  gmt: '/gmt2?profile=demo',
  rit: '/rit?profile=demo',
  cft: '/cft?profile=demo',
};

const LABELS: Record<BatteryStep, string> = {
  gmt: 'Grid Memory Task',
  rit: 'Response Inhibition Task',
  cft: 'Cognitive Flexibility Task',
};

const DEFAULT_STEPS: BatteryStep[] = ['gmt', 'rit', 'cft'];

function createBatteryId(): string {
  return `bat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function pathsFor(mode: BatteryMode): Record<BatteryStep, string> {
  return mode === 'demo' ? DEMO_PATHS : FULL_PATHS;
}

export function batteryStepPath(step: BatteryStep, mode: BatteryMode = 'full'): string {
  return pathsFor(mode)[step];
}

export function batteryStepLabel(step: BatteryStep): string {
  return LABELS[step];
}

export function startBatterySession(mode: BatteryMode): BatterySessionState {
  const state: BatterySessionState = {
    active: true,
    mode,
    index: 0,
    steps: [...DEFAULT_STEPS],
    batteryId: createBatteryId(),
    startedAt: new Date().toISOString(),
  };
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(LEGACY_DEMO_TOUR_KEY);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }
  return state;
}

export function clearBatterySession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(LEGACY_DEMO_TOUR_KEY);
}

export function readBatterySession(): BatterySessionState | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BatterySessionState;
    if (!parsed?.active || !Array.isArray(parsed.steps) || !parsed.mode) return null;
    if (parsed.index < 0 || parsed.index > parsed.steps.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(state: BatterySessionState): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
}

export function isBatterySessionActive(): boolean {
  return readBatterySession()?.active === true;
}

export function currentBatteryStep(): BatteryStep | null {
  const s = readBatterySession();
  if (!s || s.index >= s.steps.length) return null;
  return s.steps[s.index];
}

export function currentBatteryPath(): string | null {
  const s = readBatterySession();
  if (!s || s.index >= s.steps.length) return null;
  return pathsFor(s.mode)[s.steps[s.index]];
}

export function getBatteryId(): string | null {
  return readBatterySession()?.batteryId ?? null;
}

/** True when a sequenced battery is active (full or demo). */
export function isInBatteryFlow(): boolean {
  return isBatterySessionActive();
}

export function isFullBatteryActive(): boolean {
  const s = readBatterySession();
  return s?.active === true && s.mode === 'full';
}

export function isDemoBatteryActive(): boolean {
  const s = readBatterySession();
  return s?.active === true && s.mode === 'demo';
}

/**
 * Mark current task complete and move index forward.
 * Does not clear when finished — interstitial shows "Battery complete".
 * Returns next path, or null when all steps are done.
 */
export function advanceBatterySession(): string | null {
  const s = readBatterySession();
  if (!s) return null;
  const nextIndex = s.index + 1;
  if (nextIndex >= s.steps.length) {
    writeSession({ ...s, index: nextIndex });
    return null;
  }
  const next: BatterySessionState = { ...s, index: nextIndex };
  writeSession(next);
  return pathsFor(next.mode)[next.steps[nextIndex]];
}

/** Whether the current index is past the last step (all tasks finished). */
export function isBatteryComplete(): boolean {
  const s = readBatterySession();
  if (!s) return false;
  return s.index >= s.steps.length;
}

/**
 * After finishing a task, navigate here before advancing.
 * Interstitial calls advanceBatterySession on Continue.
 */
export const BATTERY_NEXT_PATH = '/battery/next';

export function batteryProgressCopy(session: BatterySessionState): {
  title: string;
  detail: string;
  nextLabel: string | null;
  done: boolean;
} {
  // On completion screens, current index is still the just-finished task.
  // Interstitial receives state after advance, so index points at next (or past end).
  if (session.index >= session.steps.length) {
    return {
      title: 'Battery complete',
      detail:
        session.mode === 'demo'
          ? 'You finished the short demo of all three tasks.'
          : 'You finished all three tasks in order.',
      nextLabel: null,
      done: true,
    };
  }
  const next = session.steps[session.index];
  const finished = session.index; // steps completed before current
  return {
    title:
      finished === 0
        ? `Starting task 1 of ${session.steps.length}`
        : `Task ${finished} of ${session.steps.length} complete`,
    detail:
      finished === 0
        ? `First up: ${LABELS[next]}.`
        : `Next: ${LABELS[next]}.`,
    nextLabel: LABELS[next],
    done: false,
  };
}

/** Copy for the continue CTA on a task completion screen (before advance). */
export function batteryContinueCopy(session: BatterySessionState): {
  title: string;
  action: string;
  remaining: number;
} {
  const remaining = session.steps.length - session.index - 1;
  if (remaining <= 0) {
    return {
      title:
        session.mode === 'demo' ? 'Demo tour complete' : 'Battery complete',
      action: 'Finish',
      remaining: 0,
    };
  }
  const nextStep = session.steps[session.index + 1];
  return {
    title: `Progress: ${session.index + 1} of ${session.steps.length}`,
    action: `Next: ${LABELS[nextStep]}`,
    remaining,
  };
}
