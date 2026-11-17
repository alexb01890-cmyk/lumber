'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { startWeb } = require('../runtime/start-web.cjs');
const { validEnvironment } = require('./fixtures/valid-environment.cjs');

test('web starts only the API after the matching database bootstrap', async () => {
  const calls = [];
  const client = {};
  await startWeb(
    { ...validEnvironment(), PORT: '4300' },
    {
      createClient: () => client,
      wait: async (receivedClient, scope) => {
        assert.equal(receivedClient, client);
        assert.equal(scope.deploymentId, 'dpl_test');
        calls.push('database ready');
      },
      run: async (command, args, options) => {
        assert.equal(command, 'node');
        assert.deepEqual(args, ['dist/main']);
        assert.equal(
          options.environment.SERVER_INTERNAL_URL,
          'http://127.0.0.1:4300',
        );
        assert.equal(options.environment.DISABLE_DB_MIGRATIONS, 'true');
        calls.push('web started');
      },
    },
  );
  assert.deepEqual(calls, ['database ready', 'web started']);
});

test('missing configuration never opens a connection or starts an application', async () => {
  await assert.rejects(
    startWeb(
      {},
      {
        createClient: () => assert.fail('must not connect'),
        run: async () => assert.fail('must not start'),
      },
    ),
    { code: 'VERCEL_CONFIGURATION' },
  );
});

test('failed readiness blocks API startup', async () => {
  await assert.rejects(
    startWeb(validEnvironment(), {
      createClient: () => ({}),
      wait: async () => {
        throw new Error('bootstrap unavailable');
      },
      run: async () => assert.fail('must not start'),
    }),
    /bootstrap unavailable/,
  );
});
