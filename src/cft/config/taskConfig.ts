/**
 * Research parameters for CFT. Editable without changing task logic.
 */

export type ProtocolProfile = 'full' | 'pilot' | 'demo';

const BASE_TASK_CONFIG = {
  brandAttribution: 'By Habib Labs LLC',
  productName: 'Cognitive Flexibility Task',
  experimentalNotice:
    'Experimental research measure under development. Not diagnostic, clinically validated, or normed.',

  minScreenWidth: 360,
  minScreenHeight: 480,

  anticipatoryRtMs: 150,
  excessiveSlowingRtMs: 1400,

  timing: {
    stimulusDurationMs: 2000,
    isiMinMs: 500,
    isiMaxMs: 900,
    fixationMs: 300,
    maxResponseWindowMs: 2000,
    orientationDemoMs: 900,
    cueLeadMs: 0,
  },

  /** Fixed left/right mapping for each feature value. */
  responseMap: {
    shape: { circle: 'a' as const, square: 'b' as const },
    pattern: { solid: 'a' as const, striped: 'b' as const },
    number: { one: 'a' as const, two: 'b' as const },
  },

  blocks: {
    practice: {
      id: 'practice',
      trialCount: 16,
      scored: false,
      passAccuracy: 0.75,
      maxRepetitions: 3,
      /** Practice teaches shape then pattern in fixed halves. */
      ruleSequenceMode: 'practice_halves' as const,
      incongruentRatio: 0.25,
      includeInPrimaryScore: false,
    },
    rule_learning: {
      id: 'rule_learning',
      trialCount: 36,
      scored: false,
      includeInPrimaryScore: false,
      ruleSequenceMode: 'rule_learning_thirds' as const,
      incongruentRatio: 0.2,
      passAccuracy: 0.7,
    },
    predictable_switch: {
      id: 'predictable_switch',
      trialCount: 48,
      scored: true,
      includeInPrimaryScore: true,
      ruleSequenceMode: 'predictable_pairs' as const,
      incongruentRatio: 0.4,
      rules: ['shape', 'pattern'] as const,
    },
    cued_switch: {
      id: 'cued_switch',
      trialCount: 48,
      scored: true,
      includeInPrimaryScore: true,
      ruleSequenceMode: 'mixed_cued' as const,
      incongruentRatio: 0.5,
      switchRatio: 0.45,
      rules: ['shape', 'pattern', 'number'] as const,
    },
    interference: {
      id: 'interference',
      trialCount: 40,
      scored: true,
      includeInPrimaryScore: true,
      ruleSequenceMode: 'mixed_cued' as const,
      incongruentRatio: 0.75,
      switchRatio: 0.5,
      rules: ['shape', 'pattern', 'number'] as const,
    },
    adaptive: {
      id: 'adaptive',
      enabled: false,
      trialCount: 0,
      scored: false,
      includeInPrimaryScore: false,
      ruleSequenceMode: 'mixed_cued' as const,
      incongruentRatio: 0.5,
      notes: 'Adaptive difficulty reserved for future audited release.',
    },
  },

  sequenceConstraints: {
    maxSameRuleRun: 4,
    maxSameStimulusRun: 2,
    maxStrictAlternation: 8,
  },

  keys: {
    responseA: ['f', 'F', 'ArrowLeft'],
    responseB: ['j', 'J', 'ArrowRight'],
  },

  dataRetentionPolicyDefault:
    'Session data retained per study protocol; public anonymous data minimized. Contact study team to request deletion.',

  privacy: {
    separateRecontactFromPerformance: true,
    collectDirectIdentifiersInPublic: false,
  },
} as const;

export const TASK_CONFIG = {
  ...BASE_TASK_CONFIG,
  taskVersion: '0.1.0',
  protocolProfile: 'full' as ProtocolProfile,
};

export const PILOT_TASK_CONFIG = {
  ...BASE_TASK_CONFIG,
  taskVersion: '0.1.0-pilot',
  protocolProfile: 'pilot' as ProtocolProfile,
  blocks: {
    ...BASE_TASK_CONFIG.blocks,
    practice: { ...BASE_TASK_CONFIG.blocks.practice, trialCount: 12 },
    rule_learning: { ...BASE_TASK_CONFIG.blocks.rule_learning, trialCount: 24 },
    predictable_switch: { ...BASE_TASK_CONFIG.blocks.predictable_switch, trialCount: 32 },
    cued_switch: { ...BASE_TASK_CONFIG.blocks.cued_switch, trialCount: 32 },
    interference: { ...BASE_TASK_CONFIG.blocks.interference, trialCount: 24 },
  },
};

/** Showcase protocol — few trials per block for demos. */
export const DEMO_TASK_CONFIG = {
  ...BASE_TASK_CONFIG,
  taskVersion: '0.1.0-demo',
  protocolProfile: 'demo' as ProtocolProfile,
  productName: 'Cognitive Flexibility Task (Demo)',
  blocks: {
    ...BASE_TASK_CONFIG.blocks,
    practice: {
      ...BASE_TASK_CONFIG.blocks.practice,
      trialCount: 8,
      passAccuracy: 0.5,
      maxRepetitions: 2,
    },
    rule_learning: { ...BASE_TASK_CONFIG.blocks.rule_learning, trialCount: 12 },
    predictable_switch: {
      ...BASE_TASK_CONFIG.blocks.predictable_switch,
      trialCount: 12,
    },
    cued_switch: { ...BASE_TASK_CONFIG.blocks.cued_switch, trialCount: 12 },
    interference: { ...BASE_TASK_CONFIG.blocks.interference, trialCount: 10 },
  },
};

export type TaskConfig =
  | typeof TASK_CONFIG
  | typeof PILOT_TASK_CONFIG
  | typeof DEMO_TASK_CONFIG;

export function getTaskConfig(profile: ProtocolProfile = 'full'): TaskConfig {
  if (profile === 'demo') return DEMO_TASK_CONFIG;
  if (profile === 'pilot') return PILOT_TASK_CONFIG;
  return TASK_CONFIG;
}

export function resolveProtocolProfileFromSearch(
  search: string | undefined | null
): ProtocolProfile {
  if (!search) return 'full';
  try {
    const q = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    const p = q.get('profile');
    if (p === 'demo') return 'demo';
    if (p === 'pilot') return 'pilot';
    return 'full';
  } catch {
    return 'full';
  }
}
