import { Link, useNavigate } from 'react-router-dom';
import BrandLine from '../components/brand/BrandLine';
import BrandMark from '../components/brand/BrandMark';
import ExperimentalBanner from '../components/brand/ExperimentalBanner';
import TaskMark, { type TaskMarkKind } from '../components/brand/TaskMark';
import { clearAssessmentLinkContext } from '../lib/assessmentLink';
import { clearBatterySession } from '../lib/batterySession';

const TASKS = [
  {
    path: '/gmt2',
    kind: 'gmt' as TaskMarkKind,
    name: 'Grid Memory Task',
    construct: 'Visual-spatial working memory',
    detail: 'Encode and reconstruct symbol grids under load.',
  },
  {
    path: '/rit',
    kind: 'rit' as TaskMarkKind,
    name: 'Response Inhibition Task',
    construct: 'Inhibitory control',
    detail: 'Respond to go signals and withhold on stop cues.',
  },
  {
    path: '/cft',
    kind: 'cft' as TaskMarkKind,
    name: 'Cognitive Flexibility Task',
    construct: 'Set-shifting and rule switching',
    detail: 'Sort by changing rules; abandon the previous set.',
  },
] as const;

export default function Landing() {
  const navigate = useNavigate();

  const openSolo = (path: string) => {
    clearBatterySession();
    clearAssessmentLinkContext();
    navigate(path);
  };

  return (
    <div className="page hl-hub">
      <div className="hl-hub-hero">
        <BrandMark size="hero" />
        <h1 className="hl-hub-title">EF Assessment Battery</h1>
        <BrandLine />
        <p className="subtitle hl-hub-lead">
          Three experimental executive-function tasks in a fixed order — or run any task alone.
        </p>
        <div className="hl-hub-ctas">
          <button
            type="button"
            onClick={() => {
              clearAssessmentLinkContext();
              navigate('/battery');
            }}
          >
            Start full battery
          </button>
          <button
            type="button"
            className="hl-demo-launch secondary"
            onClick={() => {
              clearAssessmentLinkContext();
              navigate('/demo');
            }}
          >
            Demo Mode — short versions of every task
          </button>
        </div>
        <ExperimentalBanner />
      </div>

      <p className="hl-hub-section-label">Run a single task</p>
      <div className="hl-task-list" role="list">
        {TASKS.map((t) => (
          <button
            key={t.path}
            type="button"
            className="hl-task-card"
            role="listitem"
            onClick={() => openSolo(t.path)}
          >
            <TaskMark kind={t.kind} />
            <strong className="hl-task-name">{t.name}</strong>
            <span className="hl-task-construct">{t.construct}</span>
            <span className="hl-task-detail">{t.detail}</span>
          </button>
        ))}
      </div>

      <p className="hl-muted hl-hub-foot">
        Presentation themes never change scoring rules. Full battery has no combined EF score.
      </p>
      <p className="hl-hub-link">
        <Link to="/auth/login">Professional sign in</Link>
        {' · '}
        <Link to="/auth/signup">Create account</Link>
      </p>
    </div>
  );
}
