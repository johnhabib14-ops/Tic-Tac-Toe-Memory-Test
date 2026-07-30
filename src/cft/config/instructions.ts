import type { VisualMode } from '../types';

export interface InstructionCopy {
  productName: string;
  brandLine: string;
  experimentalNotice: string;
  shortGoal: string;
  ruleShape: string;
  rulePattern: string;
  ruleNumber: string;
  ruleSwitch: string;
  ruleConflict: string;
  practiceIntro: string;
  practiceFeedbackCorrect: string;
  practiceFeedbackIncorrect: string;
  scoredStart: string;
  betweenBlocks: Record<string, string>;
  completionThanks: string;
  completionExplain: string;
  controlsKeyboard: string;
  controlsTouch: string;
  confirmUnderstood: string;
  cueLabels: Record<'shape' | 'pattern' | 'number', string>;
}

const SHARED_BRAND = 'By Habib Labs LLC';
const EXPERIMENTAL =
  'This is an experimental research task under development. It is not a diagnostic test and has not been clinically validated or normed.';

const clinical: InstructionCopy = {
  productName: 'Cognitive Flexibility Task',
  brandLine: SHARED_BRAND,
  experimentalNotice: EXPERIMENTAL,
  shortGoal:
    'Sort each object using the rule shown at the top. When the rule changes, switch immediately.',
  ruleShape: 'Shape rule: circle → F (Left); square → J (Right).',
  rulePattern: 'Pattern rule: solid → F (Left); striped → J (Right).',
  ruleNumber: 'Number rule: one object → F (Left); two objects → J (Right).',
  ruleSwitch:
    'The cue at the top tells you which rule applies on each trial. Ignore previous rules after a change.',
  ruleConflict:
    'Other features may suggest a different answer. Always follow the cued rule only.',
  practiceIntro: 'Practice first with shape, then pattern. Feedback appears only here.',
  practiceFeedbackCorrect: 'Correct.',
  practiceFeedbackIncorrect: 'Not quite. Check the cue and continue.',
  scoredStart: 'Scored trials begin. No feedback will be shown.',
  betweenBlocks: {
    rule_learning: 'Learn each rule separately: shape, then pattern, then number.',
    predictable_switch: 'Rules will alternate in a clear pattern. Watch the cue.',
    cued_switch: 'Rules will mix. Inspect the cue before each response.',
    interference: 'Features will conflict more often. Stay with the cued rule.',
  },
  completionThanks: 'Session complete. Thank you.',
  completionExplain:
    'This task measures how people switch between rules. Results are for research use and are not diagnostic.',
  controlsKeyboard: 'F / Left arrow = Left response. J / Right arrow = Right response.',
  controlsTouch: 'Tap Left or Right according to the active rule.',
  confirmUnderstood: 'I understand the controls',
  cueLabels: {
    shape: 'RULE: SHAPE',
    pattern: 'RULE: PATTERN',
    number: 'RULE: NUMBER',
  },
};

const game: InstructionCopy = {
  productName: 'Rule Shift',
  brandLine: SHARED_BRAND,
  experimentalNotice: EXPERIMENTAL,
  shortGoal: 'Sort signals by the active channel shown above. When the channel flips, flip with it.',
  ruleShape: 'Shape channel: circle → Left lane; square → Right lane.',
  rulePattern: 'Pattern channel: solid → Left; striped → Right.',
  ruleNumber: 'Count channel: one → Left; two → Right.',
  ruleSwitch: 'The top banner is your live channel. Drop the old channel the moment it changes.',
  ruleConflict: 'Other markings can mislead. Trust only the active channel.',
  practiceIntro: 'Calibration: shape channel, then pattern channel. Brief feedback here only.',
  practiceFeedbackCorrect: 'Channel locked.',
  practiceFeedbackIncorrect: 'Recheck the banner.',
  scoredStart: 'Live sorting begins. No outcome cues during the run.',
  betweenBlocks: {
    rule_learning: 'Learn each channel on its own.',
    predictable_switch: 'Channels alternate in pairs. Stay sharp.',
    cued_switch: 'Channels mix. Read the banner every time.',
    interference: 'Heavy interference. Banner only.',
  },
  completionThanks: 'Sorting complete. Thanks for helping map how people switch strategies.',
  completionExplain:
    'Rule Shift is a research experience about mental set-shifting. It is not an IQ test or medical assessment.',
  controlsKeyboard: 'F opens the left lane. J opens the right lane.',
  controlsTouch: 'Left tap / Right tap matches the lanes.',
  confirmUnderstood: 'Ready to calibrate',
  cueLabels: {
    shape: 'CHANNEL: SHAPE',
    pattern: 'CHANNEL: PATTERN',
    number: 'CHANNEL: COUNT',
  },
};

export function getInstructions(mode: VisualMode): InstructionCopy {
  return mode === 'clinical' ? clinical : game;
}
