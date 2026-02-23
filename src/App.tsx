import { Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Landing from './pages/Landing';
import Demographics from './pages/Demographics';
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

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/demographics" element={<Demographics />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </>
  );
}
