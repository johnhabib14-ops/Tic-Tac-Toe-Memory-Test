import { RITStateProvider, useRITState } from './RITState';
import { getInstructions } from './config/instructions';
import ModeSelect from './pages/ModeSelect';
import AdminSetup from './pages/AdminSetup';
import ResearchIntake from './pages/ResearchIntake';
import PublicIntake from './pages/PublicIntake';
import Consent from './pages/Consent';
import Eligibility from './pages/Eligibility';
import Demographics from './pages/Demographics';
import DeviceCheckPage from './pages/DeviceCheck';
import Orientation from './pages/Orientation';
import BlockRun from './pages/BlockRun';
import Completion from './pages/Completion';
import Debrief from './pages/Debrief';
import ClinicalResults from './pages/ClinicalResults';
import ResearchDashboard from './pages/ResearchDashboard';
import SessionReplayPage from './pages/SessionReplayPage';
import Locked from './pages/Locked';
import type { BlockType, RITPhase } from './types';

function blockTitle(blockType: BlockType, visualMode: 'clinical' | 'game'): string {
  const copy = getInstructions(visualMode);
  if (visualMode === 'game') {
    const labels: Record<string, string> = {
      practice: 'Calibration',
      baseline: 'Systems check',
      habit: 'Traffic flow',
      standard: 'Restricted signals',
      interference: 'Override frames',
    };
    return `${copy.productName} — ${labels[blockType] ?? blockType}`;
  }
  const labels: Record<string, string> = {
    practice: 'Practice',
    baseline: 'Baseline',
    habit: 'Habit formation',
    standard: 'Standard inhibition',
    interference: 'Increased interference',
  };
  return labels[blockType] ?? blockType;
}

function RITShellContent() {
  const { phase, visualMode } = useRITState();

  const block = (blockType: BlockType, next: RITPhase) => (
    <BlockRun
      blockType={blockType}
      nextPhase={next}
      title={blockTitle(blockType, visualMode)}
    />
  );

  switch (phase) {
    case 'mode_select':
      return <ModeSelect />;
    case 'admin_setup':
      return <AdminSetup />;
    case 'research_intake':
      return <ResearchIntake />;
    case 'public_intake':
      return <PublicIntake />;
    case 'consent':
      return <Consent />;
    case 'eligibility':
      return <Eligibility />;
    case 'demographics':
      return <Demographics />;
    case 'device_check':
      return <DeviceCheckPage />;
    case 'orientation':
      return <Orientation />;
    case 'practice':
      return block('practice', 'baseline');
    case 'baseline':
      return block('baseline', 'habit');
    case 'habit':
      return block('habit', 'standard');
    case 'standard':
      return block('standard', 'interference');
    case 'interference':
      return block('interference', 'completion');
    case 'adaptive':
      return <Completion />;
    case 'completion':
      return <Completion />;
    case 'debrief':
      return <Debrief />;
    case 'clinical_results':
      return <ClinicalResults />;
    case 'research_dashboard':
      return <ResearchDashboard />;
    case 'session_replay':
      return <SessionReplayPage />;
    case 'locked':
      return <Locked />;
    default:
      return <ModeSelect />;
  }
}

export default function RITShell() {
  return (
    <RITStateProvider>
      <RITShellContent />
    </RITStateProvider>
  );
}
