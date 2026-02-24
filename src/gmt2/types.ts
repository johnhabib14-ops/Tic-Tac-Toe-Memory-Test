/**
 * GMT 2.1 types. Do not depend on src/types (GMT 1.0).
 */

export type GMT2Phase =
  | 'consent'
  | 'demographics'
  | 'copy'
  | 'memory'
  | 'results';

export type GMT2Condition =
  | 'baseline'
  | 'ignore_distractor'
  | 'remember_distractor'
  | 'delay';

/** Cell symbol for GMT 2.1: X, O, Plus, or empty. */
export type GMT2CellSymbol = 'X' | 'O' | 'Plus' | '';

/** Grid as array of 16 cells; index = cell index 0–15. */
export type GMT2GridMap = GMT2CellSymbol[];

export type GMT2Gender =
  | 'Male'
  | 'Female'
  | 'Nonbinary'
  | 'Prefer not to say'
  | 'Self describe';

export type GMT2DeviceType =
  | 'Desktop'
  | 'Tablet'
  | 'Phone'
  | 'Other'
  | 'Prefer not to say';

export interface GMT2Participant {
  session_id: string;
  /** User-entered or researcher-assigned ID. */
  participant_id: string;
  birth_year: number;
  /** Gender option or "Self describe: …" when custom text is entered. */
  gender: string;
  education: string;
  device_type: GMT2DeviceType;
  /** Used for seeded item selection. */
  session_seed: number;
}

export interface GMT2CopyResult {
  copy_hits: number;
  copy_total_rt_ms: number;
  copy_target_map: GMT2GridMap;
  copy_response_map: GMT2GridMap;
}

export interface GMT2MemoryTrialRecord {
  condition: GMT2Condition;
  span: number;
  target_map: GMT2GridMap;
  response_map: GMT2GridMap;
  recon_rt_ms: number;
  hits: number;
  commissions: number;
  accuracy_raw: number;
  timeout: boolean;
}

export interface GMT2Summary {
  mean_accuracy_per_condition: Record<GMT2Condition, number>;
  mean_rt_per_condition: Record<GMT2Condition, number>;
  global_accuracy: number;
  global_mean_rt: number;
}

/** Item from pre-generated bank (one per trial). */
export interface GMT2ItemBankEntry {
  condition: GMT2Condition;
  span: number;
  target_map: GMT2GridMap;
  distractor_map: GMT2GridMap;
}

export const GMT2_SPANS = [2, 3, 4, 5] as const;
export const GMT2_CONDITIONS: GMT2Condition[] = [
  'baseline',
  'ignore_distractor',
  'remember_distractor',
  'delay',
];

export const COPY_GRID_SIZE = 4;
export const COPY_NUM_TARGETS = 6;
export const COPY_TIME_LIMIT_MS = 30 * 1000;
