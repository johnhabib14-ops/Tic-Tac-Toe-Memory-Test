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
      className={`cft-theme cft-theme-${mode}${highContrast ? ' cft-high-contrast' : ''}${
        scalableText ? ' cft-scalable-text' : ''
      }`}
      data-visual-mode={mode}
    >
      {children}
    </div>
  );
}
