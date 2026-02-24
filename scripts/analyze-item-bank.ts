import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type Item = {
  item_id?: string;
  span: number;
  condition: string;
  target_map: string[];
};

const filePath = path.resolve(
  __dirname,
  "../src/gmt22/gmt22_item_bank.json"
);

const raw = fs.readFileSync(filePath, "utf-8");
const items: Item[] = JSON.parse(raw);

const CELL_COUNT = 16;
const heatmap = Array(CELL_COUNT).fill(0);

let totalX = 0;
let totalO = 0;
let totalPlus = 0;

const spanStats: Record<number, { count: number; totalTargets: number }> = {};

const seenLayouts = new Set<string>();
const duplicateLayouts: string[] = [];

items.forEach((item, index) => {
  const { span, condition, target_map } = item;
  const itemId = item.item_id ?? `item-${index}`;

  if (!spanStats[span]) {
    spanStats[span] = { count: 0, totalTargets: 0 };
  }

  spanStats[span].count++;

  // Use same key as generator (position-preserving) so we count true layout duplicates
  const layoutKey = target_map.join(",");
  if (seenLayouts.has(layoutKey)) {
    duplicateLayouts.push(itemId);
  }
  seenLayouts.add(layoutKey);

  target_map.forEach((cell, index) => {
    if (cell && cell !== "") {
      heatmap[index]++;
      spanStats[span].totalTargets++;

      if (cell === "X") totalX++;
      if (cell === "O") totalO++;
      if (cell === "Plus") totalPlus++;
    }
  });

  if (
    condition === "remember_distractor" &&
    !target_map.includes("Plus")
  ) {
    console.warn(
      `⚠️ remember_distractor item missing Plus: ${itemId}`
    );
  }
});

console.log("==== SYMBOL BALANCE ====");
console.log("Total X:", totalX);
console.log("Total O:", totalO);
console.log("Total Plus:", totalPlus);

const ratioXO = totalX + totalO > 0 ? totalX / (totalX + totalO) : 0;
console.log("X proportion (should be ~0.5):", ratioXO.toFixed(3));
const targetRatio = 0.5;
const ratioTolerance = 0.05;
if (totalX + totalO > 0 && Math.abs(ratioXO - targetRatio) > ratioTolerance) {
  console.warn(
    `⚠️ X proportion ${ratioXO.toFixed(3)} is outside target ${targetRatio} ± ${ratioTolerance}. Consider rebalancing the item bank.`
  );
}

console.log("\n==== SPAN DENSITY ====");
Object.keys(spanStats)
  .sort((a, b) => Number(a) - Number(b))
  .forEach((span) => {
    const s = spanStats[Number(span)];
    const avgTargets = s.totalTargets / s.count;
    console.log(
      `Span ${span}: items=${s.count}, avg targets=${avgTargets.toFixed(2)}`
    );
  });

console.log("\n==== HEATMAP ====");
for (let row = 0; row < 4; row++) {
  const rowVals = heatmap.slice(row * 4, row * 4 + 4);
  console.log(
    rowVals.map((v) => v.toString().padStart(4)).join("")
  );
}

const maxCell = Math.max(...heatmap);
const minCell = Math.min(...heatmap);

console.log("\nMax cell frequency:", maxCell);
console.log("Min cell frequency:", minCell);

if (maxCell > minCell * 2) {
  console.warn(
    "⚠️ Potential spatial clustering: some cells appear >2x more often than others. Consider balancing target positions in the generator."
  );
}

console.log("\n==== DUPLICATES ====");
console.log(`Duplicate layout count: ${duplicateLayouts.length} (of ${items.length} items).`);
if (duplicateLayouts.length > 0) {
  console.warn("Duplicate layouts found:", duplicateLayouts);
  console.warn(
    `⚠️ ${duplicateLayouts.length} items share a layout with an earlier item. Consider deduplicating the bank.`
  );
} else {
  console.log("No duplicate layouts detected.");
}

console.log("\n==== DONE ====");
