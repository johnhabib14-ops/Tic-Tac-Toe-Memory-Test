import { CFTStateProvider, useCFTState } from './CFTState';
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
import type { BlockType, CFTPhase } from './types';

function blockTitle(blockType: BlockType, visualMode: 'clinical' | 'game'): string {
  const copy = getInstructions(visualMode);
  if (visualMode === 'game') {
    const labels: Record<string, string> = {
      practice: 'Calibration',
      rule_learning: 'Channel training',
      predictable_switch: 'Paired shifts',
      cued_switch: 'Mixed channels',
      interference: 'Heavy interference',
    };
    return `${copy.productName} — ${labels[blockType] ?? blockType}`;
  }
  const labels: Record<string, string> = {
    practice: 'Practice',
    rule_learning: 'Rule learning',
    predictable_switch: 'Predictable switching',
    cued_switch: 'Cued switching',
    interference: 'Increased interference',
  };
  return labels[blockType] ?? blockType;
}

function CFTShellContent() {
  const { phase, visualMode } = useCFTState();

  const block = (blockType: BlockType, next: CFTPhase) => (
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
      return block('practice', 'rule_learning');
    case 'rule_learning':
      return block('rule_learning', 'predictable_switch');
    case 'predictable_switch':
      return block('predictable_switch', 'cued_switch');
    case 'cued_switch':
      return block('cued_switch', 'interference');
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

export default function CFTShell() {
  return (
    <CFTStateProvider>
      <CFTShellContent />
    </CFTStateProvider>
  );
}
