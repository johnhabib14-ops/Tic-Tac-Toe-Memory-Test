import { describe, expect, it } from 'vitest';
import {
  linkModeToEngineMode,
  type LinkAdministrationMode,
} from '../assessmentLink';

describe('assessmentLink', () => {
  it('maps platform modes to engine administration modes', () => {
    const cases: Array<[LinkAdministrationMode, string]> = [
      ['clinical', 'supervised_clinical'],
      ['research', 'research'],
      ['public', 'public'],
    ];
    for (const [mode, expected] of cases) {
      expect(linkModeToEngineMode(mode)).toBe(expected);
    }
  });
});
