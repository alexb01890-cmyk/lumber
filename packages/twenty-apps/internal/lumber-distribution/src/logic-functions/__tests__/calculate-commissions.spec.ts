import { EXECUTION_CONTEXT } from './execution-context.test-support';
import { describe, expect, it } from 'vitest';
import { type RoutePayload } from 'twenty-sdk/define';

import definition from '../calculate-commissions';

const invoke = (payload: RoutePayload<unknown>) =>
  definition.config.handler(payload, EXECUTION_CONTEXT);

describe('calculate-commissions route', () => {
  it('requires authentication and returns bulk previews from the HTTP body', async () => {
    expect(definition.config.httpRouteTriggerSettings).toMatchObject({
      httpMethod: 'POST',
      isAuthRequired: true,
    });
    const result = await invoke({
      body: { records: [] },
    } as RoutePayload<unknown>);

    expect(result).toEqual({ previewOnly: true, records: [] });
  });

  it('returns an actionable validation response', async () => {
    expect(await invoke({ body: {} } as RoutePayload<unknown>)).toMatchObject({
      __twentyHttpResponse: true,
      status: 400,
      body: { error: expect.stringContaining('records') },
    });
  });
});
