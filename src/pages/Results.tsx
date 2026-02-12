import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppState';
import { computeSummary } from '../lib/summary';
import { openFormInNewTab } from '../lib/formUrl';

export default function Results() {
  const navigate = useNavigate();
  const { participant, trials } = useAppState();

  if (!participant) {
    navigate('/');
    return null;
  }

  const summary = computeSummary(trials);

  function handleDownloadJSON() {
    const data = { participant, trials };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-test-${participant.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadCSV() {
    const headers = [
      'participantId', 'level', 'trialIndex', 'gridIndex', 'correctPlacements',
      'commissionErrors', 'wrongShapeInTarget', 'omissionErrors', 'accuracyPercent', 'reactionTimeMs', 'trialCorrectBinary',
    ];
    const rows = trials.map((t) =>
      [t.participantId, t.level, t.trialIndex, t.gridIndex, t.correctPlacements,
        t.commissionErrors, t.wrongShapeInTarget ?? 0, t.omissionErrors, (t.accuracyPercent ?? 0).toFixed(1), t.reactionTimeMs, t.trialCorrectBinary].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-test-${participant.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSubmitToStudy() {
    openFormInNewTab(participant, summary);
  }

  const dateStr = new Date(participant.timestamp).toLocaleString();

  return (
    <div className="page">
      <h1>Results</h1>
      <div className="results-section">
        <h3>Your information</h3>
        <p><strong>Name:</strong> {participant.name}</p>
        <p><strong>Age:</strong> {participant.age}</p>
        <p><strong>Gender:</strong> {participant.gender}</p>
        <p><strong>Date:</strong> {dateStr}</p>
      </div>
      <div className="results-section">
        <h3>Performance</h3>
        <p><strong>Total points:</strong> {summary.totalCorrectPlacements ?? 0}</p>
        <p><strong>Total incorrect placement:</strong> {summary.totalIncorrectPlacements ?? 0}</p>
        <p><strong>Total wrong shape used:</strong> {summary.totalWrongShapeUsed ?? 0}</p>
        <p><strong>Highest level passed:</strong> {summary.highestLevelPassed ?? 0}</p>
        <p><strong>Overall accuracy:</strong> {(summary.overallAccuracyPercent ?? 0).toFixed(1)}%</p>
        <p><strong>Mean reaction time:</strong> {Math.round(summary.meanReactionTimeMs ?? 0)} ms</p>
      </div>
      <div className="results-section">
        <h3>Comparison</h3>
        <p>Normative comparison not available yet. This tool requires a larger validation sample.</p>
      </div>
      <div className="results-actions">
        <button onClick={handleSubmitToStudy}>Submit results to study</button>
        <button className="secondary" onClick={handleDownloadJSON}>Download results as JSON</button>
        <button className="secondary" onClick={handleDownloadCSV}>Download results as CSV</button>
      </div>
    </div>
  );
}
