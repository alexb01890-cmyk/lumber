'use strict';

const http = require('node:http');
const { setTimeout: delay } = require('node:timers/promises');

const probeHttp = (port, signal) =>
  new Promise((resolve) => {
    const request = http.get(
      { hostname: '127.0.0.1', port, path: '/healthz', signal, timeout: 1000 },
      (response) => {
        response.resume();
        resolve(response.statusCode === 200);
      },
    );
    request.once('timeout', () => request.destroy());
    request.once('error', () => resolve(false));
  });

const waitForHttp = async (
  port,
  { signal, timeoutMs = 180000, pollMs = 500 } = {},
) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() <= deadline) {
    signal?.throwIfAborted();
    if (await probeHttp(port, signal)) return;
    await delay(pollMs, undefined, { signal });
  }
  const error = new Error('The Twenty HTTP server did not become ready.');
  error.code = 'VERCEL_PROCESS';
  throw error;
};

module.exports = { waitForHttp };
