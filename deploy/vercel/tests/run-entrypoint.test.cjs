'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { test } = require('node:test');
const { runEntrypoint } = require('../runtime/run-entrypoint.cjs');

const fakeProcess = () => {
  const runtimeProcess = new EventEmitter();
  runtimeProcess.output = '';
  runtimeProcess.stderr = {
    write: (text) => {
      runtimeProcess.output += text;
    },
  };
  return runtimeProcess;
};

test('configuration failures show actionable variable names', async () => {
  const runtimeProcess = fakeProcess();
  await runEntrypoint(
    async () => {
      const error = new Error(
        'Set the required environment variable REDIS_URL.',
      );
      error.code = 'VERCEL_CONFIGURATION';
      throw error;
    },
    { runtimeProcess, environment: {} },
  );
  assert.equal(runtimeProcess.exitCode, 1);
  assert.match(runtimeProcess.output, /REDIS_URL/);
  assert.equal(runtimeProcess.listenerCount('SIGTERM'), 0);
});

test('unexpected provider errors never print secret-bearing messages', async () => {
  const runtimeProcess = fakeProcess();
  await runEntrypoint(
    async () => {
      throw new Error('postgresql://user:secret@private-host/database');
    },
    { runtimeProcess, environment: {} },
  );
  assert.equal(runtimeProcess.exitCode, 1);
  assert.equal(runtimeProcess.output.includes('secret'), false);
  assert.equal(runtimeProcess.output.includes('private-host'), false);
});

test('child failures preserve their exit status', async () => {
  const runtimeProcess = fakeProcess();
  await runEntrypoint(
    async () => {
      const error = new Error('The database upgrade process failed.');
      error.code = 'VERCEL_PROCESS';
      error.exitCode = 8;
      throw error;
    },
    { runtimeProcess, environment: {} },
  );
  assert.equal(runtimeProcess.exitCode, 8);
  assert.match(runtimeProcess.output, /database upgrade/);
});

for (const [signal, exitCode] of [
  ['SIGTERM', 143],
  ['SIGINT', 130],
]) {
  test(`${signal} aborts startup and releases process handlers`, async () => {
    const runtimeProcess = fakeProcess();
    const completion = runEntrypoint(
      async (_environment, { signal: abortSignal }) => {
        await new Promise((_resolve, reject) =>
          abortSignal.addEventListener(
            'abort',
            () => reject(abortSignal.reason),
            { once: true },
          ),
        );
      },
      { runtimeProcess, environment: {} },
    );
    runtimeProcess.emit(signal);
    await completion;
    assert.equal(runtimeProcess.exitCode, exitCode);
    assert.equal(runtimeProcess.output, '');
    assert.equal(runtimeProcess.listenerCount('SIGTERM'), 0);
    assert.equal(runtimeProcess.listenerCount('SIGINT'), 0);
  });
}
