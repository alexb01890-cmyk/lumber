import { EXECUTION_CONTEXT } from './execution-context.test-support';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import definition from '../on-commission-updated';
import { recomputeCommissions } from 'src/utils/recompute-commissions.util';

const { client, constructor } = vi.hoisted(() => ({
  client: {},
  constructor: vi.fn(),
}));

vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: class {
    constructor(options: unknown) {
      constructor(options);
      return client;
    }
  },
}));
vi.mock('src/utils/recompute-commissions.util', () => ({
  recomputeCommissions: vi.fn(),
}));

const invoke = (payload: Parameters<typeof definition.config.handler>[0]) =>
  definition.config.handler(payload, EXECUTION_CONTEXT);

describe('on-commission-updated', () => {
  beforeEach(() => vi.clearAllMocks());

  it('recomputes the saved records with application access rather than trusting event values', async () => {
    await invoke({
      events: [
        { recordId: 'record-1', properties: { after: { id: 'record-1' } } },
        { recordId: 'record-2', properties: { after: {} } },
      ],
    } as Parameters<typeof definition.config.handler>[0]);

    expect(constructor).toHaveBeenCalledWith({ runAs: 'application' });
    expect(recomputeCommissions).toHaveBeenCalledWith(client, [
      'record-1',
      'record-2',
    ]);
  });

  it('accepts an empty event batch', async () => {
    await invoke({ events: [] } as Parameters<
      typeof definition.config.handler
    >[0]);

    expect(recomputeCommissions).toHaveBeenCalledWith(client, []);
  });
});

it('watches source terms only so derived writes cannot retrigger themselves', () => {
  expect(definition.config.databaseEventTriggerSettings?.updatedFields).toEqual(
    expect.arrayContaining([
      'status',
      'eligibleAmount',
      'commissionRate',
      'splitConfirmed',
    ]),
  );
  expect(
    definition.config.databaseEventTriggerSettings?.updatedFields,
  ).not.toEqual(
    expect.arrayContaining(['expectedCommission', 'yourExpectedShare']),
  );
});
