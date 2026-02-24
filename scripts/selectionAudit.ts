/**
 * selectionAudit.ts
 * Exports functions so the audit script can simulate many sessions and detect repeats.
 * SELECTOR_IMPORT_PATH and SELECTOR_EXPORT_NAME point to this project's selection adapter.
 */

import path from "path";
import { fileURLToPath } from "url";

type TrialPlanRow = {
  condition: string;
  span: number;
  trial_index: number;
  item_id: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SELECTOR_IMPORT_PATH = path.resolve(__dirname, "../src/gmt22/selection");
const SELECTOR_EXPORT_NAME = "selectItemForTrial";

/*
 * The selector function must return an item_id string.
 * Expected signature: (args) -> string
 */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedToInt(seed: string | number) {
  if (typeof seed === "number") return seed;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickOrder(rng: () => number): "A" | "B" {
  return rng() < 0.5 ? "A" : "B";
}

/** Must match src/gmt22/types.ts getConditionOrder. */
function getConditionOrder(order: "A" | "B") {
  return order === "A"
    ? ["baseline", "ignore_distractor", "remember_distractor", "delay"]
    : ["baseline", "delay", "ignore_distractor", "remember_distractor"];
}

function spans() {
  return [2, 3, 4, 5, 6, 7];
}

function trialsPerSpan() {
  return [1, 2];
}

async function loadSelector(): Promise<(args: any) => string> {
  const mod: any = await import(SELECTOR_IMPORT_PATH);
  const fn = mod[SELECTOR_EXPORT_NAME];
  if (typeof fn !== "function") {
    throw new Error(
      "Selector export not found. Check SELECTOR_IMPORT_PATH and SELECTOR_EXPORT_NAME."
    );
  }
  return fn;
}

/**
 * Builds the trial plan for one session using the project's selector.
 * Given the same seed and bank items, picks the same item_ids the live task would.
 */
export async function buildTrialPlan(
  seed: string | number,
  items: any[]
): Promise<TrialPlanRow[]> {
  const selector = await loadSelector();

  const rng = mulberry32(seedToInt(seed));
  const order = pickOrder(rng);
  const conditionOrder = getConditionOrder(order);

  const plan: TrialPlanRow[] = [];

  for (const condition of conditionOrder) {
    for (const span of spans()) {
      for (const trial_index of trialsPerSpan()) {
        const item_id = selector({
          seed,
          order,
          condition,
          span,
          trial_index,
          items,
        });

        if (typeof item_id !== "string" || item_id.length === 0) {
          throw new Error("Selector returned invalid item_id");
        }

        plan.push({ condition, span, trial_index, item_id });
      }
    }
  }

  return plan;
}

export async function selectItemsForSession(
  seed: string | number,
  items: any[]
): Promise<string[]> {
  const plan = await buildTrialPlan(seed, items);
  return plan.map((r) => r.item_id);
}
