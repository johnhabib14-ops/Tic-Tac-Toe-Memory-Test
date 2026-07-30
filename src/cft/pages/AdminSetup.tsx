import { useState } from 'react';
import { useCFTState } from '../CFTState';
import { getInstructions } from '../config/instructions';
import { ThemeShell, BrandLine, ExperimentalBanner } from '../components/ThemeShell';
import type { ProtocolProfile } from '../config/taskConfig';

export default function AdminSetup() {
  const {
    setPhase,
    meta,
    setMeta,
    visualMode,
    accessibility,
    regeneratePlan,
    seed,
    setSeed,
    protocolProfile,
    setProtocolProfile,
  } = useCFTState();
  const copy = getInstructions(visualMode);
  const [participant, setParticipant] = useState(meta.participantCode);
  const [study, setStudy] = useState(meta.studyCode);
  const [examiner, setExaminer] = useState(meta.examinerId ?? '');
  const [seedInput, setSeedInput] = useState(String(seed));

  const continueNext = () => {
    const nextSeed = Number(seedInput);
    setMeta({
      participantCode: participant.trim() || meta.participantCode,
      studyCode: study.trim() || 'CFT-CLIN',
      examinerId: examiner.trim() || null,
    });
    if (Number.isFinite(nextSeed) && nextSeed !== seed) {
      setSeed(nextSeed >>> 0);
      regeneratePlan(nextSeed >>> 0);
    }
    setPhase('consent');
  };

  return (
    <ThemeShell mode={visualMode} highContrast={accessibility.highContrast}>
      <div className="page cft-page">
        <h1 className="game-title">{copy.productName}</h1>
        <BrandLine />
        <ExperimentalBanner />
        <p className="subtitle">Examiner setup (not shown to the participant during trials).</p>
        <form
          className="cft-form"
          onSubmit={(e) => {
            e.preventDefault();
            continueNext();
          }}
        >
          <label className="cft-field">
            Protocol profile
            <select
              value={protocolProfile}
              onChange={(e) => setProtocolProfile(e.target.value as ProtocolProfile)}
            >
              <option value="full">Full (0.2.0)</option>
              <option value="pilot">Pilot shorter blocks (0.2.0-pilot)</option>
              <option value="demo">Demo showcase (shortest)</option>
            </select>
          </label>
          <label className="cft-field">
            Participant ID
            <input value={participant} onChange={(e) => setParticipant(e.target.value)} required />
          </label>
          <label className="cft-field">
            Study / site code
            <input value={study} onChange={(e) => setStudy(e.target.value)} />
          </label>
          <label className="cft-field">
            Examiner ID (optional)
            <input value={examiner} onChange={(e) => setExaminer(e.target.value)} />
          </label>
          <label className="cft-field">
            Randomization seed (audit)
            <input value={seedInput} onChange={(e) => setSeedInput(e.target.value)} />
          </label>
          <button type="submit">Continue to consent</button>
          <button type="button" className="cft-secondary" onClick={() => setPhase('mode_select')}>
            Back
          </button>
        </form>
      </div>
    </ThemeShell>
  );
}
