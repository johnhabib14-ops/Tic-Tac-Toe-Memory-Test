/**
 * GMT 2.2 types. Harder variant: span 6 (and optional 7), shorter timing, 8-target copy, clean_trial.
 */

export type GMT22Phase =
  | 'consent'
  | 'demographics'
  | 'copy_instructions'
  | 'copy'
  | 'memory_instructions'
  | 'memory'
  | 'results';

export type GMT22Condition =
  | 'baseline'
  | 'ignore_distractor'
  | 'remember_distractor'
  | 'delay';

export type GMT22CellSymbol = 'X' | 'O' | 'Plus' | '';

export type GMT22GridMap = GMT22CellSymbol[];

export type GMT22Gender =
  | 'Male'
  | 'Female'
  | 'Nonbinary'
  | 'Prefer not to say'
  | 'Self describe';

export type GMT22DeviceType =
  | 'Desktop'
  | 'Tablet'
  | 'Phone'
  | 'Other'
  | 'Prefer not to say';

export interface GMT22Participant {
  session_id: string;
  participant_id: string;
  birth_year: number;
  age: number;
  gender: string;
  education: string;
  device_type: GMT22DeviceType;
  session_seed: number;
}

export interface GMT22CopyResult {
  copy_hits: number;
  copy_total_rt_ms: number;
  copy_target_map: GMT22GridMap;
  copy_response_map: GMT22GridMap;
}

export interface GMT22MemoryTrialRecord {
  condition: GMT22Condition;
  span: number;
  target_map: GMT22GridMap;
  response_map: GMT22GridMap;
  recon_rt_ms: number;
  hits: number;
  commissions: number;
  accuracy_raw: number;
  timeout: boolean;
  clean_trial: boolean;
}

export interface GMT22ConditionSummary {
  mean_accuracy: number;
  mean_rt: number;
  total_commissions: number;
  clean_trial_rate: number;
}

export interface GMT22Summary {
  mean_accuracy_per_condition: Record<GMT22Condition, number>;
  mean_rt_per_condition: Record<GMT22Condition, number>;
  total_commissions_per_condition: Record<GMT22Condition, number>;
  clean_trial_rate_per_condition: Record<GMT22Condition, number>;
  global_accuracy: number;
  global_mean_rt: number;
  global_clean_trial_rate: number;
}

export interface GMT22ItemBankEntry {
  condition: GMT22Condition;
  span: number;
  target_map: GMT22GridMap;
  distractor_map: GMT22GridMap;
}

export const GMT22_CONDITIONS: GMT22Condition[] = [
  'baseline',
  'ignore_distractor',
  'remember_distractor',
  'delay',
];

/** Base spans 2–6; span 7 added if VITE_GMT22_OVERLOAD=1 */
export const GMT22_BASE_SPANS = [2, 3, 4, 5, 6] as const;
export const GMT22_OVERLOAD_SPAN = 7;

export const COPY_GRID_SIZE = 4;
export const COPY_NUM_TARGETS = 8;
export const COPY_TIME_LIMIT_MS = 30 * 1000;

export const DELAY_FIXATION_MS = 4000;
