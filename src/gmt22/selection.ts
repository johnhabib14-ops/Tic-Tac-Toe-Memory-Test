/**
 * Selection adapter for the audit script.
 * Exports buildTrialPlan and selectItemsForSession so the audit can simulate
 * many sessions and detect repeated item_id within a session.
 * Uses the app's getItemForTrial and getConditionOrder; condition order is
 * derived deterministically from seed to match a single "session".
 */

import { getItemForTrial } from './lib/memoryTask';
import { getConditionOrder } from './types';
import type { GMT22Condition, GMT22ConditionOrder } from './types';

export type TrialPlanRow = {
  condition: string;
  span: number;
  trial_index: number;
  item_id: string;
};

function seedToInt(seed: string | number): number {
  if (typeof seed === 'number') return seed;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (seed >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SPANS = [2, 3, 4, 5, 6, 7] as const;
const TRIAL_INDICES = [1, 2] as const;

/**
 * Builds the full trial plan for one session: condition order is chosen
 * deterministically from seed (A or B), then for each condition × span × trial
 * we call getItemForTrial and collect item_id. Items are ignored (app uses
 * in-memory bank from memoryTask).
 */
export function buildTrialPlan(
  seed: string | number,
  _items: unknown[]
): TrialPlanRow[] {
  const sessionSeed = seedToInt(seed);
  const rng = mulberry32(sessionSeed);
  const order: GMT22ConditionOrder = rng() < 0.5 ? 'A' : 'B';
  const conditionOrder = getConditionOrder(order) as GMT22Condition[];

  const plan: TrialPlanRow[] = [];

  for (const condition of conditionOrder) {
    for (const span of SPANS) {
      for (const trial_index of TRIAL_INDICES) {
        const item = getItemForTrial(condition, span, trial_index, sessionSeed);
        const item_id = item.item_id ?? `item-${condition}-${span}-${trial_index}`;
        plan.push({ condition, span, trial_index, item_id });
      }
    }
  }

  return plan;
}

export function selectItemsForSession(
  seed: string | number,
  items: unknown[]
): string[] {
  return buildTrialPlan(seed, items).map((r) => r.item_id);
}

/**
 * Single-trial selector for scripts/selectionAudit.ts.
 * Given session args, returns the item_id that would be shown for that trial.
 */
export function selectItemForTrial(args: {
  seed: string | number;
  order: 'A' | 'B';
  condition: string;
  span: number;
  trial_index: number;
  items: unknown[];
}): string {
  const sessionSeed = seedToInt(args.seed);
  const item = getItemForTrial(
    args.condition as GMT22Condition,
    args.span,
    args.trial_index as 1 | 2,
    sessionSeed
  );
  return item.item_id ?? `item-${args.condition}-${args.span}-${args.trial_index}`;
}
