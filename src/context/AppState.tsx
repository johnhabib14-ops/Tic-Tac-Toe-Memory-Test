import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Participant, TrialRecord, CopyResult } from '../types';

interface AppStateValue {
  participant: Participant | null;
  setParticipant: (p: Participant | null) => void;
  trials: TrialRecord[];
  addTrial: (t: TrialRecord) => void;
  setTrials: (t: TrialRecord[]) => void;
  copyResult: CopyResult | null;
  setCopyResult: (r: CopyResult | null) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [trials, setTrials] = useState<TrialRecord[]>([]);
  const [copyResult, setCopyResult] = useState<CopyResult | null>(null);

  const addTrial = useCallback((t: TrialRecord) => {
    setTrials((prev) => [...prev, t]);
  }, []);

  const value: AppStateValue = {
    participant,
    setParticipant,
    trials,
    addTrial,
    setTrials,
    copyResult,
    setCopyResult,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
