import { TASK_CONFIG } from '../config/taskConfig';
import type { BlockType } from '../types';

const PRIMARY_BLOCKS: BlockType[] = [
  'predictable_switch',
  'cued_switch',
  'interference',
];

/** Whether a block contributes to the provisional Cognitive Flexibility Score */
export function blockIncludeInPrimaryScore(blockType: BlockType): boolean {
  if (
    blockType === 'practice' ||
    blockType === 'rule_learning' ||
    blockType === 'adaptive'
  ) {
    return false;
  }
  const block =
    TASK_CONFIG.blocks[
      blockType as 'predictable_switch' | 'cued_switch' | 'interference'
    ];
  if (block && 'includeInPrimaryScore' in block) {
    return Boolean(block.includeInPrimaryScore);
  }
  return PRIMARY_BLOCKS.includes(blockType);
}

export function isScoredBlock(blockType: BlockType): boolean {
  return blockIncludeInPrimaryScore(blockType);
}
