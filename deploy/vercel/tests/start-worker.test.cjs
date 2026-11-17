'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { startWorker } = require('../runtime/start-worker.cjs');
const { validEnvironment } = require('./fixtures/valid-environment.cjs');

test('worker completes bootstrap before consuming jobs and uses the private API binding', async () => {
  const calls = [];
  await startWorker(validEnvironment(), {
    createClient: () => ({}),
    bootstrap: async (_client, scope, { runCommand }) => {
      assert.equal(scope.runtimeVersion, '2.58.0');
      calls.push('bootstrap');
      await runCommand('node', ['dist/command/command', 'upgrade']);
      calls.push('bootstrap finished');
    },
    run: async (command, args, options) => {
      assert.equal(command, 'node');
      assert.equal(
        options.environment.SERVER_INTERNAL_URL,
        'https://crm.service.example.com',
      );
      assert.equal(options.environment.LOGIC_FUNCTION_TYPE, 'LOCAL');
      calls.push(args.join(' '));
    },
  });
  assert.deepEqual(calls, [
    'bootstrap',
    'dist/command/command upgrade',
    'bootstrap finished',
    'dist/queue-worker/queue-worker',
  ]);
});

test('failed bootstrap prevents queue consumption', async () => {
  await assert.rejects(
    startWorker(validEnvironment(), {
      createClient: () => ({}),
      bootstrap: async () => {
        throw new Error('migration failure');
      },
      run: async () => assert.fail('must not consume'),
    }),
    /migration failure/,
  );
});

test('missing configuration fails before touching the database', async () => {
  await assert.rejects(
    startWorker({}, { createClient: () => assert.fail('must not connect') }),
    { code: 'VERCEL_CONFIGURATION' },
  );
});
