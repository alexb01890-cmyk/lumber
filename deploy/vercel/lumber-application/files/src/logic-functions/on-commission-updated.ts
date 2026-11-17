import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventBatchPayload } from 'twenty-sdk/logic-function';
import { RestApiClient } from 'twenty-client-sdk/rest';

import { recomputeCommissions } from 'src/utils/recompute-commissions.util';

export default defineLogicFunction({
  universalIdentifier: '0053afbd-4a6f-44b8-9a57-ca3f4346737e',
  name: 'on-commission-updated',
  description:
    'Recalculate confirmed commissions from the current saved terms, leaving unknown earnings blank.',
  timeoutSeconds: 30,
  databaseEventTriggerSettings: {
    eventName: 'lumberCommission.updated',
    batchMode: true,
    updatedFields: [
      'status',
      'commissionRate',
      'eligibleBasis',
      'eligibleAmount',
      'splitConfirmed',
      'splitTerms',
      'yourSharePercent',
      'partnerPoolSharePercent',
    ],
  },
  handler: async (
    batch: DatabaseEventBatchPayload<
      ObjectRecordUpdateEvent<{ id?: string | null }>
    >,
  ) => {
    const ids = batch.events
      .map((event) => event.properties.after?.id ?? event.recordId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    await recomputeCommissions(
      new RestApiClient({ runAs: 'application' }),
      ids,
    );
  },
});
