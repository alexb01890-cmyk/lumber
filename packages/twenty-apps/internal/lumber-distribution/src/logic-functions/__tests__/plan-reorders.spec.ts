import { EXECUTION_CONTEXT } from './execution-context.test-support';
import { describe, expect, it } from 'vitest';
import { type RoutePayload } from 'twenty-sdk/define';

import definition from '../plan-reorders';

const invoke = (payload: RoutePayload<unknown>) =>
  definition.config.handler(payload, EXECUTION_CONTEXT);

describe('plan-reorders route', () => {
  it('requires authentication and previews without creating orders', async () => {
    expect(definition.config.httpRouteTriggerSettings).toMatchObject({
      httpMethod: 'POST',
      isAuthRequired: true,
    });
    expect(
      await invoke({ body: { records: [] } } as RoutePayload<unknown>),
    ).toEqual({ previewOnly: true, records: [] });
  });

  it('returns a validation response for malformed dates or intervals', async () => {
    expect(await invoke({ body: {} } as RoutePayload<unknown>)).toMatchObject({
      __twentyHttpResponse: true,
      status: 400,
      body: { error: expect.stringContaining('records') },
    });
  });
});
