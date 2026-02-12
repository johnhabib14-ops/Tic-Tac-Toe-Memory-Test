import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Demographics from './pages/Demographics';
import Instructions from './pages/Instructions';
import Practice from './pages/Practice';
import Test from './pages/Test';
import Results from './pages/Results';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/demographics" element={<Demographics />} />
      <Route path="/instructions" element={<Instructions />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/test" element={<Test />} />
      <Route path="/results" element={<Results />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
