import {
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventBatchPayload } from 'twenty-sdk/logic-function';
import { RestApiClient } from 'twenty-client-sdk/rest';

import { recomputeCommissions } from 'src/utils/recompute-commissions.util';

export default defineLogicFunction({
  universalIdentifier: '6ef09aaf-88df-4f93-9e46-6d61247952ef',
  name: 'on-commission-created',
  description:
    'Recalculate confirmed commissions from the current saved terms, leaving unknown earnings blank.',
  timeoutSeconds: 30,
  databaseEventTriggerSettings: {
    eventName: 'lumberCommission.created',
    batchMode: true,
  },
  handler: async (
    batch: DatabaseEventBatchPayload<
      ObjectRecordCreateEvent<{ id?: string | null }>
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
