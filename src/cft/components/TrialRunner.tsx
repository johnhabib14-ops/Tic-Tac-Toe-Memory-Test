import { useEffect, useRef, useState } from 'react';
import { getInstructions } from '../config/instructions';
import { classifyResponse } from '../lib/responseClassification';
import { InputManager } from '../lib/InputManager';
import { playPracticeCue } from '../lib/practiceSound';
import { nowMs, TimingMonitor } from '../lib/TimingMonitor';
import type { ActualResponse, PlannedTrial, TrialRecord, VisualMode } from '../types';
import CueBanner from './CueBanner';
import StimulusRenderer from './StimulusRenderer';

type Phase = 'isi' | 'stimulus' | 'feedback' | 'done';

interface Props {
  trials: PlannedTrial[];
  sessionId: string;
  visualMode: VisualMode;
  scored: boolean;
  showPracticeFeedback: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
  soundOff?: boolean;
  onTrialComplete: (record: TrialRecord) => void;
  onBlockComplete: () => void;
  onFocusLoss?: () => void;
}

export default function TrialRunner({
  trials,
  sessionId,
  visualMode,
  scored,
  showPracticeFeedback,
  highContrast = false,
  reducedMotion = false,
  soundOff = true,
  onTrialComplete,
  onBlockComplete,
  onFocusLoss,
}: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('isi');
  const [feedback, setFeedback] = useState<string | null>(null);
  const responseRef = useRef<ActualResponse | null>(null);
  const onsetRef = useRef(0);
  const responseTsRef = useRef<number | null>(null);
  const recordedRef = useRef(false);
  const monitorRef = useRef<TimingMonitor | null>(null);
  const inputRef = useRef(new InputManager());
  const copy = getInstructions(visualMode);

  const current = trials[index] ?? null;

  useEffect(() => {
    const monitor = new TimingMonitor();
    monitor.start();
    monitorRef.current = monitor;
    return () => {
      monitor.stop();
      inputRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (!current) {
      onBlockComplete();
      return;
    }
    responseRef.current = null;
    responseTsRef.current = null;
    recordedRef.current = false;
    setFeedback(null);
    setPhase('isi');
    inputRef.current.stop();

    const isiTimer = window.setTimeout(() => {
      onsetRef.current = nowMs();
      setPhase('stimulus');
    }, Math.max(300, current.isiMs * 0.35));

    return () => window.clearTimeout(isiTimer);
  }, [current, index, onBlockComplete]);

  useEffect(() => {
    if (phase !== 'stimulus' || !current) return;

    const finish = () => {
      if (recordedRef.current || !current) return;
      recordedRef.current = true;
      inputRef.current.stop();
      const monitor = monitorRef.current;
      const actual = responseRef.current ?? 'none';
      const record = classifyResponse({
        sessionId,
        planned: current,
        actualResponse: actual,
        stimulusOnsetTs: onsetRef.current,
        responseTimestamp: responseTsRef.current,
        focusLossFlag: monitor?.trialHadFocusIssue(onsetRef.current) ?? false,
        timingIrregularityFlag:
          monitor?.trialHadTimingIrregularity(onsetRef.current) ?? false,
        scored,
      });

      if (showPracticeFeedback) {
        playPracticeCue(record.accuracy === 1 ? 'correct' : 'incorrect', soundOff);
        setFeedback(
          record.accuracy === 1
            ? copy.practiceFeedbackCorrect
            : copy.practiceFeedbackIncorrect
        );
        setPhase('feedback');
        window.setTimeout(() => {
          onTrialComplete(record);
          setIndex((i) => i + 1);
        }, reducedMotion ? 200 : 450);
      } else {
        onTrialComplete(record);
        setIndex((i) => i + 1);
      }
    };

    const stimTimer = window.setTimeout(finish, current.stimulusDurationMs);

    inputRef.current.start(nowMs, (mapped, ts) => {
      responseRef.current = mapped;
      responseTsRef.current = ts;
      if (mapped !== 'none') {
        window.clearTimeout(stimTimer);
        finish();
      }
    });

    const onBlur = () => onFocusLoss?.();
    window.addEventListener('blur', onBlur);

    return () => {
      window.clearTimeout(stimTimer);
      window.removeEventListener('blur', onBlur);
      inputRef.current.stop();
    };
  }, [
    phase,
    current,
    sessionId,
    scored,
    showPracticeFeedback,
    copy.practiceFeedbackCorrect,
    copy.practiceFeedbackIncorrect,
    onTrialComplete,
    onFocusLoss,
    reducedMotion,
    soundOff,
  ]);

  if (!current) {
    return <div className="cft-runner cft-runner-done">Block complete</div>;
  }

  return (
    <div
      className={`cft-runner cft-runner-${visualMode}`}
      data-reduced-motion={reducedMotion}
    >
      <div className="cft-progress" aria-hidden>
        {index + 1} / {trials.length}
      </div>
      {visualMode === 'game' && (
        <p className="cft-game-chrome" aria-hidden>
          Rule Shift console
        </p>
      )}
      <CueBanner
        rule={phase === 'stimulus' ? current.rule : null}
        visualMode={visualMode}
      />
      <StimulusRenderer
        stimulus={phase === 'stimulus' ? current.stimulus : null}
        visualMode={visualMode}
        highContrast={highContrast}
        fixation={phase !== 'stimulus'}
      />
      {feedback && <p className="cft-feedback">{feedback}</p>}
      <div className="cft-touch-bar">
        <button type="button" id="cft-touch-a" className="cft-touch-btn">
          Left (F)
        </button>
        <button type="button" id="cft-touch-b" className="cft-touch-btn">
          Right (J)
        </button>
      </div>
    </div>
  );
}
