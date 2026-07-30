import type { VisualMode } from '../types';

export interface InstructionCopy {
  productName: string;
  brandLine: string;
  experimentalNotice: string;
  shortGoal: string;
  ruleGoA: string;
  ruleGoB: string;
  ruleNoGo: string;
  ruleInterference: string;
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
}

const SHARED_BRAND = 'By Habib Labs LLC';
const EXPERIMENTAL =
  'This is an experimental research task under development. It is not a diagnostic test and has not been clinically validated or normed.';

const clinical: InstructionCopy = {
  productName: 'Response Inhibition Task',
  brandLine: SHARED_BRAND,
  experimentalNotice: EXPERIMENTAL,
  shortGoal: 'Respond as quickly and accurately as possible. Do not respond when the stop cue appears.',
  ruleGoA: 'Blue diamond: press F (or tap Left).',
  ruleGoB: 'Amber hexagon: press J (or tap Right).',
  ruleNoGo: 'Stop ring with slash: do not respond.',
  ruleInterference:
    'When a double outer frame appears, the left/right keys are reversed for that trial. Still withhold for stop cues.',
  practiceIntro: 'Practice first. Feedback is shown only during practice.',
  practiceFeedbackCorrect: 'Correct.',
  practiceFeedbackIncorrect: 'Not quite. Review the rule and continue.',
  scoredStart: 'Scored trials begin. No feedback will be shown.',
  betweenBlocks: {
    baseline: 'Motor check. Respond using the rules you practiced.',
    habit: 'Continue. Most signals require a response.',
    standard: 'Continue. Occasional stop cues require no response.',
    interference: 'New rule: double frame reverses the response keys.',
  },
  completionThanks: 'Session complete. Thank you.',
  completionExplain:
    'This task measures how people withhold automatic responses. Results are for research use and are not diagnostic.',
  controlsKeyboard: 'Use F for the blue diamond and J for the amber hexagon.',
  controlsTouch: 'Tap Left for the blue diamond and Right for the amber hexagon.',
  confirmUnderstood: 'I understand the controls',
};

const game: InstructionCopy = {
  productName: 'Signal Gate',
  brandLine: SHARED_BRAND,
  experimentalNotice: EXPERIMENTAL,
  shortGoal: 'Keep the gate clear. Sort allowed signals. Hold for restricted ones.',
  ruleGoA: 'Blue diamond → open Left lane (F / Left).',
  ruleGoB: 'Amber hexagon → open Right lane (J / Right).',
  ruleNoGo: 'Restricted signal (stop ring): leave the gate closed.',
  ruleInterference:
    'Priority override: a double frame swaps the lanes for that signal. Restricted signals still mean hold.',
  practiceIntro: 'Calibration run. You will see brief feedback here only.',
  practiceFeedbackCorrect: 'Gate clear.',
  practiceFeedbackIncorrect: 'Adjust. Check the signal rules.',
  scoredStart: 'Live monitoring begins. Stay focused — no outcome cues during the run.',
  betweenBlocks: {
    baseline: 'Systems check.',
    habit: 'Traffic picks up. Most signals are clear to sort.',
    standard: 'Watch for restricted signals.',
    interference: 'Override frames online. Lanes can swap.',
  },
  completionThanks: 'Monitoring complete. Thanks for helping map how people manage automatic actions.',
  completionExplain:
    'Signal Gate is a research experience about response control. It is not an IQ test or medical assessment.',
  controlsKeyboard: 'F opens the left lane. J opens the right lane.',
  controlsTouch: 'Left tap / Right tap matches the lanes.',
  confirmUnderstood: 'Ready to calibrate',
};

export function getInstructions(mode: VisualMode): InstructionCopy {
  return mode === 'clinical' ? clinical : game;
}
