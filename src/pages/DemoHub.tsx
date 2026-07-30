import { useNavigate } from 'react-router-dom';
import BrandLine from '../components/brand/BrandLine';
import BrandMark from '../components/brand/BrandMark';
import ExperimentalBanner from '../components/brand/ExperimentalBanner';
import HubLink from '../components/brand/HubLink';
import TaskMark, { type TaskMarkKind } from '../components/brand/TaskMark';
import {
  batteryStepPath,
  clearBatterySession,
  startBatterySession,
  type BatteryStep,
} from '../lib/batterySession';

const SHORT_TASKS = [
  {
    key: 'gmt' as const,
    kind: 'gmt' as TaskMarkKind,
    name: 'Grid Memory (short)',
    detail: 'Two conditions, spans 2–3, one trial each.',
  },
  {
    key: 'rit' as const,
    kind: 'rit' as TaskMarkKind,
    name: 'Response Inhibition (short)',
    detail: 'Brief practice and each block — same rules, fewer trials.',
  },
  {
    key: 'cft' as const,
    kind: 'cft' as TaskMarkKind,
    name: 'Cognitive Flexibility (short)',
    detail: 'Rule learning and switching in compressed blocks.',
  },
];

export default function DemoHub() {
  const navigate = useNavigate();

  const startTour = () => {
    clearBatterySession();
    startBatterySession('demo');
    navigate(batteryStepPath('gmt', 'demo'));
  };

  const openSoloDemo = (key: BatteryStep) => {
    clearBatterySession();
    navigate(batteryStepPath(key, 'demo'));
  };

  return (
    <div className="page hl-hub">
      <div className="hl-hub-hero">
        <BrandMark size="md" />
        <p className="hl-hub-eyebrow">Quick showcase</p>
        <h1 className="hl-hub-title">Demo Mode</h1>
        <BrandLine />
        <p className="subtitle hl-hub-lead">
          Short versions of every task so you can try the battery without a full session. Scoring math
          is unchanged; blocks are abbreviated.
        </p>
        <div className="hl-hub-ctas">
          <button type="button" onClick={startTour}>
            Play all demos in order
          </button>
        </div>
        <p className="hl-muted" style={{ marginTop: 12 }}>
          About 5–10 minutes total. You can exit after any task.
        </p>
        <ExperimentalBanner />
      </div>

      <p className="hl-hub-section-label">Or try one short task</p>
      <div className="hl-task-list" role="list">
        {SHORT_TASKS.map((t) => (
          <button
            key={t.key}
            type="button"
            className="hl-task-card"
            role="listitem"
            onClick={() => openSoloDemo(t.key)}
          >
            <TaskMark kind={t.kind} />
            <strong className="hl-task-name">{t.name}</strong>
            <span className="hl-task-detail">{t.detail}</span>
          </button>
        ))}
      </div>

      <HubLink />
    </div>
  );
}
