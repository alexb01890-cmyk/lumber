import { randomUUID } from 'node:crypto';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { describe, expect, it } from 'vitest';

type RecordResponse<TName extends string, TRecord> = {
  data: Record<TName, TRecord>;
};

type IdentifiedRecord = { id: string; name: string };

type CurrencyAmount = {
  amountMicros: string | number | null;
  currencyCode: string | null;
};

type CommissionRecord = IdentifiedRecord & {
  status: string;
  commissionRate: number | null;
  expectedCommission: CurrencyAmount | null;
  receivedCommission: CurrencyAmount | null;
  splitConfirmed: boolean;
  yourExpectedShare: CurrencyAmount | null;
  partnerPoolExpectedShare: CurrencyAmount | null;
};

describe('Supplier-direct lumber workflow', () => {
  it('tracks a sample visit, partial delivery and commission without treating proposed terms as earnings', async () => {
    const client = new RestApiClient({
      baseUrl: process.env.TWENTY_API_URL,
      token: process.env.TWENTY_API_KEY,
    });
    const testReference = `Lumber integration ${randomUUID()}`;
    const companyIds: string[] = [];

    try {
      const customer = await client.post<
        RecordResponse<'createCompany', IdentifiedRecord>
      >('/rest/companies', {
        name: `${testReference} customer`,
        lumberRole: 'CUSTOMER',
        lumberRegion: 'Central Florida',
        lumberCounty: 'Orange',
      });
      companyIds.push(customer.data.createCompany.id);

      const supplier = await client.post<
        RecordResponse<'createCompany', IdentifiedRecord>
      >('/rest/companies', {
        name: `${testReference} supplier`,
        lumberRole: 'SUPPLIER',
      });
      companyIds.push(supplier.data.createCompany.id);

      const product = await client.post<
        RecordResponse<'createLumberProduct', IdentifiedRecord>
      >('/rest/lumberProducts', {
        name: `${testReference} sample product`,
        supplierId: supplier.data.createCompany.id,
        quantityUnit: 'BOARD_FEET',
        sampleReference: 'Sample A',
      });

      const visit = await client.post<
        RecordResponse<'createSiteVisit', IdentifiedRecord>
      >('/rest/siteVisits', {
        name: `${testReference} site visit`,
        customerId: customer.data.createCompany.id,
        productId: product.data.createLumberProduct.id,
        status: 'COMPLETED',
        samplesShown: 'Sample A shown on site',
        feedback: 'Requested a quote',
      });
      expect(visit.data.createSiteVisit.id).toBeTruthy();

      const order = await client.post<
        RecordResponse<'createLumberOrder', IdentifiedRecord>
      >('/rest/lumberOrders', {
        name: `${testReference} order`,
        customerId: customer.data.createCompany.id,
        supplierId: supplier.data.createCompany.id,
        status: 'QUOTED',
        orderValue: { amountMicros: '20000000000', currencyCode: 'USD' },
      });
      const orderId = order.data.createLumberOrder.id;

      const line = await client.post<
        RecordResponse<'createLumberOrderLine', IdentifiedRecord>
      >('/rest/lumberOrderLines', {
        name: `${testReference} line`,
        orderId,
        productId: product.data.createLumberProduct.id,
        quantity: 1_000,
        quantityUnit: 'BOARD_FEET',
      });
      const lineId = line.data.createLumberOrderLine.id;

      await client.patch(`/rest/lumberOrders/${orderId}`, {
        status: 'CONFIRMED',
        confirmedAt: '2026-11-15T15:00:00.000Z',
      });

      const shipment = await client.post<
        RecordResponse<'createLumberShipment', IdentifiedRecord>
      >('/rest/lumberShipments', {
        name: `${testReference} first delivery`,
        orderLineId: lineId,
        shipmentReference: `${testReference} consignment`,
        status: 'DELIVERED',
        quantity: 400,
        quantityUnit: 'BOARD_FEET',
        deliveredAt: '2026-11-15T15:00:00.000Z',
      });
      const delivered = await client.get<
        RecordResponse<
          'lumberShipment',
          IdentifiedRecord & { orderLineId: string; quantity: number }
        >
      >(`/rest/lumberShipments/${shipment.data.createLumberShipment.id}`);
      expect(delivered.data.lumberShipment).toMatchObject({
        orderLineId: lineId,
        quantity: 400,
      });

      const remainingLine = await client.get<
        RecordResponse<
          'lumberOrderLine',
          IdentifiedRecord & { quantity: number }
        >
      >(`/rest/lumberOrderLines/${lineId}`);
      expect(remainingLine.data.lumberOrderLine.quantity).toBe(1_000);
      expect(
        remainingLine.data.lumberOrderLine.quantity -
          delivered.data.lumberShipment.quantity,
      ).toBe(600);

      const reorder = await client.post<
        RecordResponse<'createReorderPlan', IdentifiedRecord>
      >('/rest/reorderPlans', {
        name: `${testReference} recurring review`,
        customerId: customer.data.createCompany.id,
        referenceOrderId: orderId,
        repeatMonths: 3,
        nextNeedAt: '2027-02-15T15:00:00.000Z',
        reviewAt: '2027-01-15T15:00:00.000Z',
      });
      expect(reorder.data.createReorderPlan.id).toBeTruthy();

      const commission = await client.post<
        RecordResponse<'createLumberCommission', CommissionRecord>
      >('/rest/lumberCommissions', {
        name: `${testReference} commission`,
        orderId,
        status: 'TBD',
      });
      const commissionId = commission.data.createLumberCommission.id;
      const readCommission = async () => {
        const response = await client.get<
          RecordResponse<'lumberCommission', CommissionRecord>
        >(`/rest/lumberCommissions/${commissionId}`);

        return response.data.lumberCommission;
      };
      const initialCommission = await readCommission();
      expect(initialCommission.commissionRate).toBeNull();
      expect(
        initialCommission.expectedCommission?.amountMicros ?? null,
      ).toBeNull();
      expect(
        initialCommission.yourExpectedShare?.amountMicros ?? null,
      ).toBeNull();
      expect(
        initialCommission.receivedCommission?.amountMicros ?? null,
      ).toBeNull();

      await client.patch(`/rest/lumberCommissions/${commissionId}`, {
        status: 'CONFIRMED',
        commissionRate: 5,
        eligibleBasis: 'Product value excluding freight and taxes',
        eligibleAmount: { amountMicros: '20000000000', currencyCode: 'USD' },
        splitConfirmed: false,
      });

      await expect
        .poll(
          async () =>
            (
              await readCommission()
            ).expectedCommission?.amountMicros?.toString(),
          { timeout: 20_000, interval: 250 },
        )
        .toBe('1000000000');
      const agreedCommission = await readCommission();
      expect(
        agreedCommission.yourExpectedShare?.amountMicros ?? null,
      ).toBeNull();
      expect(
        agreedCommission.partnerPoolExpectedShare?.amountMicros ?? null,
      ).toBeNull();
      expect(
        agreedCommission.receivedCommission?.amountMicros ?? null,
      ).toBeNull();

      await client.patch(`/rest/lumberCommissions/${commissionId}`, {
        splitConfirmed: true,
        yourSharePercent: 50,
        partnerPoolSharePercent: 50,
        splitTerms:
          'Half to the owner side; half to the partner pool collectively',
      });

      await expect
        .poll(
          async () => {
            const record = await readCommission();

            return {
              yours: record.yourExpectedShare?.amountMicros?.toString(),
              partners:
                record.partnerPoolExpectedShare?.amountMicros?.toString(),
            };
          },
          { timeout: 20_000, interval: 250 },
        )
        .toEqual({ yours: '500000000', partners: '500000000' });
    } finally {
      await Promise.all(
        companyIds.map((id) => client.delete(`/rest/companies/${id}`)),
      );
    }
  });
});
