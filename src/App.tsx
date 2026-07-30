import { Routes, Route, Navigate } from 'react-router-dom';
import DebugOverlay from './components/DebugOverlay';
import Landing from './pages/Landing';
import TwoPartsIntro from './pages/TwoPartsIntro';
import CopyInstructions from './pages/CopyInstructions';
import Instructions from './pages/Instructions';
import Practice from './pages/Practice';
import Test from './pages/Test';
import TrianglesWarning from './pages/TrianglesWarning';
import BigGridWarning from './pages/BigGridWarning';
import Copy from './pages/Copy';
import Results from './pages/Results';
import PinGate from './pages/PinGate';
import Data from './pages/Data';
import GMT22Shell from './gmt22/GMT22Shell';
import RITShell from './rit/RITShell';
import CFTShell from './cft/CFTShell';
import DemoHub from './pages/DemoHub';
import BatteryIntro from './pages/BatteryIntro';
import BatteryInterstitial from './pages/BatteryInterstitial';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AppHomePage from './pages/AppHomePage';
import AssessmentLinkEntry from './pages/AssessmentLinkEntry';

export default function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/demo" element={<DemoHub />} />
      <Route path="/battery" element={<BatteryIntro />} />
      <Route path="/battery/next" element={<BatteryInterstitial />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/app" element={<AppHomePage />} />
      <Route path="/a/:token" element={<AssessmentLinkEntry />} />
      <Route path="/intro" element={<TwoPartsIntro />} />
      <Route path="/copy-instructions" element={<CopyInstructions />} />
      <Route path="/instructions" element={<Instructions />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/test" element={<Test />} />
      <Route path="/test/triangles-warning" element={<TrianglesWarning />} />
      <Route path="/test/big-grid-warning" element={<BigGridWarning />} />
      <Route path="/copy" element={<Copy />} />
      <Route path="/results" element={<Results />} />
      <Route path="/pin" element={<PinGate />} />
      <Route path="/data" element={<Data />} />
      <Route path="/gmt2" element={<GMT22Shell />} />
      <Route path="/gmt22" element={<GMT22Shell />} />
      <Route path="/rit" element={<RITShell />} />
      <Route path="/cft" element={<CFTShell />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <DebugOverlay />
    </>
  );
}
