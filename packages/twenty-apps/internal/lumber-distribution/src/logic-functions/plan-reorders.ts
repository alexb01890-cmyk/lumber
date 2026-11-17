import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { previewReorders } from 'src/utils/preview-reorders.util';

export default defineLogicFunction({
  universalIdentifier: '8888fbe0-3eba-4dd2-9298-1864e95f5da8',
  name: 'plan-reorders',
  description:
    'Preview reorder review dates and calendar-month intervals without creating orders.',
  timeoutSeconds: 5,
  handler: async (event: RoutePayload<unknown>) => {
    try {
      return previewReorders(event.body);
    } catch (error) {
      return {
        __twentyHttpResponse: true,
        status: 400,
        body: {
          error:
            error instanceof Error ? error.message : 'Invalid preview inputs.',
        },
      };
    }
  },
  httpRouteTriggerSettings: {
    path: '/plan-reorders',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
