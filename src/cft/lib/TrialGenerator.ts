import { createSeededRandom, shuffle } from '../../lib/seedRandom';
import { TASK_CONFIG, type TaskConfig } from '../config/taskConfig';
import type {
  BlockType,
  Congruency,
  ExpectedResponse,
  NumberValue,
  PatternValue,
  PlannedTrial,
  RuleFeature,
  ShapeValue,
  StimulusFeatures,
  StimulusProperties,
} from '../types';

type BlockKey =
  | 'practice'
  | 'rule_learning'
  | 'predictable_switch'
  | 'cued_switch'
  | 'interference';

export interface SessionPlan {
  seed: number;
  trials: PlannedTrial[];
  byBlock: Record<BlockKey, PlannedTrial[]>;
}

function responseForFeature(
  features: StimulusFeatures,
  rule: RuleFeature,
  config: TaskConfig
): ExpectedResponse {
  if (rule === 'shape') return config.responseMap.shape[features.shape];
  if (rule === 'pattern') return config.responseMap.pattern[features.pattern];
  return config.responseMap.number[features.number];
}

function allFeatureResponses(
  features: StimulusFeatures,
  config: TaskConfig
): Record<RuleFeature, ExpectedResponse> {
  return {
    shape: responseForFeature(features, 'shape', config),
    pattern: responseForFeature(features, 'pattern', config),
    number: responseForFeature(features, 'number', config),
  };
}

function congruencyOf(
  features: StimulusFeatures,
  rule: RuleFeature,
  config: TaskConfig
): Congruency {
  const expected = responseForFeature(features, rule, config);
  const by = allFeatureResponses(features, config);
  const others = (Object.keys(by) as RuleFeature[]).filter((k) => k !== rule);
  return others.every((k) => by[k] === expected) ? 'congruent' : 'incongruent';
}

function randomFeatures(random: () => number): StimulusFeatures {
  return {
    shape: random() < 0.5 ? 'circle' : 'square',
    pattern: random() < 0.5 ? 'solid' : 'striped',
    number: random() < 0.5 ? 'one' : 'two',
  };
}

function featuresMatching(
  rule: RuleFeature,
  want: ExpectedResponse,
  wantCongruent: boolean,
  random: () => number,
  config: TaskConfig,
  maxAttempts = 40
): StimulusFeatures {
  for (let i = 0; i < maxAttempts; i++) {
    const f = randomFeatures(random);
    // Force relevant feature to map to want
    if (rule === 'shape') {
      f.shape = (Object.entries(config.responseMap.shape).find(([, v]) => v === want)?.[0] ??
        'circle') as ShapeValue;
    } else if (rule === 'pattern') {
      f.pattern = (Object.entries(config.responseMap.pattern).find(([, v]) => v === want)?.[0] ??
        'solid') as PatternValue;
    } else {
      f.number = (Object.entries(config.responseMap.number).find(([, v]) => v === want)?.[0] ??
        'one') as NumberValue;
    }

    const c = congruencyOf(f, rule, config);
    if (wantCongruent && c === 'congruent') return f;
    if (!wantCongruent && c === 'incongruent') return f;
  }
  // Fallback: force incongruent by flipping an irrelevant feature
  const f = randomFeatures(random);
  if (rule === 'shape') {
    f.shape = want === 'a' ? 'circle' : 'square';
    if (!wantCongruent) f.pattern = want === 'a' ? 'striped' : 'solid';
    else {
      f.pattern = want === 'a' ? 'solid' : 'striped';
      f.number = want === 'a' ? 'one' : 'two';
    }
  } else if (rule === 'pattern') {
    f.pattern = want === 'a' ? 'solid' : 'striped';
    if (!wantCongruent) f.shape = want === 'a' ? 'square' : 'circle';
    else {
      f.shape = want === 'a' ? 'circle' : 'square';
      f.number = want === 'a' ? 'one' : 'two';
    }
  } else {
    f.number = want === 'a' ? 'one' : 'two';
    if (!wantCongruent) f.shape = want === 'a' ? 'square' : 'circle';
    else {
      f.shape = want === 'a' ? 'circle' : 'square';
      f.pattern = want === 'a' ? 'solid' : 'striped';
    }
  }
  return f;
}

function stimulusProps(features: StimulusFeatures, rule: RuleFeature): StimulusProperties {
  return {
    features,
    label: `${rule}_${features.shape}_${features.pattern}_${features.number}`,
  };
}

function buildRuleSequence(
  mode: string,
  trialCount: number,
  random: () => number,
  switchRatio: number,
  allowedRules: readonly RuleFeature[]
): RuleFeature[] {
  if (mode === 'practice_halves') {
    const half = Math.floor(trialCount / 2);
    return [
      ...Array.from({ length: half }, () => 'shape' as RuleFeature),
      ...Array.from({ length: trialCount - half }, () => 'pattern' as RuleFeature),
    ];
  }
  if (mode === 'rule_learning_thirds') {
    const third = Math.floor(trialCount / 3);
    const rules: RuleFeature[] = [];
    for (let i = 0; i < trialCount; i++) {
      if (i < third) rules.push('shape');
      else if (i < third * 2) rules.push('pattern');
      else rules.push('number');
    }
    return rules;
  }
  if (mode === 'predictable_pairs') {
    const pairRules = allowedRules.length >= 2 ? [allowedRules[0], allowedRules[1]] : ['shape', 'pattern'];
    const out: RuleFeature[] = [];
    let idx = 0;
    while (out.length < trialCount) {
      const r = pairRules[idx % pairRules.length] as RuleFeature;
      out.push(r, r);
      idx++;
    }
    return out.slice(0, trialCount);
  }
  // mixed_cued
  const out: RuleFeature[] = [];
  let current: RuleFeature = allowedRules[Math.floor(random() * allowedRules.length)] ?? 'shape';
  out.push(current);
  for (let i = 1; i < trialCount; i++) {
    const shouldSwitch = random() < switchRatio;
    if (shouldSwitch) {
      const others = allowedRules.filter((r) => r !== current);
      current = others[Math.floor(random() * others.length)] ?? current;
    }
    out.push(current);
  }
  // Soft-cap same-rule runs
  const maxRun = TASK_CONFIG.sequenceConstraints.maxSameRuleRun;
  for (let i = maxRun; i < out.length; i++) {
    const run = out.slice(i - maxRun, i + 1);
    if (run.every((r) => r === out[i])) {
      const others = allowedRules.filter((r) => r !== out[i]);
      out[i] = others[Math.floor(random() * others.length)] ?? out[i];
    }
  }
  return out;
}

function generateBlock(
  blockKey: BlockKey,
  random: () => number,
  trialOffset: number,
  config: TaskConfig
): PlannedTrial[] {
  const block = config.blocks[blockKey];
  if (!block || block.trialCount <= 0) return [];

  const mode = block.ruleSequenceMode;
  const switchRatio = 'switchRatio' in block ? Number(block.switchRatio) : 0.4;
  const allowedRules: readonly RuleFeature[] =
    'rules' in block && Array.isArray(block.rules)
      ? (block.rules as readonly RuleFeature[])
      : (['shape', 'pattern', 'number'] as const);

  const rules = buildRuleSequence(mode, block.trialCount, random, switchRatio, allowedRules);
  const incongruentRatio = Number(block.incongruentRatio);

  const targets: ExpectedResponse[] = shuffle(
    Array.from({ length: block.trialCount }, (_, i) => (i % 2 === 0 ? 'a' : 'b') as ExpectedResponse),
    random
  );

  const trials: PlannedTrial[] = [];
  let prevRule: RuleFeature | null = null;
  let prevStimKey = '';

  for (let i = 0; i < block.trialCount; i++) {
    const rule = rules[i];
    const wantCongruent = random() >= incongruentRatio;
    let features = featuresMatching(rule, targets[i], wantCongruent, random, config);
    let stimKey = `${features.shape}-${features.pattern}-${features.number}`;
    let attempts = 0;
    while (stimKey === prevStimKey && attempts < 8) {
      features = featuresMatching(rule, targets[i], wantCongruent, random, config);
      stimKey = `${features.shape}-${features.pattern}-${features.number}`;
      attempts++;
    }
    prevStimKey = stimKey;

    const responseByFeature = allFeatureResponses(features, config);
    const expectedResponse = responseByFeature[rule];
    const isSwitch = prevRule != null && prevRule !== rule;
    const isiMs =
      config.timing.isiMinMs +
      Math.floor(random() * (config.timing.isiMaxMs - config.timing.isiMinMs + 1));

    trials.push({
      trialNumber: trialOffset + i + 1,
      blockId: block.id,
      blockType: blockKey as BlockType,
      stimulusId: `cft_${blockKey}_${i + 1}_${stimKey}`,
      stimulus: stimulusProps(features, rule),
      rule,
      previousRule: prevRule,
      isSwitch,
      congruency: congruencyOf(features, rule, config),
      expectedResponse,
      responseByFeature,
      stimulusDurationMs: config.timing.stimulusDurationMs,
      isiMs,
    });
    prevRule = rule;
  }

  return trials;
}

export function generateSessionPlan(
  seed: number,
  config: TaskConfig = TASK_CONFIG
): SessionPlan {
  const random = createSeededRandom(seed);
  const order: BlockKey[] = [
    'practice',
    'rule_learning',
    'predictable_switch',
    'cued_switch',
    'interference',
  ];
  const byBlock = {} as SessionPlan['byBlock'];
  const trials: PlannedTrial[] = [];
  let offset = 0;
  for (const key of order) {
    const blockTrials = generateBlock(key, random, offset, config);
    byBlock[key] = blockTrials;
    trials.push(...blockTrials);
    offset += blockTrials.length;
  }
  return { seed, trials, byBlock };
}
