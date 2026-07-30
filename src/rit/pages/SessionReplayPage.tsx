import { useMemo, useState } from 'react';
import { useRITState } from '../RITState';
import { replaySession } from '../lib/SessionReplay';
import { computeProvisionalScore } from '../lib/ScoringEngine';
import { simulateProfile, ALL_PROFILES, type ProfileName } from '../lib/simulateProfiles';
import { ThemeShell, BrandLine } from '../components/ThemeShell';

export default function SessionReplayPage() {
  const { seed, trials, sessionId, setPhase, visualMode, accessibility } = useRITState();
  const [profile, setProfile] = useState<ProfileName>('accurate_average');
  const [simSeed, setSimSeed] = useState(42);

  const fromSession = useMemo(() => {
    const responses = trials.map((t) => ({
      trialNumber: t.trialNumber,
      actualResponse: t.actualResponse,
      reactionTimeMs: t.reactionTimeMs,
    }));
    return replaySession({ sessionId, seed, responses });
  }, [trials, sessionId, seed]);

  const sim = useMemo(() => simulateProfile(profile, simSeed), [profile, simSeed]);

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page rit-page rit-results">
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
            Provisional ICS:{' '}
            {computeProvisionalScore(fromSession.trials).inhibitoryControlScore ?? '—'}
          </p>
        </section>

        <section>
          <h2>Simulated profiles</h2>
          <label className="rit-field">
            Profile
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value as ProfileName)}
            >
              {ALL_PROFILES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="rit-field">
            Seed
            <input
              type="number"
              value={simSeed}
              onChange={(e) => setSimSeed(Number(e.target.value) || 0)}
            />
          </label>
          <p>
            Simulated ICS: {sim.score.inhibitoryControlScore ?? '—'} (commission{' '}
            {sim.score.components.commissionErrorRate.toFixed(3)}, omission{' '}
            {sim.score.components.omissionErrorRate.toFixed(3)})
          </p>
        </section>

        <button type="button" onClick={() => setPhase('research_dashboard')}>
          Back to dashboard
        </button>
        <button type="button" className="rit-secondary" onClick={() => setPhase('clinical_results')}>
          Back to clinical results
        </button>
      </div>
    </ThemeShell>
  );
}
