'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  watchLumberInstallation,
} = require('../runtime/watch-lumber-installation.cjs');
const {
  LUMBER_APPLICATION_IDENTIFIER,
} = require('../runtime/lumber-bundle.cjs');

const WORKSPACE_ID = 'f61dac22-2189-4c49-bda3-53cc358645c7';
const OTHER_WORKSPACE_ID = 'a8eb6877-07d8-419e-b21a-08ae4de5ee00';
const APPLICATION_ID = '5d3588b7-75f8-4e6c-b22b-05c31b59a0f2';
const CONTENT_HASH = 'a'.repeat(64);

const fixture = () => {
  const workspace = {
    id: WORKSPACE_ID,
    activationStatus: 'CREATED',
    databaseSchema: 'workspace_test',
    defaultRoleId: '2e53d44f-fc60-4e43-a0c9-67cb3bfd02db',
    workspaceCustomApplicationId: 'cbfd849b-78da-400b-9a01-ed73624962ba',
    deletedAt: null,
  };
  const state = {
    workspaces: [workspace],
    markerHash: null,
    connectCount: 0,
    endCount: 0,
    delayCount: 0,
    installerCalls: [],
    queries: [],
    logs: [],
  };
  const installation = {
    workspaceId: WORKSPACE_ID,
    applicationId: APPLICATION_ID,
    applicationUniversalIdentifier: LUMBER_APPLICATION_IDENTIFIER,
    contentHash: CONTENT_HASH,
  };
  const client = {
    connect: async () => {
      state.connectCount++;
    },
    end: async () => {
      state.endCount++;
    },
    query: async (sql, values) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      state.queries.push({ sql: normalized, values });
      if (
        /\bFROM\s+(?:"core"\."workspace"|core\.workspace)\b/i.test(normalized)
      )
        return { rows: state.workspaces };
      if (
        /^SELECT\b/i.test(normalized) &&
        /lumber_installation/i.test(normalized)
      )
        return {
          rows: (
            values?.length === 2
              ? state.markerHash != null
              : state.markerHash === values?.[2]
          )
            ? [{ installed: true }]
            : [],
        };
      return { rows: [] };
    },
  };
  const environment = { LUMBER_AUTO_INSTALL: 'true' };
  const dependencies = {
    createClient: () => client,
    loadBundle: async () => ({
      application: { universalIdentifier: LUMBER_APPLICATION_IDENTIFIER },
      contentHash: CONTENT_HASH,
    }),
    runInstaller: async (...args) => {
      state.installerCalls.push(args);
      return installation;
    },
    delay: async () => {
      state.delayCount++;
    },
    log: (...args) => state.logs.push(args),
    pollMilliseconds: 1,
  };
  const insertQueries = () =>
    state.queries.filter(({ sql }) => /^INSERT\b/i.test(sql));
  return {
    workspace,
    state,
    client,
    environment,
    dependencies,
    installation,
    insertQueries,
  };
};

test('automatic installation remains disabled without touching storage or running a child', async () => {
  const stub = fixture();
  const result = await watchLumberInstallation({}, stub.dependencies);
  assert.equal(result.status, 'disabled');
  assert.equal(stub.state.connectCount, 0);
  assert.equal(stub.state.installerCalls.length, 0);
});

test('a matching workspace, application and content hash skips another installation', async () => {
  const stub = fixture();
  stub.state.markerHash = CONTENT_HASH;
  const result = await watchLumberInstallation(
    stub.environment,
    stub.dependencies,
  );
  assert.equal(result.status, 'already-installed');
  assert.equal(stub.state.installerCalls.length, 0);
  assert.equal(stub.insertQueries().length, 0);
  assert.equal(stub.state.endCount, 1);
  const markerQuery = stub.state.queries.find(
    ({ sql }) => /^SELECT\b/i.test(sql) && /lumber_installation/i.test(sql),
  );
  assert.deepEqual(markerQuery.values, [
    WORKSPACE_ID,
    LUMBER_APPLICATION_IDENTIFIER,
    CONTENT_HASH,
  ]);
});

test('a successful verified child result records only its exact installation identity', async () => {
  const stub = fixture();
  const result = await watchLumberInstallation(
    stub.environment,
    stub.dependencies,
  );
  assert.equal(result.status, 'installed');
  assert.equal(stub.state.installerCalls.length, 1);
  const [input, options] = stub.state.installerCalls[0];
  assert.equal(input.workspaceId, WORKSPACE_ID);
  assert.equal(input.contentHash, CONTENT_HASH);
  assert.equal(input.preserveWorkspaceSecurity, false);
  assert.equal(options.environment, stub.environment);
  assert.equal(stub.insertQueries().length, 1);
  assert.deepEqual(stub.insertQueries()[0].values.slice(0, 3), [
    WORKSPACE_ID,
    LUMBER_APPLICATION_IDENTIFIER,
    CONTENT_HASH,
  ]);
  assert.equal(stub.state.endCount, 1);
});

test('an update preserves owner security settings after a verified earlier installation', async () => {
  const stub = fixture();
  stub.state.markerHash = 'b'.repeat(64);
  const result = await watchLumberInstallation(
    stub.environment,
    stub.dependencies,
  );
  assert.equal(result.status, 'installed');
  assert.equal(stub.state.installerCalls[0][0].preserveWorkspaceSecurity, true);
});

test('an earlier bundle hash cannot skip installation of the current bundle', async () => {
  const stub = fixture();
  stub.state.markerHash = 'b'.repeat(64);
  const result = await watchLumberInstallation(
    stub.environment,
    stub.dependencies,
  );
  assert.equal(result.status, 'installed');
  assert.equal(stub.state.installerCalls.length, 1);
});

for (const initialState of ['missing', 'unprovisioned']) {
  test(`waits for an owner workspace when it is ${initialState}`, async () => {
    const stub = fixture();
    stub.state.workspaces =
      initialState === 'missing'
        ? []
        : [{ ...stub.workspace, activationStatus: 'PENDING_CREATION' }];
    stub.dependencies.delay = async () => {
      stub.state.delayCount++;
      assert.equal(stub.state.installerCalls.length, 0);
      stub.state.workspaces = [stub.workspace];
    };
    const result = await watchLumberInstallation(
      stub.environment,
      stub.dependencies,
    );
    assert.equal(result.status, 'installed');
    assert.equal(stub.state.delayCount, 1);
    assert.equal(stub.state.installerCalls.length, 1);
  });
}

test('multiple workspaces fail closed without choosing one or creating a marker', async () => {
  const stub = fixture();
  stub.state.workspaces.push({ ...stub.workspace, id: OTHER_WORKSPACE_ID });
  const result = await watchLumberInstallation(
    stub.environment,
    stub.dependencies,
  );
  assert.equal(result.status, 'failed');
  assert.equal(stub.state.installerCalls.length, 0);
  assert.equal(stub.insertQueries().length, 0);
  assert.equal(stub.state.endCount, 1);
});

test('a provisioned workspace without its role or custom application fails before running the installer', async () => {
  const stub = fixture();
  stub.workspace.workspaceCustomApplicationId = null;
  const result = await watchLumberInstallation(
    stub.environment,
    stub.dependencies,
  );
  assert.equal(result.status, 'failed');
  assert.equal(stub.state.installerCalls.length, 0);
  assert.equal(stub.insertQueries().length, 0);
  assert.equal(stub.state.endCount, 1);
});

for (const changedField of [
  'workspaceId',
  'applicationUniversalIdentifier',
  'contentHash',
  'applicationId',
]) {
  test(`a child result with an invalid ${changedField} never receives a success marker`, async () => {
    const stub = fixture();
    stub.installation[changedField] =
      changedField === 'workspaceId' ? OTHER_WORKSPACE_ID : 'untrusted';
    const result = await watchLumberInstallation(
      stub.environment,
      stub.dependencies,
    );
    assert.equal(result.status, 'failed');
    assert.equal(stub.insertQueries().length, 0);
    assert.equal(stub.state.endCount, 1);
  });
}

test('a failed child does not mark success or expose its provider error', async () => {
  const stub = fixture();
  stub.dependencies.runInstaller = async () => {
    throw new Error(
      'postgres://user:private-password@provider.example/db?token=secret-token',
    );
  };
  const result = await watchLumberInstallation(
    stub.environment,
    stub.dependencies,
  );
  assert.equal(result.status, 'failed');
  assert.equal(stub.insertQueries().length, 0);
  assert.equal(stub.state.endCount, 1);
  assert.doesNotMatch(
    JSON.stringify(stub.state.logs) + JSON.stringify(result),
    /private-password|provider\.example|secret-token/,
  );
});

test('database connection failures are reported safely and close the client', async () => {
  const stub = fixture();
  stub.client.connect = async () => {
    throw new Error('postgres://user:private-password@provider.example/db');
  };
  const result = await watchLumberInstallation(
    stub.environment,
    stub.dependencies,
  );
  assert.equal(result.status, 'failed');
  assert.equal(stub.state.installerCalls.length, 0);
  assert.equal(stub.insertQueries().length, 0);
  assert.equal(stub.state.endCount, 1);
  assert.doesNotMatch(
    JSON.stringify(stub.state.logs) + JSON.stringify(result),
    /private-password|provider\.example/,
  );
});

test('abort while waiting for signup closes the database connection without installing', async () => {
  const stub = fixture();
  const controller = new AbortController();
  stub.dependencies.signal = controller.signal;
  stub.state.workspaces = [];
  stub.dependencies.delay = async () => controller.abort();
  const result = await watchLumberInstallation(
    stub.environment,
    stub.dependencies,
  );
  assert.equal(result.status, 'aborted');
  assert.equal(stub.state.installerCalls.length, 0);
  assert.equal(stub.insertQueries().length, 0);
  assert.equal(stub.state.endCount, 1);
});

test('abort during installation propagates to the child and prevents a success marker', async () => {
  const stub = fixture();
  const controller = new AbortController();
  stub.dependencies.signal = controller.signal;
  stub.dependencies.runInstaller = async (_input, { signal }) => {
    assert.equal(signal, controller.signal);
    controller.abort();
    throw new Error('child aborted');
  };
  const result = await watchLumberInstallation(
    stub.environment,
    stub.dependencies,
  );
  assert.equal(result.status, 'aborted');
  assert.equal(stub.insertQueries().length, 0);
  assert.equal(stub.state.endCount, 1);
});
