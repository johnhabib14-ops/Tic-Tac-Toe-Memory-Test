import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Participant, TrialRecord } from '../types';

interface AppStateValue {
  participant: Participant | null;
  setParticipant: (p: Participant | null) => void;
  trials: TrialRecord[];
  addTrial: (t: TrialRecord) => void;
  setTrials: (t: TrialRecord[]) => void;
  practiceMode: boolean;
  setPracticeMode: (v: boolean) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [trials, setTrials] = useState<TrialRecord[]>([]);
  const [practiceMode, setPracticeMode] = useState(true);

  const addTrial = useCallback((t: TrialRecord) => {
    setTrials((prev) => [...prev, t]);
  }, []);

  const value: AppStateValue = {
    participant,
    setParticipant,
    trials,
    addTrial,
    setTrials,
    practiceMode,
    setPracticeMode,
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
