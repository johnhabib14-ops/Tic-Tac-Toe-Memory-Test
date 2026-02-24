/**
 * GMT 2 Span 7: 4 conditions, spans 2–7, 2 trials per span, discontinue. All conditions start at span 2.
 */

export type GMT22Phase =
  | 'intro'
  | 'consent'
  | 'demographics'
  | 'practice'
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

export type GMT22ConditionOrder = 'A' | 'B';

export interface GMT22Participant {
  session_id: string;
  participant_id: string;
  birth_year: number;
  age: number;
  gender: string;
  education: string;
  device_type: GMT22DeviceType;
  session_seed: number;
  condition_order: GMT22ConditionOrder;
}

export interface GMT22CopyResult {
  copy_item_id: string;
  copy_hits: number;
  copy_total_rt_ms: number;
  copy_target_map: GMT22GridMap;
  copy_response_map: GMT22GridMap;
}

export interface GMT22MemoryTrialRecord {
  condition: GMT22Condition;
  span: number;
  trial_index: 1 | 2;
  item_id: string;
  target_map: GMT22GridMap;
  distractor_map: GMT22GridMap;
  response_map: GMT22GridMap;
  recon_rt_ms: number;
  hits: number;
  commissions: number;
  omissions: number;
  binding_errors: number;
  total_targets: number;
  accuracy_raw: number;
  passed: boolean;
  timeout: boolean;
}

/** Same shape as memory trial for submission. */
export interface GMT22PracticeTrialRecord {
  condition: GMT22Condition;
  span: number;
  trial_index: 1 | 2;
  item_id: string;
  target_map: GMT22GridMap;
  distractor_map: GMT22GridMap;
  response_map: GMT22GridMap;
  recon_rt_ms: number;
  hits: number;
  commissions: number;
  omissions: number;
  binding_errors: number;
  total_targets: number;
  accuracy_raw: number;
  passed: boolean;
  timeout: boolean;
}

export interface GMT22ConditionSummary {
  span_estimate: number;
  span_consistency_flag: boolean;
  mean_accuracy: number;
  mean_rt_ms: number;
}

export interface GMT22Summary {
  by_condition: Record<GMT22Condition, GMT22ConditionSummary>;
  baseline_span: number;
  ignore_span: number;
  remember_span: number;
  delay_span: number;
  interference_cost: number;
  binding_cost: number;
  delay_cost: number;
  practice_failed: boolean;
  practice_passed_first_try: boolean;
  attention_check_failed: boolean;
  condition_order: GMT22ConditionOrder;
}

export interface GMT22ItemBankEntry {
  item_id: string;
  condition: GMT22Condition;
  span: number;
  target_map: GMT22GridMap;
  distractor_map: GMT22GridMap;
  /** Optional metadata for span 6–7 pairing; computed at load if missing. */
  adjacent_pairs_count?: number;
  distinct_rows_used?: number;
  distinct_cols_used?: number;
}

export const GMT22_CONDITIONS: GMT22Condition[] = [
  'baseline',
  'ignore_distractor',
  'remember_distractor',
  'delay',
];

/** Order A: baseline, ignore_distractor, remember_distractor, delay. Order B: baseline, delay, ignore_distractor, remember_distractor. */
export function getConditionOrder(order: GMT22ConditionOrder): GMT22Condition[] {
  return order === 'A'
    ? ['baseline', 'ignore_distractor', 'remember_distractor', 'delay']
    : ['baseline', 'delay', 'ignore_distractor', 'remember_distractor'];
}

export const GMT22_SPANS = [2, 3, 4, 5, 6, 7] as const;
export const GMT22_TRIALS_PER_SPAN = 2;

export const COPY_GRID_SIZE = 4;
export const COPY_NUM_TARGETS = 8;
export const COPY_TIME_LIMIT_MS = 30 * 1000;

export const DELAY_FIXATION_MS = 4000;
