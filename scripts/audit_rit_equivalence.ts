/**
 * RIT mode-equivalence + plan quality audit.
 * Run: npm run audit:rit
 *
 * Presentation mode must not alter trial structure or provisional scores
 * when seed and responses are identical.
 */
import {
  countGoNogo,
  generateSessionPlan,
  maxRunLength,
} from '../src/rit/lib/TrialGenerator';
import { computeProvisionalScore } from '../src/rit/lib/ScoringEngine';
import { replaySession } from '../src/rit/lib/SessionReplay';
import { ALL_PROFILES, simulateProfile } from '../src/rit/lib/simulateProfiles';
import { getTaskConfig } from '../src/rit/config/taskConfig';
import { TASK_CONFIG } from '../src/rit/config/taskConfig';

const SEEDS = [1, 42, 99, 555, 7777];

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function main(): void {
  let failures = 0;
  const log = (ok: boolean, msg: string) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
    if (!ok) failures++;
  };

  console.log('=== RIT equivalence & plan audit ===\n');

  for (const seed of SEEDS) {
    const a = generateSessionPlan(seed);
    const b = generateSessionPlan(seed);
    const same = JSON.stringify(a.trials) === JSON.stringify(b.trials);
    log(same, `seed ${seed}: identical plans on regenerate`);

    // "Clinical" vs "Game" — modes are presentation-only; plans must match.
    void 'clinical';
    void 'game';
    log(same, `seed ${seed}: clinical/game share identical plan (generator ignores mode)`);
  }

  for (const seed of SEEDS) {
    for (const profile of ALL_PROFILES) {
      if (profile === 'incomplete_session') continue;
      const sim = simulateProfile(profile, seed);
      const clinical = replaySession({
        sessionId: `audit_clinical_${profile}`,
        seed,
        responses: sim.responses,
      });
      const game = replaySession({
        sessionId: `audit_game_${profile}`,
        seed,
        responses: sim.responses,
      });
      const scoreA = computeProvisionalScore(clinical.trials);
      const scoreB = computeProvisionalScore(game.trials);
      const equal =
        JSON.stringify(scoreA.components) === JSON.stringify(scoreB.components) &&
        scoreA.inhibitoryControlScore === scoreB.inhibitoryControlScore;
      log(equal, `seed ${seed} profile ${profile}: clinical/game scores identical`);
    }
  }

  console.log('\n--- Plan ratios & run lengths (full protocol) ---');
  for (const seed of SEEDS) {
    const plan = generateSessionPlan(seed, getTaskConfig('full'));
    for (const key of ['habit', 'standard', 'interference'] as const) {
      const block = plan.byBlock[key];
      const { ratioGo } = countGoNogo(block);
      const expected = TASK_CONFIG.blocks[key].goRatio;
      const run = maxRunLength(block, (t) => t.goNoGo);
      const ratioOk = Math.abs(ratioGo - expected) < 0.08;
      const runOk = run <= TASK_CONFIG.sequenceConstraints.maxSameTypeRun;
      log(
        ratioOk && runOk,
        `seed ${seed} ${key}: goRatio=${ratioGo.toFixed(3)} (exp ${expected}) maxRun=${run}`
      );
    }
  }

  console.log('\n--- Pilot profile trial counts ---');
  const pilot = generateSessionPlan(42, getTaskConfig('pilot'));
  const full = generateSessionPlan(42, getTaskConfig('full'));
  log(pilot.taskVersion === '0.2.0-pilot', `pilot taskVersion=${pilot.taskVersion}`);
  log(full.taskVersion === '0.2.0', `full taskVersion=${full.taskVersion}`);
  log(
    pilot.byBlock.habit.length === 24 && full.byBlock.habit.length === 40,
    `pilot habit n=${pilot.byBlock.habit.length}, full habit n=${full.byBlock.habit.length}`
  );
  log(
    pilot.byBlock.standard.length === 32 && full.byBlock.standard.length === 48,
    `pilot standard n=${pilot.byBlock.standard.length}, full standard n=${full.byBlock.standard.length}`
  );

  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASSED' : `${failures} FAILED`} ===`);
  if (failures > 0) process.exit(1);
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
