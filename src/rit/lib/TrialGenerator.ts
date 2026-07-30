import { createSeededRandom, shuffle } from '../../lib/seedRandom';
import { TASK_CONFIG, type TaskConfig } from '../config/taskConfig';
import type {
  BlockType,
  ExpectedResponse,
  PlannedTrial,
  ResponseRule,
  StimulusKind,
  StimulusProperties,
} from '../types';

type BlockKey = 'practice' | 'baseline' | 'habit' | 'standard' | 'interference';

function stimulusFor(kind: StimulusKind, reverseFrame: boolean): StimulusProperties {
  if (kind === 'go_a') {
    return {
      kind,
      shape: 'diamond',
      colorToken: 'signal_blue',
      hasStopCue: false,
      hasReverseFrame: reverseFrame,
      label: 'go_a_blue_diamond',
    };
  }
  if (kind === 'go_b') {
    return {
      kind,
      shape: 'hexagon',
      colorToken: 'signal_amber',
      hasStopCue: false,
      hasReverseFrame: reverseFrame,
      label: 'go_b_amber_hexagon',
    };
  }
  return {
    kind,
    shape: reverseFrame ? 'hexagon' : 'diamond',
    colorToken: reverseFrame ? 'signal_amber' : 'signal_blue',
    hasStopCue: true,
    hasReverseFrame: reverseFrame,
    label: 'nogo_stop_cue',
  };
}

function expectedFor(kind: StimulusKind, rule: ResponseRule): ExpectedResponse {
  if (kind === 'nogo') return 'none';
  if (rule === 'standard') return kind === 'go_a' ? 'a' : 'b';
  return kind === 'go_a' ? 'b' : 'a';
}

function isiFor(random: () => number, config: TaskConfig): number {
  const { isiMinMs, isiMaxMs } = config.timing;
  return Math.round(isiMinMs + random() * (isiMaxMs - isiMinMs));
}

function buildKindList(
  trialCount: number,
  goRatio: number,
  random: () => number
): StimulusKind[] {
  const nogoCount = Math.round(trialCount * (1 - goRatio));
  const goCount = trialCount - nogoCount;
  const goA = Math.floor(goCount / 2);
  const goB = goCount - goA;
  const kinds: StimulusKind[] = [
    ...Array(goA).fill('go_a'),
    ...Array(goB).fill('go_b'),
    ...Array(nogoCount).fill('nogo'),
  ];
  return shuffle(kinds, random);
}

function orderWithConstraints(
  kinds: StimulusKind[],
  random: () => number,
  config: TaskConfig
): StimulusKind[] {
  const { maxSameTypeRun, maxSameStimulusRun } = config.sequenceConstraints;
  const nogoCount = kinds.filter((k) => k === 'nogo').length;
  const goKinds = shuffle(
    kinds.filter((k) => k !== 'nogo'),
    random
  );
  const total = kinds.length;
  const out: StimulusKind[] = Array(total).fill('go_a');

  const nogoIdx = new Set<number>();
  if (nogoCount > 0) {
    for (let i = 0; i < nogoCount; i++) {
      const base = Math.floor(((i + 0.5) * total) / nogoCount);
      const jitter = Math.floor(random() * 2);
      let idx = Math.min(total - 1, Math.max(0, base + jitter));
      if (nogoIdx.has(idx)) {
        for (let d = 1; d < total; d++) {
          if (idx + d < total && !nogoIdx.has(idx + d)) {
            idx = idx + d;
            break;
          }
          if (idx - d >= 0 && !nogoIdx.has(idx - d)) {
            idx = idx - d;
            break;
          }
        }
      }
      nogoIdx.add(idx);
    }
  }

  let gi = 0;
  for (let i = 0; i < total; i++) {
    out[i] = nogoIdx.has(i) ? 'nogo' : goKinds[gi++] ?? 'go_a';
  }

  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    for (let i = maxSameStimulusRun; i < out.length; i++) {
      if (out[i] === 'nogo') continue;
      let same = true;
      for (let j = 0; j < maxSameStimulusRun; j++) {
        if (out[i - j] !== out[i]) {
          same = false;
          break;
        }
      }
      if (!same) continue;
      const swapWith = out.findIndex(
        (k, idx) => idx > i && k !== 'nogo' && k !== out[i]
      );
      if (swapWith >= 0) {
        const tmp = out[i];
        out[i] = out[swapWith];
        out[swapWith] = tmp;
        changed = true;
      }
    }
    if (!changed) break;
  }

  for (let i = maxSameTypeRun; i < out.length; i++) {
    let run = 1;
    for (let j = i - 1; j >= 0 && typeOf(out[j]) === typeOf(out[i]); j--) run++;
    if (run <= maxSameTypeRun) continue;
    const swapWith = out.findIndex(
      (k, idx) => idx > i && typeOf(k) !== typeOf(out[i])
    );
    if (swapWith >= 0) {
      const tmp = out[i];
      out[i] = out[swapWith];
      out[swapWith] = tmp;
    }
  }

  return out;
}

function typeOf(k: StimulusKind): 'go' | 'nogo' {
  return k === 'nogo' ? 'nogo' : 'go';
}

function generateBlock(
  blockKey: BlockKey,
  random: () => number,
  trialOffset: number,
  config: TaskConfig
): PlannedTrial[] {
  const block = config.blocks[blockKey];
  const rule = block.rule as ResponseRule;
  const reverseFrame = rule === 'reversed_mapping';
  const kinds = orderWithConstraints(
    buildKindList(block.trialCount, block.goRatio, random),
    random,
    config
  );

  return kinds.map((kind, i) => {
    const stimulus = stimulusFor(kind, reverseFrame);
    return {
      trialNumber: trialOffset + i + 1,
      blockId: block.id,
      blockType: blockKey as BlockType,
      stimulusId: `${block.id}_${i + 1}_${stimulus.label}`,
      stimulus,
      goNoGo: kind === 'nogo' ? 'nogo' : 'go',
      rule,
      expectedResponse: expectedFor(kind, rule),
      stimulusDurationMs: config.timing.stimulusDurationMs,
      isiMs: isiFor(random, config),
    };
  });
}

export interface SessionPlan {
  seed: number;
  trials: PlannedTrial[];
  byBlock: Record<BlockKey, PlannedTrial[]>;
  protocolProfile?: string;
  taskVersion?: string;
}

/** Generate a full session trial plan from a seed. Adaptive block omitted (disabled). */
export function generateSessionPlan(
  seed: number,
  config: TaskConfig = TASK_CONFIG
): SessionPlan {
  const random = createSeededRandom(seed >>> 0);
  const order: BlockKey[] = ['practice', 'baseline', 'habit', 'standard', 'interference'];
  const byBlock = {} as Record<BlockKey, PlannedTrial[]>;
  const trials: PlannedTrial[] = [];
  let offset = 0;

  for (const key of order) {
    const blockTrials = generateBlock(key, random, offset, config);
    byBlock[key] = blockTrials;
    trials.push(...blockTrials);
    offset += blockTrials.length;
  }

  return {
    seed,
    trials,
    byBlock,
    protocolProfile: config.protocolProfile,
    taskVersion: config.taskVersion,
  };
}

export function countGoNogo(trials: PlannedTrial[]): {
  go: number;
  nogo: number;
  ratioGo: number;
} {
  const go = trials.filter((t) => t.goNoGo === 'go').length;
  const nogo = trials.length - go;
  return { go, nogo, ratioGo: trials.length ? go / trials.length : 0 };
}

export function maxRunLength(
  trials: PlannedTrial[],
  pred: (t: PlannedTrial) => string
): number {
  let max = 0;
  let cur = 0;
  let prev: string | null = null;
  for (const t of trials) {
    const v = pred(t);
    if (v === prev) cur++;
    else {
      cur = 1;
      prev = v;
    }
    max = Math.max(max, cur);
  }
  return max;
}
