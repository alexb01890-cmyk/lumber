import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { previewCommissions } from 'src/utils/preview-commissions.util';

export default defineLogicFunction({
  universalIdentifier: '47acbed0-1321-4ea2-bc02-57115077f07b',
  name: 'calculate-commissions',
  description:
    'Preview USD commissions and confirmed partner-pool splits without changing records.',
  timeoutSeconds: 5,
  handler: async (event: RoutePayload<unknown>) => {
    try {
      return previewCommissions(event.body);
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
    path: '/calculate-commissions',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
