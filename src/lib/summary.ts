import type { TrialRecord, SummaryMetrics } from '../types';

export function computeSummary(trials: TrialRecord[]): SummaryMetrics {
  const totalCorrectPlacements = trials.reduce((s, t) => s + (t.correctPlacements ?? 0), 0);
  const totalTargets = trials.reduce((s, t) => s + (t.numTargets ?? 0), 0);
  const totalIncorrectPlacements = trials.reduce(
    (s, t) => s + (t.commissionErrors ?? 0) + (t.wrongShapeInTarget ?? 0),
    0
  );
  const totalWrongShapeUsed = trials.reduce((s, t) => s + (t.wrongShapeInTarget ?? 0), 0);
  const overallAccuracyPercent =
    totalTargets > 0 ? (totalCorrectPlacements / totalTargets) * 100 : 0;
  const reactionTimes = trials.map((t) => t.reactionTimeMs ?? -1).filter((t) => t >= 0);
  const meanReactionTimeMs =
    reactionTimes.length > 0
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      : 0;

  const levelsWithPass = new Set<number>();
  trials.forEach((t) => {
    if (t.trialCorrectBinary) levelsWithPass.add(t.level);
  });
  const levelPassedCount = levelsWithPass.size;
  const highestLevelPassed =
    levelPassedCount === 0 ? 0 : Math.max(...Array.from(levelsWithPass));

  return {
    totalCorrectPlacements,
    totalTargets,
    totalIncorrectPlacements,
    totalWrongShapeUsed,
    overallAccuracyPercent,
    meanReactionTimeMs,
    levelPassedCount,
    highestLevelPassed,
  };
}

export function shouldDiscontinue(trials: TrialRecord[]): boolean {
  if (trials.length < 3) return false;
  const last3 = trials.slice(-3);
  return last3.every((t) => !t.trialCorrectBinary);
}
