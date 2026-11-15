import { describe, expect, it, vi } from 'vitest';

import { type CommissionRecord } from 'src/types/commission-record';
import { recomputeCommissions } from '../recompute-commissions.util';

const CONFIRMED: CommissionRecord = {
  id: 'commission-1',
  status: 'CONFIRMED',
  eligibleBasis: 'Lumber sale excluding freight and taxes',
  eligibleAmount: { amountMicros: '20000000000', currencyCode: 'USD' },
  commissionRate: 5,
  splitConfirmed: false,
  yourSharePercent: 50,
  partnerPoolSharePercent: 50,
  splitTerms: 'Half to your side, half to the partner group collectively',
};

const clientFor = (record: CommissionRecord) => {
  const savedRecord = { ...record };

  return {
    get: vi
      .fn()
      .mockImplementation(async () => ({
        data: { lumberCommission: { ...savedRecord } },
      })),
    patch: vi
      .fn()
      .mockImplementation(
        async (_path: string, changes: Partial<CommissionRecord>) => {
          Object.assign(savedRecord, changes);

          return {};
        },
      ),
  };
};

describe('recomputeCommissions', () => {
  it('rereads the current record and writes only changed derived money', async () => {
    const client = clientFor(CONFIRMED);

    await recomputeCommissions(client, ['commission-1']);

    expect(client.get).toHaveBeenCalledWith(
      '/rest/lumberCommissions/commission-1',
    );
    expect(client.patch).toHaveBeenCalledExactlyOnceWith(
      '/rest/lumberCommissions/commission-1',
      {
        expectedCommission: { amountMicros: '1000000000', currencyCode: 'USD' },
      },
    );
  });

  it('deduplicates events and avoids writes when current derived values already match', async () => {
    const client = clientFor({
      ...CONFIRMED,
      expectedCommission: { amountMicros: 1000000000, currencyCode: 'USD' },
    });

    await recomputeCommissions(client, ['commission-1', 'commission-1']);

    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.patch).not.toHaveBeenCalled();
  });

  it('leaves blank values alone for unknown terms and removes stale forecasts after terms are withdrawn', async () => {
    const client = clientFor({ ...CONFIRMED, status: 'TBD' });

    await recomputeCommissions(client, ['commission-1']);

    expect(client.patch).not.toHaveBeenCalled();
    const staleClient = clientFor({
      ...CONFIRMED,
      status: 'PROPOSED',
      expectedCommission: { amountMicros: '1000000000', currencyCode: 'USD' },
      yourExpectedShare: { amountMicros: '500000000', currencyCode: 'USD' },
      partnerPoolExpectedShare: {
        amountMicros: '500000000',
        currencyCode: 'USD',
      },
    });

    await recomputeCommissions(staleClient, ['commission-1']);

    expect(staleClient.patch).toHaveBeenCalledWith(
      '/rest/lumberCommissions/commission-1',
      {
        expectedCommission: null,
        yourExpectedShare: null,
        partnerPoolExpectedShare: null,
      },
    );
  });

  it('does not allocate the proposed split but applies confirmed terms to the partner pool', async () => {
    const client = clientFor({ ...CONFIRMED, splitConfirmed: true });

    await recomputeCommissions(client, ['commission-1']);

    expect(client.patch).toHaveBeenCalledWith(
      '/rest/lumberCommissions/commission-1',
      {
        expectedCommission: { amountMicros: '1000000000', currencyCode: 'USD' },
        yourExpectedShare: { amountMicros: '500000000', currencyCode: 'USD' },
        partnerPoolExpectedShare: {
          amountMicros: '500000000',
          currencyCode: 'USD',
        },
      },
    );
  });

  it.each([
    { eligibleBasis: '' },
    { commissionRate: null },
    { eligibleAmount: null },
  ])(
    'does not invent commission from incomplete terms: %j',
    async (overrides) => {
      const client = clientFor({ ...CONFIRMED, ...overrides });

      await recomputeCommissions(client, ['commission-1']);

      expect(client.patch).not.toHaveBeenCalled();
    },
  );

  it.each([
    { splitTerms: '' },
    { yourSharePercent: null },
    { partnerPoolSharePercent: 60 },
  ])('does not apply incomplete split agreements: %j', async (overrides) => {
    const client = clientFor({
      ...CONFIRMED,
      splitConfirmed: true,
      ...overrides,
    });

    await recomputeCommissions(client, ['commission-1']);

    expect(client.patch).toHaveBeenCalledWith(
      '/rest/lumberCommissions/commission-1',
      {
        expectedCommission: { amountMicros: '1000000000', currencyCode: 'USD' },
      },
    );
  });

  it('fails when money has already lost numeric precision', async () => {
    const client = clientFor({
      ...CONFIRMED,
      eligibleAmount: {
        amountMicros: Number.MAX_SAFE_INTEGER + 1,
        currencyCode: 'USD',
      },
    });

    await expect(
      recomputeCommissions(client, ['commission-1']),
    ).rejects.toThrow('safe numeric precision');
    expect(client.patch).not.toHaveBeenCalled();
  });

  it('repairs a stale write when another edit changes terms between the read and write', async () => {
    let savedRecord: CommissionRecord = { ...CONFIRMED };
    let firstWrite = true;
    const client = {
      get: vi
        .fn()
        .mockImplementation(async () => ({
          data: { lumberCommission: { ...savedRecord } },
        })),
      patch: vi
        .fn()
        .mockImplementation(
          async (_path: string, changes: Partial<CommissionRecord>) => {
            if (firstWrite) {
              // A newer event already calculated the edited rate before this older write arrives.
              savedRecord = {
                ...savedRecord,
                commissionRate: 10,
                expectedCommission: {
                  amountMicros: '2000000000',
                  currencyCode: 'USD',
                },
              };
              firstWrite = false;
            }

            Object.assign(savedRecord, changes);
          },
        ),
    };

    await recomputeCommissions(client, ['commission-1']);

    expect(client.patch).toHaveBeenCalledTimes(2);
    expect(savedRecord.commissionRate).toBe(10);
    expect(savedRecord.expectedCommission).toEqual({
      amountMicros: '2000000000',
      currencyCode: 'USD',
    });
  });

  it('bounds retries when terms never settle and reports failure for queue retry', async () => {
    const client = clientFor(CONFIRMED);

    client.patch.mockImplementation(async () => ({}));

    await expect(
      recomputeCommissions(client, ['commission-1']),
    ).rejects.toThrow('changed repeatedly');
    expect(client.patch).toHaveBeenCalledTimes(3);
    expect(client.get).toHaveBeenCalledTimes(4);
  });

  it('accepts an empty nullable currency composite while terms are TBD', async () => {
    const client = clientFor({
      ...CONFIRMED,
      status: 'TBD',
      eligibleAmount: { amountMicros: null, currencyCode: '' },
    });

    await recomputeCommissions(client, ['commission-1']);

    expect(client.patch).not.toHaveBeenCalled();
  });

  it('propagates read or write failures for a retry instead of reporting success', async () => {
    const client = clientFor(CONFIRMED);

    client.patch.mockRejectedValue(new Error('temporarily unavailable'));
    await expect(
      recomputeCommissions(client, ['commission-1']),
    ).rejects.toThrow('temporarily unavailable');
  });
});
