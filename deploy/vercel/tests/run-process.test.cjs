'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');
const { test } = require('node:test');
const { runProcess } = require('../runtime/run-process.cjs');

test('successful child execution receives runtime settings without logging them', async () => {
  const child = new EventEmitter();
  const environment = { SECRET: 'must-remain-private' };
  await runProcess('node', ['dist/main'], {
    environment,
    spawnProcess: (command, args, options) => {
      assert.equal(command, 'node');
      assert.deepEqual(args, ['dist/main']);
      assert.equal(options.env, environment);
      assert.equal(options.stdio, 'inherit');
      setImmediate(() => child.emit('exit', 0, null));
      return child;
    },
  });
});

test('nonzero child exit propagates its status', async () => {
  const child = new EventEmitter();
  await assert.rejects(
    runProcess('node', [], {
      spawnProcess: () => {
        setImmediate(() => child.emit('exit', 7, null));
        return child;
      },
      label: 'database upgrade',
    }),
    {
      code: 'VERCEL_PROCESS',
      exitCode: 7,
      message: 'The database upgrade process failed.',
    },
  );
});

test('spawn errors do not expose arbitrary secret-bearing diagnostics', async () => {
  const child = new EventEmitter();
  await assert.rejects(
    runProcess('node', [], {
      spawnProcess: () => {
        setImmediate(() =>
          child.emit('error', new Error('connection contains secret-password')),
        );
        return child;
      },
    }),
    (error) => {
      assert.equal(error.message.includes('secret-password'), false);
      assert.equal(error.exitCode, 1);
      return true;
    },
  );
});

test('SIGTERM reaches the child and waits for a graceful exit', async () => {
  const child = new EventEmitter();
  const controller = new AbortController();
  const signals = [];
  child.kill = (signal) => {
    signals.push(signal);
    setImmediate(() => child.emit('exit', 0, null));
  };
  const completion = runProcess('node', [], {
    signal: controller.signal,
    spawnProcess: () => child,
  });
  controller.abort('SIGTERM');
  await completion;
  assert.deepEqual(signals, ['SIGTERM']);
});

test('unresponsive children are killed after the shutdown deadline', async () => {
  const child = new EventEmitter();
  const controller = new AbortController();
  const signals = [];
  child.kill = (signal) => signals.push(signal);
  const completion = runProcess('node', [], {
    signal: controller.signal,
    spawnProcess: () => child,
    shutdownTimeoutMs: 5,
  });
  controller.abort('SIGTERM');
  await delay(20);
  child.emit('exit', null, 'SIGKILL');
  await assert.rejects(completion, { code: 'VERCEL_PROCESS' });
  assert.deepEqual(signals, ['SIGTERM', 'SIGKILL']);
});

test('an already-aborted operation never launches a child', async () => {
  const controller = new AbortController();
  controller.abort(new Error('stopping'));
  await assert.rejects(
    runProcess('node', [], {
      signal: controller.signal,
      spawnProcess: () => assert.fail('must not spawn'),
    }),
    /stopping/,
  );
});
