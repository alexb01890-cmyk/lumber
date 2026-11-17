'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  installLumberApplication,
} = require('../runtime/install-lumber-application.cjs');
const {
  LUMBER_APPLICATION_IDENTIFIER,
} = require('../runtime/lumber-bundle.cjs');

const WORKSPACE_ID = 'f61dac22-2189-4c49-bda3-53cc358645c7';
const OTHER_WORKSPACE_ID = 'a8eb6877-07d8-419e-b21a-08ae4de5ee00';
const fixture = (overrides = {}) => {
  const calls = [];
  const workspace = {
    id: WORKSPACE_ID,
    activationStatus: 'CREATED',
    databaseSchema: 'workspace_test',
    defaultRoleId: '2e53d44f-fc60-4e43-a0c9-67cb3bfd02db',
    workspaceCustomApplicationId: 'cbfd849b-78da-400b-9a01-ed73624962ba',
    deletedAt: null,
  };
  const bundle = {
    application: {
      universalIdentifier: LUMBER_APPLICATION_IDENTIFIER,
      displayName: 'Lumber Distribution',
    },
    manifest: {
      application: { universalIdentifier: LUMBER_APPLICATION_IDENTIFIER },
    },
    files: [
      {
        filePath: 'health.mjs',
        fileFolder: 'built-logic-function',
        bytes: Buffer.from('compiled'),
      },
    ],
    contentHash: 'a'.repeat(64),
  };
  let syncCount = 0;
  const operator = {
    workspaceRepository: { find: async () => [workspace] },
    registrationLookup: {
      findOneByUniversalIdentifierGlobal: async () => null,
    },
    registrationService: {
      create: async (input) => calls.push(['register', input]),
      createWithClientSecret: async () => {
        throw new Error('Credentials must never be created');
      },
    },
    developmentService: {
      createDevelopmentApplication: async (input) =>
        calls.push(['install', input]),
      syncApplication: async (input) => {
        syncCount++;
        calls.push([input.dryRun ? 'plan' : 'sync', input]);
        return {
          applicationUniversalIdentifier: LUMBER_APPLICATION_IDENTIFIER,
          actions:
            syncCount < 3
              ? [{ type: 'create', metadataName: 'objectMetadata' }]
              : [],
        };
      },
      uploadApplicationFile: async (input) =>
        calls.push(['upload', input, await input.getFileBuffer()]),
    },
    applicationLookup: {
      findByUniversalIdentifier: async () => ({ id: 'installed-application' }),
    },
    cacheLock: { withLock: async (run) => run() },
    closeWorkspaceSecurity: async (workspaceId) =>
      calls.push(['security', workspaceId]),
    close: async () => calls.push(['close']),
  };
  Object.assign(operator, overrides);
  const dependencies = {
    environment: { NODE_ENV: 'production', APP_VERSION: '2.58.0' },
    loadBundle: async () => bundle,
    createOperator: async () => operator,
  };
  return { calls, workspace, bundle, operator, dependencies };
};

test('applies the fixed app through native services and preserves missing workspace entities', async () => {
  const stub = fixture();
  const result = await installLumberApplication(
    { bundleDirectory: '/bundle' },
    stub.dependencies,
  );
  assert.deepEqual(
    stub.calls.map(([phase]) => phase),
    [
      'register',
      'install',
      'plan',
      'upload',
      'sync',
      'plan',
      'security',
      'close',
    ],
  );
  assert.equal(result.workspaceId, WORKSPACE_ID);
  assert.equal(
    stub.calls.find(([phase]) => phase === 'security')[1],
    WORKSPACE_ID,
  );
  assert.equal(result.contentHash, stub.bundle.contentHash);
  const registration = stub.calls[0][1];
  assert.equal(registration.ownerWorkspaceId, WORKSPACE_ID);
  assert.equal(registration.oAuthClientSecretHash, null);
  assert.deepEqual(registration.oAuthScopes, []);
  assert.equal(
    stub.calls
      .filter(([phase]) => phase === 'sync' || phase === 'plan')
      .every(([, input]) => input.inferDeletionFromMissingEntities === false),
    true,
  );
  assert.deepEqual(
    stub.calls.find(([phase]) => phase === 'upload')[2],
    Buffer.from('compiled'),
  );
});

test('an existing owned local registration is reused without generating credentials', async () => {
  const stub = fixture({
    registrationLookup: {
      findOneByUniversalIdentifierGlobal: async () => ({
        ownerWorkspaceId: WORKSPACE_ID,
        sourceType: 'local',
      }),
    },
  });
  await installLumberApplication(
    { bundleDirectory: '/bundle' },
    stub.dependencies,
  );
  assert.equal(
    stub.calls.some(([phase]) => phase === 'register'),
    false,
  );
});

for (const sourceType of ['npm', 'oauth-only', 'local']) {
  test(`rejects a foreign-owned ${sourceType} registration before uploads or metadata changes`, async () => {
    const stub = fixture({
      registrationLookup: {
        findOneByUniversalIdentifierGlobal: async () => ({
          ownerWorkspaceId: OTHER_WORKSPACE_ID,
          sourceType,
        }),
      },
    });
    await assert.rejects(
      installLumberApplication(
        { bundleDirectory: '/bundle' },
        stub.dependencies,
      ),
      /ownership validation/,
    );
    assert.deepEqual(stub.calls, [['close']]);
  });
}

for (const invalid of [
  'multiple',
  'absent',
  'unprovisioned',
  'schema missing',
  'role missing',
  'custom application missing',
  'deleted',
  'wrong requested workspace',
]) {
  test(`rejects workspace selection when ${invalid}`, async () => {
    const stub = fixture();
    if (invalid === 'multiple')
      stub.operator.workspaceRepository.find = async () => [
        stub.workspace,
        { ...stub.workspace, id: OTHER_WORKSPACE_ID },
      ];
    if (invalid === 'absent')
      stub.operator.workspaceRepository.find = async () => [];
    if (invalid === 'unprovisioned')
      stub.workspace.activationStatus = 'ONGOING_CREATION';
    if (invalid === 'schema missing') stub.workspace.databaseSchema = null;
    if (invalid === 'role missing') stub.workspace.defaultRoleId = null;
    if (invalid === 'custom application missing')
      stub.workspace.workspaceCustomApplicationId = null;
    if (invalid === 'deleted') stub.workspace.deletedAt = new Date();
    const options = {
      bundleDirectory: '/bundle',
      ...(invalid === 'wrong requested workspace'
        ? { workspaceId: OTHER_WORKSPACE_ID }
        : {}),
    };
    await assert.rejects(
      installLumberApplication(options, stub.dependencies),
      /workspace validation/,
    );
    assert.deepEqual(stub.calls, [['close']]);
  });
}

test('a destructive plan is rejected before uploading files or applying metadata', async () => {
  const stub = fixture();
  stub.operator.developmentService.syncApplication = async () => ({
    applicationUniversalIdentifier: LUMBER_APPLICATION_IDENTIFIER,
    actions: [{ type: 'delete', metadataName: 'fieldMetadata' }],
  });
  await assert.rejects(
    installLumberApplication({ bundleDirectory: '/bundle' }, stub.dependencies),
    /manifest plan validation/,
  );
  assert.deepEqual(
    stub.calls.map(([phase]) => phase),
    ['register', 'install', 'close'],
  );
});

test('storage errors never expose provider messages, credentials or causes', async () => {
  const stub = fixture();
  stub.operator.developmentService.uploadApplicationFile = async () => {
    throw new Error('https://account:storage-secret@example.com?token=private');
  };
  await assert.rejects(
    installLumberApplication({ bundleDirectory: '/bundle' }, stub.dependencies),
    (error) => {
      assert.match(error.message, /artifact upload/);
      assert.doesNotMatch(
        error.stack + JSON.stringify(error),
        /storage-secret|private|example\.com/,
      );
      assert.equal(error.cause, undefined);
      return true;
    },
  );
  assert.equal(stub.calls.at(-1)[0], 'close');
  assert.equal(
    stub.calls.some(([phase]) => phase === 'sync'),
    false,
  );
});

test('incomplete application verification does not report successful installation', async () => {
  const stub = fixture({
    applicationLookup: { findByUniversalIdentifier: async () => null },
  });
  await assert.rejects(
    installLumberApplication({ bundleDirectory: '/bundle' }, stub.dependencies),
    /installation verification/,
  );
  assert.equal(
    stub.calls.some(([phase]) => phase === 'security'),
    false,
  );
  assert.equal(stub.calls.at(-1)[0], 'close');
});

test('failed workspace security closure prevents successful installation and hides provider details', async () => {
  const stub = fixture({
    closeWorkspaceSecurity: async () => {
      throw new Error('private-provider-value');
    },
  });
  await assert.rejects(
    installLumberApplication({ bundleDirectory: '/bundle' }, stub.dependencies),
    (error) => {
      assert.match(error.message, /installation verification/);
      assert.doesNotMatch(
        error.stack + JSON.stringify(error),
        /private-provider/,
      );
      return true;
    },
  );
  assert.equal(stub.calls.at(-1)[0], 'close');
});

for (const version of ['2.59.0', undefined]) {
  test(`requires exact pinned production runtime version ${JSON.stringify(version)}`, async () => {
    const stub = fixture();
    stub.dependencies.environment.APP_VERSION = version;
    await assert.rejects(
      installLumberApplication(
        { bundleDirectory: '/bundle' },
        stub.dependencies,
      ),
      /runtime validation/,
    );
    assert.deepEqual(stub.calls, []);
  });
}

test('cancellation after an upload stops metadata application and closes the context', async () => {
  const stub = fixture();
  const controller = new AbortController();
  stub.dependencies.signal = controller.signal;
  stub.operator.developmentService.uploadApplicationFile = async () =>
    controller.abort();
  await assert.rejects(
    installLumberApplication({ bundleDirectory: '/bundle' }, stub.dependencies),
    /cancellation/,
  );
  assert.equal(
    stub.calls.some(([phase]) => phase === 'sync'),
    false,
  );
  assert.equal(stub.calls.at(-1)[0], 'close');
});

test('a child request for another bundle hash is rejected before creating an operator context', async () => {
  const stub = fixture();
  await assert.rejects(
    installLumberApplication(
      {
        bundleDirectory: '/bundle',
        expectedContentHash: 'b'.repeat(64),
      },
      stub.dependencies,
    ),
    /bundle validation/,
  );
  assert.deepEqual(stub.calls, []);
});
