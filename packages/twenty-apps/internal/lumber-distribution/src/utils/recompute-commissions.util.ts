import { type RestApiClient } from 'twenty-client-sdk/rest';

import { type CommissionRecord } from 'src/types/commission-record';
import { previewCommissions } from 'src/utils/preview-commissions.util';

export const recomputeCommissions = async (
  client: Pick<RestApiClient, 'get' | 'patch'>,
  recordIds: string[],
): Promise<void> => {
  for (const id of new Set(recordIds)) {
    // Re-read after every write so an older event cannot leave newer terms with stale amounts.
    for (let attempt = 0; attempt <= 3; attempt++) {
      const path = `/rest/lumberCommissions/${encodeURIComponent(id)}`;
      const response = await client.get<{
        data: { lumberCommission: CommissionRecord };
      }>(path);
      const record = response.data?.lumberCommission;

      if (!record) {
        throw new Error(
          `Commission ${id} could not be read for recalculation.`,
        );
      }

      const amountMicros = record.eligibleAmount?.amountMicros;

      if (
        typeof amountMicros === 'number' &&
        !Number.isSafeInteger(amountMicros)
      ) {
        throw new Error(
          'The commission basis exceeds safe numeric precision; supply amountMicros as an integer string.',
        );
      }

      const splitConfirmed =
        record.splitConfirmed === true &&
        typeof record.splitTerms === 'string' &&
        record.splitTerms.trim().length > 0 &&
        record.yourSharePercent !== null &&
        record.yourSharePercent !== undefined &&
        record.partnerPoolSharePercent !== null &&
        record.partnerPoolSharePercent !== undefined &&
        Math.abs(
          record.yourSharePercent + record.partnerPoolSharePercent - 100,
        ) < 0.000001;
      const preview = previewCommissions({
        records: [
          {
            id,
            eligibleAmountMicros:
              amountMicros === null || amountMicros === undefined
                ? null
                : String(amountMicros),
            currencyCode:
              amountMicros === null || amountMicros === undefined
                ? 'USD'
                : (record.eligibleAmount?.currencyCode ?? 'USD'),
            commissionRate: record.commissionRate ?? null,
            termsConfirmed:
              record.status === 'CONFIRMED' &&
              typeof record.eligibleBasis === 'string' &&
              record.eligibleBasis.trim().length > 0,
            splitConfirmed,
            yourSharePercent: record.yourSharePercent ?? null,
          },
        ],
      }).records[0];
      const desiredAmounts = {
        expectedCommission: preview.expectedCommissionMicros,
        yourExpectedShare: preview.yourExpectedShareMicros,
        partnerPoolExpectedShare: preview.partnerPoolExpectedShareMicros,
      };
      const changes: Record<
        string,
        { amountMicros: string; currencyCode: 'USD' } | null
      > = {};

      for (const field of Object.keys(desiredAmounts) as Array<
        keyof typeof desiredAmounts
      >) {
        const desiredAmount = desiredAmounts[field];
        const current = record[field];
        const currentAmount =
          current?.amountMicros === null || current?.amountMicros === undefined
            ? null
            : String(current.amountMicros);

        if (
          currentAmount === desiredAmount &&
          (desiredAmount === null || current?.currencyCode === 'USD')
        ) {
          continue;
        }

        changes[field] =
          desiredAmount === null
            ? null
            : { amountMicros: desiredAmount, currencyCode: 'USD' };
      }

      if (Object.keys(changes).length === 0) {
        break;
      }

      if (attempt === 3) {
        throw new Error(
          `Commission ${id} changed repeatedly during recalculation; retry with the latest terms.`,
        );
      }

      await client.patch(path, changes);
    }
  }
};
