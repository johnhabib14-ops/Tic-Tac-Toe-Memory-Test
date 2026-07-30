/**
 * Shared “continue battery / demo tour” CTA on task completion screens.
 * Navigates to /battery/next so the interstitial advances the session.
 */
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  BATTERY_NEXT_PATH,
  batteryContinueCopy,
  clearBatterySession,
  isBatterySessionActive,
  readBatterySession,
} from '../../lib/batterySession';

export default function BatteryContinue() {
  const navigate = useNavigate();
  const [session] = useState(() => readBatterySession());
  const active = isBatterySessionActive();

  const copy = useMemo(() => {
    if (!session?.active) return null;
    return batteryContinueCopy(session);
  }, [session]);

  if (!active || !copy || !session) return null;

  return (
    <div className="hl-demo-continue" role="region" aria-label="Battery progress">
      <p className="hl-demo-continue-title">{copy.title}</p>
      <button type="button" onClick={() => navigate(BATTERY_NEXT_PATH)}>
        {copy.action}
      </button>
      <button
        type="button"
        className="secondary"
        onClick={() => {
          clearBatterySession();
          navigate('/');
        }}
      >
        Exit battery
      </button>
    </div>
  );
}
