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

for (const [code, category] of [
  ['MODULE_NOT_FOUND', 'runtime dependency is missing'],
  ['ERR_MODULE_NOT_FOUND', 'runtime dependency is missing'],
  ['28P01', 'PostgreSQL authentication failed'],
  ['42501', 'PostgreSQL permissions are insufficient'],
  ['3D000', 'PostgreSQL database does not exist'],
  ['SELF_SIGNED_CERT_IN_CHAIN', 'TLS certificate verification failed'],
  ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'TLS certificate verification failed'],
  ['ENOTFOUND', 'hostname could not be resolved'],
  ['ECONNREFUSED', 'connection was refused'],
  ['ETIMEDOUT', 'connection timed out'],
  ['EROFS', 'read-only filesystem'],
]) {
  test(`known ${code} errors expose only an allowlisted category`, async () => {
    const runtimeProcess = fakeProcess();
    const error = new Error(
      'postgresql://user:secret-password@private-host/database',
    );
    error.code = code;
    error.stack = 'sensitive-stack-data';
    await runEntrypoint(
      async () => {
        throw error;
      },
      { runtimeProcess, environment: {} },
    );
    assert.ok(runtimeProcess.output.includes(code));
    assert.ok(runtimeProcess.output.includes(category));
    for (const secret of [
      'secret-password',
      'private-host',
      'sensitive-stack-data',
      'postgresql://',
    ]) {
      assert.equal(runtimeProcess.output.includes(secret), false);
    }
    assert.equal(runtimeProcess.exitCode, 1);
  });
}

test('wrapped provider failures are classified without exposing the wrapper or cause message', async () => {
  const runtimeProcess = fakeProcess();
  const cause = new Error('certificate-chain-secret');
  cause.code = 'DEPTH_ZERO_SELF_SIGNED_CERT';
  const error = new Error('secret outer URL', { cause });
  await runEntrypoint(
    async () => {
      throw error;
    },
    { runtimeProcess, environment: {} },
  );
  assert.match(runtimeProcess.output, /DEPTH_ZERO_SELF_SIGNED_CERT/);
  assert.equal(runtimeProcess.output.includes('secret'), false);
});

test('aggregate connection failures are classified without arbitrary provider codes', async () => {
  const runtimeProcess = fakeProcess();
  const cause = new Error('secret connection diagnostics');
  cause.code = 'EHOSTUNREACH';
  const error = new AggregateError([cause], 'secret aggregate diagnostics');
  error.code = 'unknown-secret-code';
  await runEntrypoint(
    async () => {
      throw error;
    },
    { runtimeProcess, environment: {} },
  );
  assert.match(runtimeProcess.output, /EHOSTUNREACH/);
  assert.equal(runtimeProcess.output.includes('secret'), false);
});

test('unknown provider codes and invalid exit status stay private', async () => {
  const runtimeProcess = fakeProcess();
  const error = new Error('secret message');
  error.code = 'ETIMEDOUT-with-secret-suffix';
  error.exitCode = 'secret-exit-status';
  error.cause = error;
  await runEntrypoint(
    async () => {
      throw error;
    },
    { runtimeProcess, environment: {} },
  );
  assert.equal(runtimeProcess.output.includes('secret'), false);
  assert.equal(runtimeProcess.output.includes('ETIMEDOUT'), false);
  assert.equal(runtimeProcess.exitCode, 1);
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
