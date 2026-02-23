import type { TrialRecord, SummaryMetrics } from '../types';

/** Level points for this trial (0, 1, or 2). Fallback for records without levelPoints. */
function getTrialLevelPoints(t: TrialRecord): number {
  if (t.levelPoints !== undefined && t.levelPoints !== null) return t.levelPoints;
  if (t.level >= 1 && t.level <= 9) return t.trialCorrectBinary ? 1 : 0;
  if (t.level >= 10 && t.level <= 20) {
    if (t.trialCorrectBinary) return 2;
    return (t.correctPlacements ?? 0) >= 5 ? 1 : 0;
  }
  return 0;
}

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
    const pts = getTrialLevelPoints(t);
    const maxForLevel = t.level <= 9 ? 1 : 2;
    if (pts >= maxForLevel) levelsWithPass.add(t.level);
  });
  const levelPassedCount = levelsWithPass.size;
  const highestLevelPassed =
    levelPassedCount === 0 ? 0 : Math.max(...Array.from(levelsWithPass));

  // Memory points: sum of levelPoints (max 31: 9×1 + 11×2)
  const memoryPoints = trials.reduce((s, t) => s + getTrialLevelPoints(t), 0);

  return {
    totalCorrectPlacements,
    totalTargets,
    totalIncorrectPlacements,
    totalWrongShapeUsed,
    overallAccuracyPercent,
    meanReactionTimeMs,
    levelPassedCount,
    highestLevelPassed,
    memoryPoints,
  };
}

export function shouldDiscontinue(trials: TrialRecord[]): boolean {
  if (trials.length < 3) return false;
  const last3 = trials.slice(-3);
  return last3.every((t) => {
    const pts = getTrialLevelPoints(t);
    const maxForLevel = t.level <= 9 ? 1 : 2;
    return pts < maxForLevel;
  });
}
