/**
 * Demo-mode helpers — thin wrappers over batterySession + URL profile detection.
 */
import {
  advanceBatterySession,
  batteryStepLabel,
  batteryStepPath,
  clearBatterySession,
  currentBatteryPath,
  currentBatteryStep,
  isDemoBatteryActive,
  readBatterySession,
  startBatterySession,
  type BatteryStep,
} from './batterySession';

export type DemoTourStep = BatteryStep;

export { resolveDemoFromSearch } from './demoResolve';

export function startDemoTour(): void {
  startBatterySession('demo');
}

export function clearDemoTour(): void {
  clearBatterySession();
}

export function readDemoTour() {
  const s = readBatterySession();
  if (!s || s.mode !== 'demo') return null;
  return {
    active: s.active,
    index: s.index,
    steps: s.steps,
  };
}

export function demoTourPath(step: DemoTourStep): string {
  return batteryStepPath(step, 'demo');
}

export function demoTourLabel(step: DemoTourStep): string {
  return batteryStepLabel(step);
}

export function currentDemoTourPath(): string | null {
  if (!isDemoBatteryActive()) return null;
  return currentBatteryPath();
}

export function currentDemoTourStep(): DemoTourStep | null {
  if (!isDemoBatteryActive()) return null;
  return currentBatteryStep();
}

/** Prefer BatteryContinue + /battery/next for UI. */
export function advanceDemoTour(): string | null {
  if (!isDemoBatteryActive()) return null;
  return advanceBatterySession();
}

export function isDemoTourActive(): boolean {
  return isDemoBatteryActive();
}
