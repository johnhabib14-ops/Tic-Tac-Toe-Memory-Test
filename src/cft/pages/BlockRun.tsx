import { useCallback, useMemo, useRef, useState } from 'react';
import { useCFTState } from '../CFTState';
import { getInstructions } from '../config/instructions';
import { getTaskConfig } from '../config/taskConfig';
import TrialRunner from '../components/TrialRunner';
import { ThemeShell, BrandLine } from '../components/ThemeShell';
import { isScoredBlock } from '../lib/blockMeta';
import type { BlockType, CFTPhase, TrialRecord } from '../types';

interface Props {
  blockType: BlockType;
  nextPhase: CFTPhase;
  title?: string;
}

export default function BlockRun({ blockType, nextPhase, title }: Props) {
  const {
    plan,
    sessionId,
    visualMode,
    accessibility,
    addTrial,
    setPhase,
    focusLossCount,
    setFocusLossCount,
    practiceRepetitions,
    setPracticeRepetitions,
    setPracticePassed,
    setBaselineUnderstood,
    setTrials,
    trials,
    protocolProfile,
  } = useCFTState();
  const config = getTaskConfig(protocolProfile);
  const copy = getInstructions(visualMode);
  const [running, setRunning] = useState(false);
  const blockTrialsRef = useRef<TrialRecord[]>([]);

  const blockPlan = useMemo(
    () => plan.filter((t) => t.blockType === blockType),
    [plan, blockType]
  );

  const intro =
    blockType === 'practice'
      ? copy.practiceIntro
      : copy.betweenBlocks[blockType] ?? copy.scoredStart;

  const onTrialComplete = useCallback(
    (record: TrialRecord) => {
      blockTrialsRef.current = [...blockTrialsRef.current, record];
      addTrial(record);
    },
    [addTrial]
  );

  const finishBlock = useCallback(() => {
    const blockTrials = blockTrialsRef.current;

    if (blockType === 'practice') {
      const acc =
        blockTrials.length === 0
          ? 0
          : blockTrials.filter((t) => t.accuracy === 1).length / blockTrials.length;
      const pass = acc >= config.blocks.practice.passAccuracy;
      if (pass) {
        setPracticePassed(true);
        setPhase(nextPhase);
        return;
      }
      const reps = practiceRepetitions + 1;
      setPracticeRepetitions(reps);
      if (reps >= config.blocks.practice.maxRepetitions) {
        setPracticePassed(false);
        setPhase(nextPhase);
        return;
      }
      setTrials(trials.filter((t) => t.blockType !== 'practice'));
      blockTrialsRef.current = [];
      setRunning(false);
      return;
    }

    if (blockType === 'rule_learning') {
      const acc =
        blockTrials.length === 0
          ? 0
          : blockTrials.filter((t) => t.accuracy === 1).length / blockTrials.length;
      setBaselineUnderstood(acc >= config.blocks.rule_learning.passAccuracy);
    }

    setPhase(nextPhase);
  }, [
    blockType,
    nextPhase,
    practiceRepetitions,
    setBaselineUnderstood,
    setPhase,
    setPracticePassed,
    setPracticeRepetitions,
    setTrials,
    trials,
    config.blocks.practice.passAccuracy,
    config.blocks.practice.maxRepetitions,
  ]);

  return (
    <ThemeShell
      mode={visualMode}
      highContrast={accessibility.highContrast}
      scalableText={accessibility.scalableText}
    >
      <div className="page cft-page cft-block-page">
        {!running ? (
          <>
            <h1 className="game-title">
              {title ?? (visualMode === 'game' ? copy.productName : blockType)}
            </h1>
            {blockType === 'practice' && <BrandLine />}
            <p className="subtitle">{intro}</p>
            {blockType === 'practice' && practiceRepetitions > 0 && (
              <p className="cft-warn">
                Practice repeat {practiceRepetitions} of{' '}
                {config.blocks.practice.maxRepetitions}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                blockTrialsRef.current = [];
                setRunning(true);
              }}
            >
              Begin
            </button>
          </>
        ) : (
          <TrialRunner
            key={`${blockType}-${practiceRepetitions}-run`}
            trials={blockPlan}
            sessionId={sessionId}
            visualMode={visualMode}
            scored={isScoredBlock(blockType)}
            showPracticeFeedback={blockType === 'practice'}
            highContrast={accessibility.highContrast}
            reducedMotion={accessibility.reducedMotion}
            soundOff={accessibility.soundOff}
            onTrialComplete={onTrialComplete}
            onBlockComplete={finishBlock}
            onFocusLoss={() => setFocusLossCount(focusLossCount + 1)}
          />
        )}
      </div>
    </ThemeShell>
  );
}
