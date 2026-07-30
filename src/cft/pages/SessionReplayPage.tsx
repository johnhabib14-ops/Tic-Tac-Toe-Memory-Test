import { useMemo, useState } from 'react';
import { useCFTState } from '../CFTState';
import { replaySession } from '../lib/SessionReplay';
import { computeProvisionalScore } from '../lib/ScoringEngine';
import { simulateSession, SIM_PROFILES, type SimProfile } from '../lib/simulateProfiles';
import { ThemeShell, BrandLine } from '../components/ThemeShell';

export default function SessionReplayPage() {
  const { seed, trials, sessionId, setPhase, visualMode, accessibility } = useCFTState();
  const [profile, setProfile] = useState<SimProfile>('accurate');
  const [simSeed, setSimSeed] = useState(42);

  const fromSession = useMemo(() => {
    const responses = trials.map((t) => ({
      trialNumber: t.trialNumber,
      actualResponse: t.actualResponse,
      reactionTimeMs: t.reactionTimeMs,
    }));
    return replaySession({ sessionId, seed, responses });
  }, [trials, sessionId, seed]);

  const sim = useMemo(() => simulateSession(simSeed, profile), [profile, simSeed]);

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page cft-page cft-results">
        <h1 className="game-title">Session replay (developer)</h1>
        <BrandLine />
        <p className="subtitle">
          Reconstruct classifications from seed + responses. Visual mode does not change the plan.
        </p>

        <section>
          <h2>Current session</h2>
          <p>Seed: {seed}</p>
          <p>Replayed trials: {fromSession.trials.length}</p>
          <p>
            Provisional CFS:{' '}
            {computeProvisionalScore(fromSession.trials).cognitiveFlexibilityScore ?? '—'}
          </p>
        </section>

        <section>
          <h2>Simulated profiles</h2>
          <label className="cft-field">
            Profile
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value as SimProfile)}
            >
              {SIM_PROFILES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="cft-field">
            Seed
            <input
              type="number"
              value={simSeed}
              onChange={(e) => setSimSeed(Number(e.target.value) || 0)}
            />
          </label>
          <p>
            Simulated CFS: {sim.score.cognitiveFlexibilityScore ?? '—'} (perseverative{' '}
            {sim.score.components.perseverativeErrorRate.toFixed(3)}, switch cost RT{' '}
            {sim.score.components.switchCostRtMs?.toFixed(0) ?? '—'} ms)
          </p>
        </section>

        <button type="button" onClick={() => setPhase('research_dashboard')}>
          Back to dashboard
        </button>
        <button type="button" className="cft-secondary" onClick={() => setPhase('clinical_results')}>
          Back to clinical results
        </button>
      </div>
    </ThemeShell>
  );
}
