'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { startWeb } = require('../runtime/start-web.cjs');
const { validateEnvironment } = require('../runtime/validate-environment.cjs');
const { validEnvironment } = require('./fixtures/valid-environment.cjs');

test('public listener opens before bootstrap and routes only after the private API is healthy', async () => {
  const calls = [];
  const client = {};
  let finishChild;
  await startWeb(
    { ...validEnvironment(), PORT: '4300' },
    {
      createClient: () => client,
      createServer: async ({ port, backendPort }) => {
        assert.equal(port, 4300);
        assert.equal(backendPort, 3001);
        calls.push('listener open');
        return {
          markReady: () => {
            calls.push('traffic ready');
            finishChild();
          },
          close: async () => calls.push('listener closed'),
        };
      },
      wait: async (receivedClient, scope) => {
        assert.equal(receivedClient, client);
        assert.equal(
          scope.deploymentId,
          validateEnvironment(validEnvironment(), 'worker').scope.deploymentId,
        );
        calls.push('database ready');
      },
      run: (command, args, options) => {
        assert.equal(command, 'node');
        assert.deepEqual(args, ['dist/main']);
        assert.equal(
          options.environment.SERVER_INTERNAL_URL,
          'http://127.0.0.1:3001',
        );
        assert.equal(options.environment.DISABLE_DB_MIGRATIONS, 'true');
        calls.push('web started');
        return new Promise((resolve) => {
          finishChild = resolve;
        });
      },
      waitHttp: async (port) => {
        assert.equal(port, 3001);
        calls.push('HTTP healthy');
      },
    },
  );
  assert.deepEqual(calls, [
    'listener open',
    'database ready',
    'web started',
    'HTTP healthy',
    'traffic ready',
    'listener closed',
  ]);
});

test('missing configuration never opens a listener or database connection', async () => {
  await assert.rejects(
    startWeb(
      {},
      {
        createServer: () => assert.fail('must not listen'),
        createClient: () => assert.fail('must not connect'),
        run: async () => assert.fail('must not start'),
      },
    ),
    { code: 'VERCEL_CONFIGURATION' },
  );
});

test('failed database readiness closes the startup listener without marking it ready', async () => {
  let closed = false;
  await assert.rejects(
    startWeb(validEnvironment(), {
      createServer: async () => ({
        markReady: () => assert.fail('must not route'),
        close: async () => {
          closed = true;
        },
      }),
      createClient: () => ({}),
      wait: async () => {
        throw new Error('bootstrap unavailable');
      },
      run: async () => assert.fail('must not start'),
    }),
    /bootstrap unavailable/,
  );
  assert.equal(closed, true);
});

test('a failed child cannot leave the startup listener open', async () => {
  let closed = false;
  await assert.rejects(
    startWeb(validEnvironment(), {
      createServer: async () => ({
        markReady: () => assert.fail('must not route'),
        close: async () => {
          closed = true;
        },
      }),
      createClient: () => ({}),
      wait: async () => {},
      run: async () => {
        throw new Error('child failed');
      },
      waitHttp: async (_port, { signal }) =>
        new Promise((resolve) =>
          signal.addEventListener('abort', resolve, { once: true }),
        ),
    }),
    /child failed/,
  );
  assert.equal(closed, true);
});
