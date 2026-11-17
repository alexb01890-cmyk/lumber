'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  simplifyLumberNavigation,
  WORKSPACE_TOOLS_IDENTIFIER,
} = require('../runtime/lumber-navigation.cjs');

const WORKSPACE_ID = 'f61dac22-2189-4c49-bda3-53cc358645c7';
const APPLICATION_ID = '5d3588b7-75f8-4e6c-b22b-05c31b59a0f2';
const fixture = () => {
  const item = (universalIdentifier, values = {}) => ({
    id: universalIdentifier,
    universalIdentifier,
    workspaceId: WORKSPACE_ID,
    type: 'OBJECT',
    userWorkspaceId: null,
    folderId: null,
    position: 0,
    ...values,
  });
  const state = {
    items: [
      item(WORKSPACE_TOOLS_IDENTIFIER, {
        type: 'FOLDER',
        applicationId: APPLICATION_ID,
      }),
      item('20202020-b001-4b01-8b01-c0aba11c0001', { name: 'Companies' }),
      item('20202020-b005-4b05-8b05-c0aba11c0005', { name: 'People' }),
      item('20202020-b004-4b04-8b04-c0aba11c0004', { name: 'Opportunities' }),
      item('20202020-b007-4b07-8b07-c0aba11c0007', {
        type: 'FOLDER',
        name: 'Workflows',
      }),
      item('20202020-b008-4b08-8b08-c0aba11c0008', {
        type: 'NATIVE_PAGE',
        folderId: '20202020-b007-4b07-8b07-c0aba11c0007',
      }),
      item('20202020-b00c-4b0c-8b0c-c0aba11c000c', {
        type: 'FOLDER',
        name: 'Campaigns',
      }),
      item('personal-customer-pin', {
        userWorkspaceId: 'owner',
        name: 'My customer',
        targetRecordId: 'customer-record',
      }),
      item('custom-menu', { name: 'Owner tool', link: 'https://example.test' }),
    ],
    objects: [
      {
        id: 'company-metadata',
        workspaceId: WORKSPACE_ID,
        nameSingular: 'company',
        namePlural: 'companies',
        isStandard: true,
        labelSingular: 'Company',
        labelPlural: 'Companies',
        isLabelSyncedWithName: true,
      },
      {
        id: 'person-metadata',
        workspaceId: WORKSPACE_ID,
        nameSingular: 'person',
        namePlural: 'people',
        isStandard: true,
        labelSingular: 'Person',
        labelPlural: 'People',
        isLabelSyncedWithName: true,
      },
      {
        id: 'opportunity-metadata',
        workspaceId: WORKSPACE_ID,
        nameSingular: 'opportunity',
        namePlural: 'opportunities',
        isStandard: true,
        labelSingular: 'Opportunity',
        labelPlural: 'Opportunities',
        isLabelSyncedWithName: true,
      },
    ],
    objectUpdates: [],
    updates: [],
    deletions: [],
    context: null,
  };
  state.items[1].targetObjectMetadataId = 'company-metadata';
  state.items[2].targetObjectMetadataId = 'person-metadata';
  state.items[3].targetObjectMetadataId = 'opportunity-metadata';
  const dependencies = {
    navigationRepository: {
      find: async ({ where }) => {
        assert.deepEqual(where, { workspaceId: WORKSPACE_ID });
        return structuredClone(state.items);
      },
    },
    navigationService: {
      updateMany: async ({ inputs, workspaceId }) => {
        assert.equal(workspaceId, WORKSPACE_ID);
        assert.deepEqual(state.context, { workspaceId: WORKSPACE_ID });
        state.updates.push(...inputs);
        for (const input of inputs)
          Object.assign(
            state.items.find((entry) => entry.id === input.id),
            input.update,
          );
      },
      deleteMany: async ({ ids, workspaceId }) => {
        assert.equal(workspaceId, WORKSPACE_ID);
        assert.deepEqual(state.context, { workspaceId: WORKSPACE_ID });
        assert.ok(
          ids.every(
            (id) => !state.items.some((entry) => entry.folderId === id),
          ),
        );
        state.deletions.push(...ids);
        state.items = state.items.filter((entry) => !ids.includes(entry.id));
      },
    },
    readObjectMetadata: async (workspaceId) => {
      assert.equal(workspaceId, WORKSPACE_ID);
      return structuredClone(state.objects);
    },
    objectMetadataService: {
      updateManyObjects: async ({ updateObjectInputs, workspaceId }) => {
        assert.equal(workspaceId, WORKSPACE_ID);
        assert.deepEqual(state.context, { workspaceId: WORKSPACE_ID });
        state.objectUpdates.push(...updateObjectInputs);
        for (const input of updateObjectInputs) {
          assert.deepEqual(Object.keys(input.update).sort(), [
            'labelPlural',
            'labelSingular',
          ]);
          Object.assign(
            state.objects.find((entry) => entry.id === input.id),
            input.update,
          );
        }
      },
    },
    buildSystemAuthContext: (workspaceId) => ({ workspaceId }),
    withWorkspaceAuthContext: async (context, run) => {
      state.context = context;
      try {
        return await run();
      } finally {
        state.context = null;
      }
    },
  };
  const run = () =>
    simplifyLumberNavigation(
      { workspaceId: WORKSPACE_ID, applicationId: APPLICATION_ID },
      dependencies,
    );
  return { state, dependencies, run, item };
};

test('uses the existing directory, moves optional tools, and leaves personal pins and custom links untouched', async () => {
  const stub = fixture();
  const unrelated = structuredClone(stub.state.items.slice(-2));
  await stub.run();
  assert.equal(
    stub.state.items.find((entry) => entry.name === 'Customers & suppliers')
      .universalIdentifier,
    '20202020-b001-4b01-8b01-c0aba11c0001',
  );
  assert.equal(
    stub.state.items.find((entry) => entry.name === 'Contacts').folderId,
    null,
  );
  assert.equal(
    stub.state.items.find((entry) => entry.name === 'Legacy opportunities')
      .folderId,
    WORKSPACE_TOOLS_IDENTIFIER,
  );
  assert.equal(
    stub.state.items.find((entry) => entry.name === 'Automations').folderId,
    WORKSPACE_TOOLS_IDENTIFIER,
  );
  assert.deepEqual(stub.state.items.slice(-2), unrelated);
  assert.equal(stub.state.objects[0].labelPlural, 'Customers & suppliers');
  assert.equal(stub.state.objects[0].namePlural, 'companies');
  assert.equal(stub.state.objects[1].labelPlural, 'Contacts');
  assert.equal(stub.state.objects[1].nameSingular, 'person');
  assert.equal(stub.state.objects[2].labelPlural, 'Legacy opportunities');
  assert.equal(stub.state.deletions.length, 2);
  assert.equal(stub.state.objectUpdates.length, 3);
  const writes = stub.state.updates.length;
  await stub.run();
  assert.equal(stub.state.updates.length, writes);
  assert.equal(stub.state.deletions.length, 2);
  assert.equal(stub.state.objectUpdates.length, 3);
});

test('refuses to relabel a menu that unexpectedly targets a different object', async () => {
  const stub = fixture();
  stub.state.items[1].targetObjectMetadataId = 'person-metadata';
  await assert.rejects(stub.run(), /navigation setup/);
  assert.equal(stub.state.objectUpdates.length, 0);
  assert.equal(stub.state.updates.length, 0);
});

test('requires object label changes to persist before reporting the menu as ready', async () => {
  const stub = fixture();
  stub.dependencies.objectMetadataService.updateManyObjects = async () => {};
  await assert.rejects(stub.run(), /navigation setup/);
});

for (const userWorkspaceId of [null, 'owner']) {
  test(`preserves a default folder containing a ${userWorkspaceId ? 'personal' : 'custom'} item`, async () => {
    const stub = fixture();
    const folderId = '20202020-b007-4b07-8b07-c0aba11c0007';
    stub.state.items.push(
      stub.item('custom-folder-child', { folderId, userWorkspaceId }),
    );
    await stub.run();
    assert.ok(stub.state.items.some((entry) => entry.id === folderId));
    assert.ok(
      stub.state.items.some(
        (entry) =>
          entry.id === 'custom-folder-child' && entry.folderId === folderId,
      ),
    );
    assert.ok(!stub.state.deletions.includes(folderId));
  });
}

test('rejects a folder from another application before changing the navigation', async () => {
  const stub = fixture();
  stub.state.items[0].applicationId = 'another-application';
  await assert.rejects(stub.run(), /navigation setup/);
  assert.equal(stub.state.updates.length, 0);
  assert.equal(stub.state.deletions.length, 0);
});

test('rejects foreign workspace rows before making changes', async () => {
  const stub = fixture();
  stub.state.items[1].workspaceId = APPLICATION_ID;
  await assert.rejects(stub.run(), /navigation setup/);
  assert.equal(stub.state.updates.length, 0);
});

test('does not report success when native metadata changes were not persisted', async () => {
  const stub = fixture();
  stub.dependencies.navigationService.updateMany = async () => {};
  await assert.rejects(stub.run(), /navigation setup/);
});

test('does not expose provider messages in navigation failures', async () => {
  const stub = fixture();
  stub.dependencies.navigationRepository.find = async () => {
    throw new Error('private-provider-secret');
  };
  await assert.rejects(stub.run(), (error) => {
    assert.equal(error.phase, 'navigation setup');
    assert.doesNotMatch(error.stack, /private-provider-secret/);
    return true;
  });
});
