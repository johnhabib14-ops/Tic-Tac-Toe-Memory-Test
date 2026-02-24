import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  GMT2Phase,
  GMT2Participant,
  GMT2CopyResult,
  GMT2MemoryTrialRecord,
} from './types';

interface GMT2StateValue {
  phase: GMT2Phase;
  setPhase: (p: GMT2Phase) => void;
  participant: GMT2Participant | null;
  setParticipant: (p: GMT2Participant | null) => void;
  copyResult: GMT2CopyResult | null;
  setCopyResult: (r: GMT2CopyResult | null) => void;
  memoryTrials: GMT2MemoryTrialRecord[];
  addMemoryTrial: (t: GMT2MemoryTrialRecord) => void;
  setMemoryTrials: (t: GMT2MemoryTrialRecord[]) => void;
}

const GMT2StateContext = createContext<GMT2StateValue | null>(null);

export function GMT2StateProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<GMT2Phase>('consent');
  const [participant, setParticipant] = useState<GMT2Participant | null>(null);
  const [copyResult, setCopyResult] = useState<GMT2CopyResult | null>(null);
  const [memoryTrials, setMemoryTrials] = useState<GMT2MemoryTrialRecord[]>([]);

  const addMemoryTrial = useCallback((t: GMT2MemoryTrialRecord) => {
    setMemoryTrials((prev) => [...prev, t]);
  }, []);

  const value: GMT2StateValue = {
    phase,
    setPhase,
    participant,
    setParticipant,
    copyResult,
    setCopyResult,
    memoryTrials,
    addMemoryTrial,
    setMemoryTrials,
  };

  return (
    <GMT2StateContext.Provider value={value}>
      {children}
    </GMT2StateContext.Provider>
  );
}

export function useGMT2State(): GMT2StateValue {
  const ctx = useContext(GMT2StateContext);
  if (!ctx) throw new Error('useGMT2State must be used within GMT2StateProvider');
  return ctx;
}
