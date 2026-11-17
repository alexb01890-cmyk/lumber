'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { test } = require('node:test');
const { runLumberInstaller } = require('../runtime/run-lumber-installer.cjs');
const { runInstallerChild } = require('../runtime/lumber-installer-child.cjs');
const {
  LUMBER_APPLICATION_IDENTIFIER,
} = require('../runtime/lumber-bundle.cjs');

const INPUT = {
  bundleDirectory: '/app/vercel/lumber-application',
  workspaceId: 'f61dac22-2189-4c49-bda3-53cc358645c7',
  contentHash: 'a'.repeat(64),
};
const RESULT = {
  workspaceId: INPUT.workspaceId,
  applicationId: '5d3588b7-75f8-4e6c-b22b-05c31b59a0f2',
  applicationUniversalIdentifier: LUMBER_APPLICATION_IDENTIFIER,
  contentHash: INPUT.contentHash,
};
const childFixture = (respond) => {
  const child = new EventEmitter();
  const calls = { messages: [], signals: [], options: null };
  child.send = (message) => {
    calls.messages.push(message);
    queueMicrotask(() => respond?.(child, message));
  };
  child.kill = (signal) => {
    calls.signals.push(signal);
    if (signal === 'SIGKILL') queueMicrotask(() => child.emit('close', 137));
  };
  const forkProcess = (_entrypoint, args, options) => {
    assert.deepEqual(args, []);
    calls.options = options;
    return child;
  };
  return { child, calls, forkProcess };
};

test('only isolated IPC receives installer results and success requires a clean child exit', async () => {
  const stub = childFixture((child) => {
    child.emit('message', {
      type: 'lumber-installation-success',
      result: RESULT,
    });
    child.emit('exit', 0);
  });
  const environment = { PG_DATABASE_URL: 'private-database-value' };
  const result = await runLumberInstaller(INPUT, {
    environment,
    forkProcess: stub.forkProcess,
  });
  assert.deepEqual(result, RESULT);
  assert.deepEqual(stub.calls.options.stdio, [
    'ignore',
    'ignore',
    'ignore',
    'ipc',
  ]);
  assert.deepEqual(stub.calls.options.execArgv, []);
  assert.equal(stub.calls.options.env, environment);
  assert.deepEqual(stub.calls.messages, [
    { type: 'lumber-installation-request', ...INPUT },
  ]);
});

for (const changedField of ['workspaceId', 'contentHash']) {
  test(`a mismatched ${changedField} is rejected instead of becoming a verified result`, async () => {
    const stub = childFixture((child) =>
      child.emit('message', {
        type: 'lumber-installation-success',
        result: { ...RESULT, [changedField]: 'untrusted' },
      }),
    );
    await assert.rejects(
      runLumberInstaller(INPUT, {
        forkProcess: stub.forkProcess,
        killGraceMilliseconds: 1,
      }),
      /installer process/,
    );
    assert.deepEqual(stub.calls.signals, ['SIGTERM', 'SIGKILL']);
  });
}

test('a valid response followed by a failing exit cannot report success', async () => {
  const stub = childFixture((child) => {
    child.emit('message', {
      type: 'lumber-installation-success',
      result: RESULT,
    });
    child.emit('exit', 1);
  });
  await assert.rejects(
    runLumberInstaller(INPUT, { forkProcess: stub.forkProcess }),
    /installer process/,
  );
});

test('known failure phases are retained without forwarding provider message fields', async () => {
  const stub = childFixture((child) => {
    child.emit('message', {
      type: 'lumber-installation-failure',
      phase: 'artifact upload',
      error: 'https://user:provider-secret@storage.example/private',
    });
    child.emit('exit', 1);
  });
  await assert.rejects(
    runLumberInstaller(INPUT, { forkProcess: stub.forkProcess }),
    (error) => {
      assert.equal(error.phase, 'artifact upload');
      assert.doesNotMatch(
        error.stack + JSON.stringify(error),
        /provider-secret|storage\.example/,
      );
      return true;
    },
  );
});

test('abort escalates an ignored SIGTERM to SIGKILL and rejects installation', async () => {
  const controller = new AbortController();
  const stub = childFixture(() => controller.abort());
  await assert.rejects(
    runLumberInstaller(INPUT, {
      signal: controller.signal,
      forkProcess: stub.forkProcess,
      killGraceMilliseconds: 1,
    }),
    /cancellation/,
  );
  assert.deepEqual(stub.calls.signals, ['SIGTERM', 'SIGKILL']);
});

test('an error after spawn preserves the kill deadline until the child closes', async () => {
  const stub = childFixture((child) =>
    child.emit('error', new Error('provider-secret')),
  );
  await assert.rejects(
    runLumberInstaller(INPUT, {
      forkProcess: stub.forkProcess,
      killGraceMilliseconds: 1,
    }),
    (error) => {
      assert.doesNotMatch(
        error.stack + JSON.stringify(error),
        /provider-secret/,
      );
      return true;
    },
  );
  assert.deepEqual(stub.calls.signals, ['SIGTERM', 'SIGKILL']);
});

const processFixture = () => {
  const messages = [];
  let disconnectCount = 0;
  const runtimeProcess = {
    connected: true,
    send: (message, done) => {
      messages.push(message);
      done();
    },
    disconnect: () => {
      disconnectCount++;
    },
  };
  return { messages, runtimeProcess, disconnectCount: () => disconnectCount };
};

test('child sends a typed verified success and passes the expected bundle hash to the installer', async () => {
  const stub = processFixture();
  let input;
  await runInstallerChild(
    { type: 'lumber-installation-request', ...INPUT },
    {
      runtimeProcess: stub.runtimeProcess,
      install: async (value) => {
        input = value;
        return RESULT;
      },
    },
  );
  assert.equal(input.expectedContentHash, INPUT.contentHash);
  assert.equal(input.workspaceId, INPUT.workspaceId);
  assert.deepEqual(stub.messages, [
    { type: 'lumber-installation-success', result: RESULT },
  ]);
  assert.equal(stub.runtimeProcess.exitCode, 0);
  assert.equal(stub.disconnectCount(), 1);
});

test('child returns only a safe failure phase when the provider throws private data', async () => {
  const stub = processFixture();
  await runInstallerChild(
    { type: 'lumber-installation-request', ...INPUT },
    {
      runtimeProcess: stub.runtimeProcess,
      install: async () => {
        throw new Error('postgres://user:provider-secret@host.example/db');
      },
    },
  );
  assert.deepEqual(stub.messages, [
    { type: 'lumber-installation-failure', phase: 'installer process' },
  ]);
  assert.doesNotMatch(
    JSON.stringify(stub.messages),
    /provider-secret|host\.example/,
  );
  assert.equal(stub.runtimeProcess.exitCode, 1);
  assert.equal(stub.disconnectCount(), 1);
});

for (const workspaceId of [undefined, 'foreign-invalid-id']) {
  test(`child rejects ${JSON.stringify(workspaceId)} workspace identity before invoking the installer`, async () => {
    const stub = processFixture();
    let installs = 0;
    await runInstallerChild(
      { type: 'lumber-installation-request', ...INPUT, workspaceId },
      {
        runtimeProcess: stub.runtimeProcess,
        install: async () => {
          installs++;
          return RESULT;
        },
      },
    );
    assert.equal(installs, 0);
    assert.deepEqual(stub.messages, [
      { type: 'lumber-installation-failure', phase: 'installer process' },
    ]);
    assert.equal(stub.runtimeProcess.exitCode, 1);
  });
}
