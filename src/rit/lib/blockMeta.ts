import { TASK_CONFIG } from '../config/taskConfig';
import type { BlockType } from '../types';

const PRIMARY_BLOCKS: BlockType[] = ['habit', 'standard', 'interference'];

/** Whether a block contributes to the provisional Inhibitory Control Score */
export function blockIncludeInPrimaryScore(blockType: BlockType): boolean {
  if (blockType === 'practice' || blockType === 'baseline' || blockType === 'adaptive') {
    return false;
  }
  const block = TASK_CONFIG.blocks[blockType as 'habit' | 'standard' | 'interference'];
  if (block && 'includeInPrimaryScore' in block) {
    return Boolean(block.includeInPrimaryScore);
  }
  return PRIMARY_BLOCKS.includes(blockType);
}

export function isScoredBlock(blockType: BlockType): boolean {
  return blockIncludeInPrimaryScore(blockType);
}
