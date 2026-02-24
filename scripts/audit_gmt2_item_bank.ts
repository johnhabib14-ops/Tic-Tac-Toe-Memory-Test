/**
 * Comprehensive GMT2 item bank audit
 *
 * What it checks
 * 1 Counts by span and condition
 * 2 X and O balance overall and by span and condition
 * 3 Plus presence and Plus position heatmaps for remember and ignore
 * 4 Target position heatmaps overall and by span and condition
 * 5 Duplicate layouts global and within each span and condition
 * 6 Basic schema integrity checks
 * 7 Optional selection simulation if you provide a selector module
 *
 * How to run
 * npx ts-node scripts/audit_gmt2_item_bank.ts
 * or
 * npx tsx scripts/audit_gmt2_item_bank.ts
 *
 * Recommended (full audit including selection uniqueness over 500 sessions)
 * GMT2_SELECTOR_MODULE=../src/gmt22/selection npx tsx scripts/audit_gmt2_item_bank.ts
 *
 * Optional selection simulation
 * Set an env var GMT2_SELECTOR_MODULE to a module path that exports:
 *   selectItemsForSession(seed: string | number, items: any[]): string[]
 * or
 *   buildTrialPlan(seed: string | number, items: any[]): { item_id: string }[]
 *
 * Example
 * GMT2_SELECTOR_MODULE=../src/gmt22/selection npx ts-node scripts/audit_gmt2_item_bank.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type Cell = "" | "X" | "O" | "Plus" | string;

type BankItem = {
  item_id: string;
  span: number;
  condition: string;
  target_map: Cell[];
  distractor_map?: Cell[];
  // optional metadata
  adjacent_pairs_count?: number;
  distinct_rows_used?: number;
  distinct_cols_used?: number;
};

type Heatmap = number[];

const GRID_SIZE = 16;
const GRID_W = 4;

function assert(cond: any, msg: string) {
  if (!cond) throw new Error(msg);
}

function normalizeCell(v: any): Cell {
  if (v === null || v === undefined) return "";
  if (typeof v !== "string") return String(v);
  const s = v.trim();
  return s === "X" || s === "O" || s === "Plus" ? (s as Cell) : (s as Cell);
}

function normalizeMap(m: any): Cell[] {
  if (!Array.isArray(m)) return Array(GRID_SIZE).fill("");
  const out = Array(GRID_SIZE).fill("") as Cell[];
  for (let i = 0; i < GRID_SIZE; i++) out[i] = normalizeCell(m[i]);
  return out;
}

function emptyHeatmap(): Heatmap {
  return Array(GRID_SIZE).fill(0);
}

function addToHeatmap(h: Heatmap, map: Cell[], predicate: (c: Cell) => boolean) {
  for (let i = 0; i < GRID_SIZE; i++) {
    if (predicate(map[i])) h[i] += 1;
  }
}

function printHeatmap(h: Heatmap, title: string, opts?: { totalPlacements?: number }) {
  console.log(`\n==== ${title} ====`);
  for (let r = 0; r < GRID_W; r++) {
    const row = h.slice(r * GRID_W, r * GRID_W + GRID_W);
    console.log(row.map((v) => v.toString().padStart(4)).join(""));
  }
  const max = Math.max(...h);
  const min = Math.min(...h);
  const total = opts?.totalPlacements ?? h.reduce((a, b) => a + b, 0);
  console.log(`Max cell: ${max}`);
  console.log(`Min cell: ${min}`);
  if (min === 0 && total > 32) {
    console.warn("⚠️ Some cells were never used. That is usually undesirable.");
  } else if (min > 0 && max >= min * 2 && max - min >= 4) {
    console.warn("⚠️ Potential spatial bias. Some cells appear about 2x more than others.");
  }
}

function layoutKeyFromMap(map: Cell[]): string {
  return map.map((c) => (c === "" ? "." : c[0])).join("");
}

function countTargets(map: Cell[]): number {
  let n = 0;
  for (const c of map) if (c !== "") n++;
  return n;
}

function countSymbol(map: Cell[], sym: "X" | "O" | "Plus"): number {
  let n = 0;
  for (const c of map) if (c === sym) n++;
  return n;
}

function computeAdjacencyPairs(map: Cell[]): number {
  // 4 neighbor adjacency among non empty target cells
  const isTarget = (i: number) => map[i] !== "";
  let pairs = 0;
  for (let i = 0; i < GRID_SIZE; i++) {
    if (!isTarget(i)) continue;
    const r = Math.floor(i / GRID_W);
    const c = i % GRID_W;
    const right = r * GRID_W + (c + 1);
    const down = (r + 1) * GRID_W + c;
    if (c + 1 < GRID_W && isTarget(right)) pairs++;
    if (r + 1 < GRID_W && isTarget(down)) pairs++;
  }
  return pairs;
}

function distinctRowsUsed(map: Cell[]): number {
  const rows = new Set<number>();
  for (let i = 0; i < GRID_SIZE; i++) {
    if (map[i] !== "") rows.add(Math.floor(i / GRID_W));
  }
  return rows.size;
}

function distinctColsUsed(map: Cell[]): number {
  const cols = new Set<number>();
  for (let i = 0; i < GRID_SIZE; i++) {
    if (map[i] !== "") cols.add(i % GRID_W);
  }
  return cols.size;
}

function safePct(n: number, d: number): string {
  if (d === 0) return "0.0%";
  return `${((n / d) * 100).toFixed(1)}%`;
}

function groupKey(item: BankItem): string {
  return `${item.condition}__span${item.span}`;
}

function main() {
  const bankPath = path.resolve(__dirname, "../src/gmt22/gmt22_item_bank.json");
  assert(fs.existsSync(bankPath), `Bank file not found at ${bankPath}`);

  const raw = fs.readFileSync(bankPath, "utf-8");
  const parsed = JSON.parse(raw);

  assert(Array.isArray(parsed), "Item bank JSON must be an array.");

  const items: BankItem[] = parsed.map((x: any, i: number) => {
    const item: BankItem = {
      item_id: String(x.item_id ?? `item-${i}`),
      span: Number(x.span),
      condition: String(x.condition ?? ""),
      target_map: normalizeMap(x.target_map),
      distractor_map: x.distractor_map ? normalizeMap(x.distractor_map) : undefined,
      adjacent_pairs_count: typeof x.adjacent_pairs_count === "number" ? x.adjacent_pairs_count : undefined,
      distinct_rows_used: typeof x.distinct_rows_used === "number" ? x.distinct_rows_used : undefined,
      distinct_cols_used: typeof x.distinct_cols_used === "number" ? x.distinct_cols_used : undefined,
    };
    return item;
  });

  console.log(`Loaded items: ${items.length}`);

  // Basic integrity
  const bad: string[] = [];
  const seenIds = new Set<string>();
  for (const it of items) {
    if (!it.item_id) bad.push("Missing item_id");
    if (!Number.isFinite(it.span)) bad.push(`Bad span for ${it.item_id}`);
    if (!it.condition) bad.push(`Missing condition for ${it.item_id}`);
    if (!Array.isArray(it.target_map) || it.target_map.length !== GRID_SIZE) bad.push(`Bad target_map length for ${it.item_id}`);
    if (seenIds.has(it.item_id)) bad.push(`Duplicate item_id: ${it.item_id}`);
    seenIds.add(it.item_id);
  }
  if (bad.length) {
    console.warn("\n⚠️ BASIC INTEGRITY ISSUES");
    for (const b of bad.slice(0, 50)) console.warn(b);
    if (bad.length > 50) console.warn(`Plus ${bad.length - 50} more`);
  } else {
    console.log("Basic integrity checks passed.");
  }

  // Counts by span and condition
  const countsByGroup = new Map<string, number>();
  const conditions = new Set<string>();
  const spans = new Set<number>();

  for (const it of items) {
    conditions.add(it.condition);
    spans.add(it.span);
    const k = groupKey(it);
    countsByGroup.set(k, (countsByGroup.get(k) ?? 0) + 1);
  }

  const sortedConditions = Array.from(conditions).sort();
  const sortedSpans = Array.from(spans).sort((a, b) => a - b);

  console.log("\n==== COUNTS BY CONDITION AND SPAN ====");
  for (const c of sortedConditions) {
    const row: string[] = [];
    for (const s of sortedSpans) {
      row.push(String(countsByGroup.get(`${c}__span${s}`) ?? 0).padStart(4));
    }
    console.log(`${c.padEnd(22)} ${row.join("")}`);
  }

  // Global symbol balance and by group
  let totalX = 0;
  let totalO = 0;
  let totalPlus = 0;

  const balanceByGroup = new Map<string, { X: number; O: number; Plus: number; targets: number; items: number }>();

  for (const it of items) {
    const k = groupKey(it);
    if (!balanceByGroup.has(k)) balanceByGroup.set(k, { X: 0, O: 0, Plus: 0, targets: 0, items: 0 });
    const b = balanceByGroup.get(k)!;
    const x = countSymbol(it.target_map, "X");
    const o = countSymbol(it.target_map, "O");
    const p = countSymbol(it.target_map, "Plus");
    const t = countTargets(it.target_map);

    b.X += x;
    b.O += o;
    b.Plus += p;
    b.targets += t;
    b.items += 1;

    totalX += x;
    totalO += o;
    totalPlus += p;
  }

  console.log("\n==== SYMBOL BALANCE GLOBAL ====");
  console.log(`Total X: ${totalX}`);
  console.log(`Total O: ${totalO}`);
  console.log(`Total Plus: ${totalPlus}`);
  const xoDen = totalX + totalO;
  console.log(`X proportion: ${xoDen ? (totalX / xoDen).toFixed(3) : "n/a"}`);

  console.log("\n==== SYMBOL BALANCE BY CONDITION AND SPAN ====");
  for (const c of sortedConditions) {
    for (const s of sortedSpans) {
      const k = `${c}__span${s}`;
      const b = balanceByGroup.get(k);
      if (!b) continue;
      const den = b.X + b.O;
      const xprop = den ? (b.X / den).toFixed(3) : "n/a";
      const avgTargets = b.items ? (b.targets / b.items).toFixed(2) : "n/a";
      console.log(
        `${k.padEnd(28)} items=${String(b.items).padStart(3)} avgTargets=${String(avgTargets).padStart(5)} Xprop=${xprop} Plus=${b.Plus}`
      );
    }
  }

  // Heatmaps
  const hmAllTargets = emptyHeatmap();
  const hmAllPlusInTarget = emptyHeatmap();
  const hmRememberPlus = emptyHeatmap();
  const hmIgnorePlus = emptyHeatmap();
  const hmByGroup = new Map<string, Heatmap>();

  // Duplicate detection
  const dupGlobal = new Map<string, string[]>();
  const dupByGroup = new Map<string, Map<string, string[]>>();

  // Plus presence checks
  const rememberMissingPlus: string[] = [];

  for (const it of items) {
    addToHeatmap(hmAllTargets, it.target_map, (c) => c !== "");
    addToHeatmap(hmAllPlusInTarget, it.target_map, (c) => c === "Plus");

    const k = groupKey(it);
    if (!hmByGroup.has(k)) hmByGroup.set(k, emptyHeatmap());
    addToHeatmap(hmByGroup.get(k)!, it.target_map, (c) => c !== "");

    // plus maps by condition
    if (it.condition === "remember_distractor") {
      if (!it.target_map.includes("Plus")) rememberMissingPlus.push(it.item_id);
      addToHeatmap(hmRememberPlus, it.target_map, (c) => c === "Plus");
    }
    if (it.condition === "ignore_distractor") {
      if (it.distractor_map) addToHeatmap(hmIgnorePlus, it.distractor_map, (c) => c === "Plus");
    }

    // duplicates global
    const gKey = layoutKeyFromMap(it.target_map);
    if (!dupGlobal.has(gKey)) dupGlobal.set(gKey, []);
    dupGlobal.get(gKey)!.push(it.item_id);

    // duplicates by group
    if (!dupByGroup.has(k)) dupByGroup.set(k, new Map());
    const m = dupByGroup.get(k)!;
    if (!m.has(gKey)) m.set(gKey, []);
    m.get(gKey)!.push(it.item_id);
  }

  printHeatmap(hmAllTargets, "TARGET POSITION HEATMAP ALL ITEMS");
  const totalPlusInTarget = hmAllPlusInTarget.reduce((a, b) => a + b, 0);
  printHeatmap(hmAllPlusInTarget, "PLUS POSITION HEATMAP WITHIN TARGET_MAP ALL ITEMS", { totalPlacements: totalPlusInTarget });

  if (items.some((x) => x.condition === "remember_distractor")) {
    const totalRememberPlus = hmRememberPlus.reduce((a, b) => a + b, 0);
    printHeatmap(hmRememberPlus, "PLUS POSITION HEATMAP REMEMBER CONDITION (TARGET_MAP)", { totalPlacements: totalRememberPlus });
    if (rememberMissingPlus.length) {
      console.warn("\n⚠️ REMEMBER ITEMS MISSING PLUS");
      console.warn(rememberMissingPlus.slice(0, 100).join(", "));
      if (rememberMissingPlus.length > 100) console.warn(`Plus ${rememberMissingPlus.length - 100} more`);
    } else {
      console.log("\nAll remember items include at least one Plus.");
    }
  }

  if (items.some((x) => x.condition === "ignore_distractor")) {
    if (hmIgnorePlus.some((v) => v > 0)) {
      printHeatmap(hmIgnorePlus, "PLUS POSITION HEATMAP IGNORE CONDITION (DISTRACTOR_MAP)");
    } else {
      console.warn("\n⚠️ No Plus found in ignore_distractor distractor_map. Verify schema and values.");
    }
  }

  // Duplicate reporting
  console.log("\n==== DUPLICATE LAYOUTS GLOBAL (TARGET_MAP) ====");
  let dupPatternsGlobal = 0;
  let dupItemsGlobal = 0;
  for (const [, ids] of dupGlobal) {
    if (ids.length > 1) {
      dupPatternsGlobal++;
      dupItemsGlobal += ids.length;
    }
  }
  console.log(`Duplicate layout patterns: ${dupPatternsGlobal}`);
  console.log(`Items participating in duplicates: ${dupItemsGlobal}`);
  if (dupPatternsGlobal) {
    console.warn("⚠️ Examples of duplicates (first 15 patterns):");
    let shown = 0;
    for (const [, ids] of dupGlobal) {
      if (ids.length > 1) {
        console.warn(ids);
        shown++;
        if (shown >= 15) break;
      }
    }
  }

  console.log("\n==== DUPLICATE LAYOUTS BY CONDITION AND SPAN (TARGET_MAP) ====");
  for (const c of sortedConditions) {
    for (const s of sortedSpans) {
      const k = `${c}__span${s}`;
      const m = dupByGroup.get(k);
      if (!m) continue;
      let patterns = 0;
      for (const [, ids] of m) if (ids.length > 1) patterns++;
      if (patterns > 0) console.warn(`${k} duplicate patterns: ${patterns}`);
    }
  }

  // Target density sanity and span equals targets check
  console.log("\n==== SPAN TARGET COUNT SANITY ====");
  const spanMismatch: string[] = [];
  for (const it of items) {
    const t = countTargets(it.target_map);
    if (t !== it.span) {
      // allow remember to still equal span, plus counts as target, so still should equal span
      spanMismatch.push(`${it.item_id} ${it.condition} span=${it.span} targets=${t}`);
    }
  }
  if (spanMismatch.length) {
    console.warn("⚠️ Items where target count does not equal span (first 50):");
    console.warn(spanMismatch.slice(0, 50).join("\n"));
  } else {
    console.log("All items have target count equal to span.");
  }

  // Optional metadata checks for high spans
  console.log("\n==== HIGH SPAN METADATA CHECKS (OPTIONAL) ====");
  const high = items.filter((x) => x.span >= 6);
  let missingMeta = 0;
  for (const it of high) {
    const a = it.adjacent_pairs_count ?? computeAdjacencyPairs(it.target_map);
    const r = it.distinct_rows_used ?? distinctRowsUsed(it.target_map);
    const c = it.distinct_cols_used ?? distinctColsUsed(it.target_map);
    if (it.adjacent_pairs_count === undefined || it.distinct_rows_used === undefined || it.distinct_cols_used === undefined) missingMeta++;
    // soft warnings only
    if (it.span >= 6 && (r < 4 || c < 4)) {
      console.warn(`⚠️ High span dispersion weak: ${it.item_id} span=${it.span} rows=${r} cols=${c} adj=${a}`);
    }
  }
  console.log(`High span items: ${high.length}`);
  console.log(`High span items missing stored metadata fields: ${missingMeta}`);

  // Optional selection simulation
  console.log("\n==== OPTIONAL SELECTION SIMULATION ====");
  const selectorModule = process.env.GMT2_SELECTOR_MODULE;
  if (!selectorModule) {
    console.log("Skipped. Set GMT2_SELECTOR_MODULE to run selection uniqueness simulation.");
    console.log("Example: GMT2_SELECTOR_MODULE=../src/gmt22/selection npx ts-node scripts/audit_gmt2_item_bank.ts");
  } else {
    runSelectionSimulation(selectorModule, items).catch((e) => {
      console.warn("⚠️ Selection simulation failed:", e?.message ?? e);
    });
  }

  console.log("\n==== DONE ====");
}

async function runSelectionSimulation(selectorModulePath: string, items: BankItem[]) {
  const modPath = path.resolve(__dirname, selectorModulePath);
  const mod = await import(modPath);

  const selectItemsForSession: undefined | ((seed: string | number, items: any[]) => string[]) = mod.selectItemsForSession;
  const buildTrialPlan: undefined | ((seed: string | number, items: any[]) => { item_id: string }[]) = mod.buildTrialPlan;

  if (!selectItemsForSession && !buildTrialPlan) {
    throw new Error("Selector module must export selectItemsForSession or buildTrialPlan.");
  }

  const seedsToTest = 500;
  let sessionsWithRepeats = 0;
  let worstRepeatCount = 0;

  for (let i = 0; i < seedsToTest; i++) {
    const seed = `seed_${i}`;
    let ids: string[] = [];
    if (selectItemsForSession) {
      ids = selectItemsForSession(seed, items);
    } else if (buildTrialPlan) {
      ids = buildTrialPlan(seed, items).map((x) => x.item_id);
    }

    const counts = new Map<string, number>();
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);

    let repeats = 0;
    for (const [, n] of counts) if (n > 1) repeats += (n - 1);

    if (repeats > 0) sessionsWithRepeats++;
    worstRepeatCount = Math.max(worstRepeatCount, repeats);
  }

  console.log(`Seeds tested: ${seedsToTest}`);
  console.log(`Sessions with any repeated item_id: ${sessionsWithRepeats}`);
  console.log(`Worst repeat count in a session: ${worstRepeatCount}`);

  if (sessionsWithRepeats > 0) {
    console.warn("⚠️ Your deterministic selection can repeat item_ids within a session. Fix selection mapping.");
  } else {
    console.log("Selection uniqueness within session looks good.");
  }
}

main();
