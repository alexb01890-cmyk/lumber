import { describe, expect, it } from 'vitest';

import { previewReorders } from '../preview-reorders.util';

const INPUT = {
  id: 'reorder-1',
  nextNeedDate: '2026-01-31',
  repeatMonths: 1,
  leadTimeDays: 21,
  reviewBufferDays: 7,
};

const preview = (overrides: Record<string, unknown> = {}) =>
  previewReorders({ records: [{ ...INPUT, ...overrides }] }).records[0];

describe('previewReorders', () => {
  it('reviews ahead of lead time and clamps a month-end need date', () => {
    expect(preview()).toEqual({
      id: 'reorder-1',
      nextNeedDate: '2026-01-31',
      reviewDate: '2026-01-03',
      followingNeedDate: '2026-02-28',
    });
  });

  it('handles leap-year month ends', () => {
    expect(preview({ nextNeedDate: '2028-01-31' }).followingNeedDate).toBe(
      '2028-02-29',
    );
    expect(
      preview({ nextNeedDate: '2028-02-29', repeatMonths: 12 })
        .followingNeedDate,
    ).toBe('2029-02-28');
  });

  it('handles arbitrary month intervals across years', () => {
    expect(
      preview({ nextNeedDate: '2026-11-15', repeatMonths: 3 })
        .followingNeedDate,
    ).toBe('2027-02-15');
  });

  it('uses calendar days across the Florida daylight-saving transition', () => {
    expect(
      preview({
        nextNeedDate: '2026-03-09',
        leadTimeDays: 1,
        reviewBufferDays: 1,
      }).reviewDate,
    ).toBe('2026-03-07');
  });

  it('allows explicitly zero lead time and buffer', () => {
    expect(preview({ leadTimeDays: 0, reviewBufferDays: 0 }).reviewDate).toBe(
      '2026-01-31',
    );
  });

  it.each([
    '2026-02-30',
    '2026-13-01',
    '2026-1-01',
    '2026-01-01T12:00:00Z',
    '',
    null,
  ])('rejects invalid date-only values: %s', (nextNeedDate) => {
    expect(() => preview({ nextNeedDate })).toThrow('nextNeedDate');
  });

  it.each([0, -1, 1.5, NaN, Infinity, '3'])(
    'rejects invalid intervals: %s',
    (repeatMonths) => {
      expect(() => preview({ repeatMonths })).toThrow('repeatMonths');
    },
  );

  it.each([-1, 1.5, NaN, undefined])(
    'rejects invalid lead times or buffers: %s',
    (days) => {
      expect(() => preview({ leadTimeDays: days })).toThrow('leadTimeDays');
      expect(() => preview({ reviewBufferDays: days })).toThrow(
        'reviewBufferDays',
      );
    },
  );

  it('rejects intervals that overflow supported date ranges', () => {
    expect(() => preview({ repeatMonths: Number.MAX_SAFE_INTEGER })).toThrow(
      'date range',
    );
    expect(() => preview({ leadTimeDays: Number.MAX_SAFE_INTEGER })).toThrow(
      'date range',
    );
  });

  it('only previews dates and accepts an empty bulk request', () => {
    expect(previewReorders({ records: [] })).toEqual({
      previewOnly: true,
      records: [],
    });
    expect(INPUT.nextNeedDate).toBe('2026-01-31');
  });

  it.each([
    null,
    {},
    { records: null },
    { records: [{}] },
    { records: [{ ...INPUT, id: '' }] },
  ])('rejects malformed bulk input', (payload) => {
    expect(() => previewReorders(payload)).toThrow();
  });
});
