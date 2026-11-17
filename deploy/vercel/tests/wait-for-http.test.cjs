'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { test } = require('node:test');
const { waitForHttp } = require('../runtime/wait-for-http.cjs');

test('HTTP readiness waits through startup responses before accepting a healthy API', async () => {
  let requests = 0;
  const server = http.createServer((_request, response) => {
    response.writeHead(++requests < 3 ? 503 : 200);
    response.end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await waitForHttp(server.address().port, { timeoutMs: 2000, pollMs: 1 });
    assert.equal(requests, 3);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('an unavailable API times out and a canceled startup stops polling', async () => {
  const server = http.createServer((_request, response) => {
    response.writeHead(503);
    response.end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await assert.rejects(
      waitForHttp(server.address().port, { timeoutMs: 10, pollMs: 1 }),
      { code: 'VERCEL_PROCESS' },
    );
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      waitForHttp(server.address().port, { signal: controller.signal }),
      { name: 'AbortError' },
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
