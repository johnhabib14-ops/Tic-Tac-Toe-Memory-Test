import type { ReactNode } from 'react';
import type { VisualMode } from '../types';
import BrandLine from '../../components/brand/BrandLine';
import ExperimentalBanner from '../../components/brand/ExperimentalBanner';

export { BrandLine, ExperimentalBanner };

export function ThemeShell({
  mode,
  highContrast,
  scalableText,
  children,
}: {
  mode: VisualMode;
  highContrast?: boolean;
  scalableText?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`rit-theme rit-theme-${mode}${highContrast ? ' rit-high-contrast' : ''}${
        scalableText ? ' rit-scalable-text' : ''
      }`}
      data-visual-mode={mode}
    >
      {children}
    </div>
  );
}
