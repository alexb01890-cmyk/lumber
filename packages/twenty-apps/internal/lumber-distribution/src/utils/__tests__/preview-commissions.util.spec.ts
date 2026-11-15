import { describe, expect, it } from 'vitest';

import { previewCommissions } from '../preview-commissions.util';

const INPUT = {
  id: 'commission-1',
  eligibleAmountMicros: '20000000000',
  currencyCode: 'USD',
  commissionRate: 5,
  termsConfirmed: true,
  splitConfirmed: true,
  yourSharePercent: 50,
};

const preview = (overrides: Record<string, unknown> = {}) =>
  previewCommissions({ records: [{ ...INPUT, ...overrides }] }).records[0];

describe('previewCommissions', () => {
  it('separates commission and your half from the partner pool', () => {
    expect(preview()).toEqual({
      id: 'commission-1',
      currencyCode: 'USD',
      commissionStatus: 'CALCULATED',
      splitStatus: 'CALCULATED',
      expectedCommissionMicros: '1000000000',
      yourExpectedShareMicros: '500000000',
      partnerPoolExpectedShareMicros: '500000000',
    });
  });

  it.each([
    { commissionRate: null },
    { eligibleAmountMicros: null },
    { termsConfirmed: false },
  ])('leaves unknown or unconfirmed earnings null: %j', (overrides) => {
    expect(preview(overrides)).toMatchObject({
      commissionStatus: 'TBD',
      expectedCommissionMicros: null,
      yourExpectedShareMicros: null,
      partnerPoolExpectedShareMicros: null,
    });
  });

  it('preserves an agreed zero rate as a calculated zero', () => {
    expect(preview({ commissionRate: 0 })).toMatchObject({
      commissionStatus: 'CALCULATED',
      expectedCommissionMicros: '0',
    });
  });

  it('does not apply a proposed 50/50 split until confirmed', () => {
    expect(preview({ splitConfirmed: false })).toMatchObject({
      splitStatus: 'UNCONFIRMED',
      expectedCommissionMicros: '1000000000',
      yourExpectedShareMicros: null,
      partnerPoolExpectedShareMicros: null,
    });
  });

  it('does not invent an allocation when the confirmed share is missing', () => {
    expect(preview({ yourSharePercent: null })).toMatchObject({
      splitStatus: 'TBD',
      yourExpectedShareMicros: null,
    });
  });

  it('rounds half cents once and assigns the remainder so the split reconciles', () => {
    expect(
      preview({ eligibleAmountMicros: '1000000', commissionRate: 1.5 }),
    ).toMatchObject({
      expectedCommissionMicros: '20000',
      yourExpectedShareMicros: '10000',
      partnerPoolExpectedShareMicros: '10000',
    });
    expect(
      preview({ eligibleAmountMicros: '1000000', commissionRate: 1 }),
    ).toMatchObject({
      expectedCommissionMicros: '10000',
      yourExpectedShareMicros: '10000',
      partnerPoolExpectedShareMicros: '0',
    });
  });

  it('keeps amounts above JavaScript safe integer precision exact', () => {
    expect(
      preview({
        eligibleAmountMicros: '90071992547409930000',
        commissionRate: 100,
        yourSharePercent: 100,
      }),
    ).toMatchObject({
      expectedCommissionMicros: '90071992547409930000',
      yourExpectedShareMicros: '90071992547409930000',
      partnerPoolExpectedShareMicros: '0',
    });
  });

  it.each([-1, 101, NaN, Infinity, 0.00001, '5', undefined])(
    'rejects invalid rates: %s',
    (commissionRate) => {
      expect(() => preview({ commissionRate })).toThrow('commissionRate');
    },
  );

  it.each(['-1', '1.5', '', 20000, undefined])(
    'rejects malformed money: %s',
    (eligibleAmountMicros) => {
      expect(() => preview({ eligibleAmountMicros })).toThrow(
        'eligibleAmountMicros',
      );
    },
  );

  it('rejects currencies with different rounding rules', () => {
    expect(() => preview({ currencyCode: 'JPY' })).toThrow('USD');
  });

  it('keeps the preview read-only and supports an empty bulk request', () => {
    expect(previewCommissions({ records: [] })).toEqual({
      previewOnly: true,
      records: [],
    });
    expect(INPUT.eligibleAmountMicros).toBe('20000000000');
  });

  it.each([
    null,
    {},
    { records: null },
    { records: [{}] },
    { records: [{ ...INPUT, id: '' }] },
  ])('rejects malformed bulk input', (payload) => {
    expect(() => previewCommissions(payload)).toThrow();
  });
});
