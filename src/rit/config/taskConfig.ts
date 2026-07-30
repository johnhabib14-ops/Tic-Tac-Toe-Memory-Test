/**
 * Research parameters for RIT. Editable without changing task logic.
 * Adaptive block is architected but disabled until audited.
 */

export type ProtocolProfile = 'full' | 'pilot' | 'demo';

const BASE_TASK_CONFIG = {
  brandAttribution: 'By Habib Labs LLC',
  productName: 'Response Inhibition Task',
  experimentalNotice:
    'Experimental research measure under development. Not diagnostic, clinically validated, or normed.',

  /** Minimum viewport for valid administration */
  minScreenWidth: 360,
  minScreenHeight: 480,

  /** Anticipatory responses faster than this are flagged (ms) */
  anticipatoryRtMs: 150,

  /** Correct go responses slower than this may indicate excessive slowing */
  excessiveSlowingRtMs: 1200,

  timing: {
    stimulusDurationMs: 750,
    isiMinMs: 500,
    isiMaxMs: 900,
    fixationMs: 300,
    maxResponseWindowMs: 750,
    orientationDemoMs: 900,
  },

  blocks: {
    practice: {
      id: 'practice',
      trialCount: 12,
      goRatio: 0.75,
      nogoRatio: 0.25,
      rule: 'standard' as const,
      scored: false,
      passAccuracy: 0.75,
      maxRepetitions: 3,
    },
    baseline: {
      id: 'baseline',
      trialCount: 20,
      goRatio: 0.8,
      nogoRatio: 0.2,
      rule: 'standard' as const,
      scored: false,
      includeInPrimaryScore: false,
    },
    habit: {
      id: 'habit',
      trialCount: 40,
      goRatio: 0.85,
      nogoRatio: 0.15,
      rule: 'standard' as const,
      scored: true,
      includeInPrimaryScore: true,
    },
    standard: {
      id: 'standard',
      trialCount: 48,
      goRatio: 0.8,
      nogoRatio: 0.2,
      rule: 'standard' as const,
      scored: true,
      includeInPrimaryScore: true,
    },
    interference: {
      id: 'interference',
      trialCount: 40,
      goRatio: 0.8,
      nogoRatio: 0.2,
      rule: 'reversed_mapping' as const,
      scored: true,
      includeInPrimaryScore: true,
    },
    adaptive: {
      id: 'adaptive',
      enabled: false,
      trialCount: 0,
      goRatio: 0.8,
      nogoRatio: 0.2,
      rule: 'standard' as const,
      scored: false,
      includeInPrimaryScore: false,
      notes: 'Adaptive difficulty reserved for future audited release.',
    },
  },

  sequenceConstraints: {
    /**
     * Max consecutive go or no-go trials within a block.
     * At ~85% go, a hard cap of 4 is mathematically infeasible without
     * raising no-go density; 6 keeps sequences from becoming obvious
     * while preserving the intended go-dominant habit formation.
     */
    maxSameTypeRun: 6,
    maxSameStimulusRun: 3,
    maxStrictAlternation: 6,
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

/** Full protocol (default). */
export const TASK_CONFIG = {
  ...BASE_TASK_CONFIG,
  taskVersion: '0.2.0',
  protocolProfile: 'full' as ProtocolProfile,
};

/**
 * Supervised pilot: shorter scored blocks, same ratios/timings/scoring rules.
 * Select via intake toggle or ?profile=pilot
 */
export const PILOT_TASK_CONFIG = {
  ...BASE_TASK_CONFIG,
  taskVersion: '0.2.0-pilot',
  protocolProfile: 'pilot' as ProtocolProfile,
  blocks: {
    ...BASE_TASK_CONFIG.blocks,
    practice: { ...BASE_TASK_CONFIG.blocks.practice, trialCount: 10 },
    baseline: { ...BASE_TASK_CONFIG.blocks.baseline, trialCount: 16 },
    habit: { ...BASE_TASK_CONFIG.blocks.habit, trialCount: 24 },
    standard: { ...BASE_TASK_CONFIG.blocks.standard, trialCount: 32 },
    interference: { ...BASE_TASK_CONFIG.blocks.interference, trialCount: 24 },
  },
};

/** Showcase protocol — few trials per block for demos. */
export const DEMO_TASK_CONFIG = {
  ...BASE_TASK_CONFIG,
  taskVersion: '0.2.0-demo',
  protocolProfile: 'demo' as ProtocolProfile,
  productName: 'Response Inhibition Task (Demo)',
  blocks: {
    ...BASE_TASK_CONFIG.blocks,
    practice: {
      ...BASE_TASK_CONFIG.blocks.practice,
      trialCount: 6,
      passAccuracy: 0.5,
      maxRepetitions: 2,
    },
    baseline: { ...BASE_TASK_CONFIG.blocks.baseline, trialCount: 8 },
    habit: { ...BASE_TASK_CONFIG.blocks.habit, trialCount: 10 },
    standard: { ...BASE_TASK_CONFIG.blocks.standard, trialCount: 12 },
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
