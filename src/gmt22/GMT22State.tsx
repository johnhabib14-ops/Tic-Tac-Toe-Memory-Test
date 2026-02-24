import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  GMT22Phase,
  GMT22Participant,
  GMT22CopyResult,
  GMT22MemoryTrialRecord,
  GMT22PracticeTrialRecord,
} from './types';

interface GMT22StateValue {
  phase: GMT22Phase;
  setPhase: (p: GMT22Phase) => void;
  participant: GMT22Participant | null;
  setParticipant: (p: GMT22Participant | null) => void;
  copyResult: GMT22CopyResult | null;
  setCopyResult: (r: GMT22CopyResult | null) => void;
  memoryTrials: GMT22MemoryTrialRecord[];
  addMemoryTrial: (t: GMT22MemoryTrialRecord) => void;
  setMemoryTrials: (t: GMT22MemoryTrialRecord[]) => void;
  practiceTrials: GMT22PracticeTrialRecord[];
  setPracticeTrials: (t: GMT22PracticeTrialRecord[]) => void;
  practiceFailed: boolean;
  setPracticeFailed: (v: boolean) => void;
  practicePassedFirstTry: boolean;
  setPracticePassedFirstTry: (v: boolean) => void;
  memoryEarlyStopped: boolean;
  setMemoryEarlyStopped: (v: boolean) => void;
  attentionCheckFailed: boolean;
  setAttentionCheckFailed: (v: boolean) => void;
}

const GMT22StateContext = createContext<GMT22StateValue | null>(null);

export function GMT22StateProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<GMT22Phase>('intro');
  const [participant, setParticipant] = useState<GMT22Participant | null>(null);
  const [copyResult, setCopyResult] = useState<GMT22CopyResult | null>(null);
  const [memoryTrials, setMemoryTrials] = useState<GMT22MemoryTrialRecord[]>([]);
  const [practiceTrials, setPracticeTrials] = useState<GMT22PracticeTrialRecord[]>([]);
  const [practiceFailed, setPracticeFailed] = useState(false);
  const [practicePassedFirstTry, setPracticePassedFirstTry] = useState(false);
  const [memoryEarlyStopped, setMemoryEarlyStopped] = useState(false);
  const [attentionCheckFailed, setAttentionCheckFailed] = useState(false);

  const addMemoryTrial = useCallback((t: GMT22MemoryTrialRecord) => {
    setMemoryTrials((prev) => [...prev, t]);
  }, []);

  const value: GMT22StateValue = {
    phase,
    setPhase,
    participant,
    setParticipant,
    copyResult,
    setCopyResult,
    memoryTrials,
    addMemoryTrial,
    setMemoryTrials,
    practiceTrials,
    setPracticeTrials,
    practiceFailed,
    setPracticeFailed,
    practicePassedFirstTry,
    setPracticePassedFirstTry,
    memoryEarlyStopped,
    setMemoryEarlyStopped,
    attentionCheckFailed,
    setAttentionCheckFailed,
  };

  return (
    <GMT22StateContext.Provider value={value}>
      {children}
    </GMT22StateContext.Provider>
  );
}

export function useGMT22State(): GMT22StateValue {
  const ctx = useContext(GMT22StateContext);
  if (!ctx) throw new Error('useGMT22State must be used within GMT22StateProvider');
  return ctx;
}
