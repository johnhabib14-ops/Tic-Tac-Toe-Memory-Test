import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import BrandLine from '../components/brand/BrandLine';
import ExperimentalBanner from '../components/brand/ExperimentalBanner';
import HubLink from '../components/brand/HubLink';
import {
  advanceBatterySession,
  clearBatterySession,
  isBatteryComplete,
  readBatterySession,
} from '../lib/batterySession';

/**
 * Shown after a task finishes. Advances the battery index on Continue.
 * Expects the just-finished task to still be the current index until Continue.
 */
export default function BatteryInterstitial() {
  const navigate = useNavigate();
  const [session] = useState(() => readBatterySession());

  const view = useMemo(() => {
    if (!session?.active) return null;
    const finishedIndex = session.index;
    const nextIndex = finishedIndex + 1;
    const done = nextIndex >= session.steps.length;
    if (done) {
      return {
        title: session.mode === 'demo' ? 'Demo tour complete' : 'Battery complete',
        detail:
          session.mode === 'demo'
            ? 'You finished the short demo of all three tasks.'
            : 'You finished all three tasks in order. Each has its own scores — no combined EF score.',
        action: 'Back to hub',
        done: true as const,
      };
    }
    const nextStep = session.steps[nextIndex];
    const labels = {
      gmt: 'Grid Memory Task',
      rit: 'Response Inhibition Task',
      cft: 'Cognitive Flexibility Task',
    };
    return {
      title: `Task ${finishedIndex + 1} of ${session.steps.length} complete`,
      detail: `Next: ${labels[nextStep]}.`,
      action: `Continue to ${labels[nextStep]}`,
      done: false as const,
    };
  }, [session]);

  if (session && isBatteryComplete()) {
    return (
      <div className="page hl-hub">
        <h1 className="game-title">Battery complete</h1>
        <BrandLine />
        <ExperimentalBanner />
        <p className="subtitle">All tasks in this session are done.</p>
        <button
          type="button"
          onClick={() => {
            clearBatterySession();
            navigate('/');
          }}
        >
          Back to hub
        </button>
        <HubLink />
      </div>
    );
  }

  if (!session?.active || !view) {
    return (
      <div className="page hl-hub">
        <h1 className="game-title">No active battery</h1>
        <BrandLine />
        <p className="subtitle">Start a full battery or demo from the hub.</p>
        <button type="button" onClick={() => navigate('/')}>
          Back to hub
        </button>
      </div>
    );
  }

  return (
    <div className="page hl-hub">
      <p className="hl-hub-eyebrow">
        {session.mode === 'demo' ? 'Demo progress' : 'Battery progress'}
      </p>
      <h1 className="game-title hl-hub-title">{view.title}</h1>
      <BrandLine />
      <ExperimentalBanner />
      <p className="subtitle hl-hub-lead">{view.detail}</p>

      <button
        type="button"
        onClick={() => {
          if (view.done) {
            clearBatterySession();
            navigate('/');
            return;
          }
          const next = advanceBatterySession();
          if (next) navigate(next);
          else {
            clearBatterySession();
            navigate('/');
          }
        }}
      >
        {view.action}
      </button>
      {!view.done && (
        <button
          type="button"
          className="secondary"
          style={{ marginTop: 8 }}
          onClick={() => {
            clearBatterySession();
            navigate('/');
          }}
        >
          Exit battery
        </button>
      )}
      <HubLink />
    </div>
  );
}
