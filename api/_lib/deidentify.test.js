import { describe, expect, it } from 'vitest';
import {
  binDemographics,
  findPhiLeaks,
  toPublicRow,
  toResearchRow,
} from './deidentify.js';

describe('deidentify', () => {
  it('bins allowed demographics and drops PHI keys', () => {
    const bins = binDemographics({
      age: 34,
      sex: 'F',
      education: '16',
      language: 'en',
      handedness: 'R',
      country: 'US',
      cultural_background: 'Latino',
      name: 'Jane Doe',
      email: 'jane@example.com',
      mrn: 'MRN-1',
      examiner_notes: 'secret',
    });
    expect(bins).toEqual({
      age: 34,
      sex: 'F',
      education: '16',
      language: 'en',
      handedness: 'R',
      country: 'US',
      cultural_background: 'Latino',
    });
    expect(bins).not.toHaveProperty('name');
    expect(bins).not.toHaveProperty('email');
    expect(bins).not.toHaveProperty('mrn');
  });

  it('builds research rows without PHI leaks', () => {
    const row = toResearchRow({
      sourceMode: 'clinical',
      task: 'rit',
      sessionId: 'sess_1',
      anonymousParticipantId: 'anon_1',
      demographics: {
        age: 40,
        name: 'Should Not Appear',
        email: 'x@y.z',
        examinerNotes: 'nope',
      },
      device: { device_type: 'desktop', name: 'strip-me' },
      scores: { provisional_ics: 72, examiner_notes: 'no' },
      trials: [{ rt: 300 }],
      examinerNotes: 'clinical note',
    });
    expect(row.demographic_bins).toEqual({ age: 40 });
    expect(row.session_id).toBe('sess_1');
    expect(findPhiLeaks(row)).toEqual([]);
  });

  it('builds public rows with research_consent flag', () => {
    const row = toPublicRow({
      task: 'cft',
      sessionId: 'sess_2',
      researchConsent: true,
      demographics: { age: 22, mrn: 'secret' },
    });
    expect(row.research_consent).toBe(true);
    expect(row.demographic_bins).toEqual({ age: 22 });
    expect(findPhiLeaks(row)).toEqual([]);
  });
});
