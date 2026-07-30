import { useEffect } from 'react';
import { useRITState } from '../RITState';
import { getInstructions } from '../config/instructions';
import { ThemeShell, BrandLine } from '../components/ThemeShell';

export default function DeviceCheckPage() {
  const {
    setPhase,
    device,
    refreshDevice,
    visualMode,
    accessibility,
    setAccessibility,
  } = useRITState();
  const copy = getInstructions(visualMode);

  useEffect(() => {
    refreshDevice();
  }, [refreshDevice]);

  return (
    <ThemeShell
      mode={visualMode}
      highContrast={accessibility.highContrast}
      scalableText={accessibility.scalableText}
    >
      <div className="page rit-page">
        <h1 className="game-title">{copy.productName}</h1>
        <BrandLine />
        <p className="subtitle">Device and accessibility check before practice.</p>
        <ul className="rit-device-list">
          <li>Device: {device.deviceType}</li>
          <li>Input: {device.inputMethod}</li>
          <li>
            Screen: {device.screenWidth}×{device.screenHeight}
          </li>
          <li>Supported: {device.supported ? 'Yes' : 'No'}</li>
        </ul>
        {!device.supported && (
          <p className="rit-warn" role="alert">
            This screen size or device may not support a valid session. You can continue for
            familiarization, but results may be flagged as uninterpretable.
          </p>
        )}
        {device.supportNotes.map((n) => (
          <p key={n} className="rit-muted">
            {n}
          </p>
        ))}
        <div className="rit-a11y">
          <label className="rit-check">
            <input
              type="checkbox"
              checked={accessibility.highContrast}
              onChange={(e) =>
                setAccessibility({ ...accessibility, highContrast: e.target.checked })
              }
            />
            High contrast
          </label>
          <label className="rit-check">
            <input
              type="checkbox"
              checked={accessibility.reducedMotion}
              onChange={(e) =>
                setAccessibility({ ...accessibility, reducedMotion: e.target.checked })
              }
            />
            Reduced motion
          </label>
          <label className="rit-check">
            <input
              type="checkbox"
              checked={accessibility.soundOff}
              onChange={(e) =>
                setAccessibility({ ...accessibility, soundOff: e.target.checked })
              }
            />
            Sound off
          </label>
          <label className="rit-check">
            <input
              type="checkbox"
              checked={accessibility.scalableText}
              onChange={(e) =>
                setAccessibility({ ...accessibility, scalableText: e.target.checked })
              }
            />
            Larger text
          </label>
        </div>
        <button type="button" onClick={() => setPhase('orientation')}>
          Continue to instructions
        </button>
      </div>
    </ThemeShell>
  );
}
