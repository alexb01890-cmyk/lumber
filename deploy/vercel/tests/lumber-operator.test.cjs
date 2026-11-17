'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  closeLumberWorkspaceSecurity,
} = require('../runtime/lumber-operator.cjs');

const WORKSPACE_ID = 'f61dac22-2189-4c49-bda3-53cc358645c7';
const OTHER_WORKSPACE_ID = 'a8eb6877-07d8-419e-b21a-08ae4de5ee00';
const MEMBERSHIP_ID = '624bdd46-de98-41f3-94d1-2d69803c9f17';
const USER_ID = '8813b88e-f43e-41ab-83bb-f765f4d235be';

const fixture = () => {
  const workspace = {
    id: WORKSPACE_ID,
    activationStatus: 'CREATED',
    deletedAt: null,
    isPublicInviteLinkEnabled: true,
    isPasswordAuthEnabled: false,
    workspaceDiscoverability: 'PUBLIC',
  };
  const owner = {
    id: MEMBERSHIP_ID,
    workspaceId: WORKSPACE_ID,
    userId: USER_ID,
    deletedAt: null,
    user: { id: USER_ID, canAccessFullAdminPanel: true, deletedAt: null },
  };
  const state = {
    owners: [owner],
    domains: [],
    updates: [],
    reads: 0,
    context: null,
  };
  const dependencies = {
    workspaceRepository: {
      findOneBy: async (input) => {
        assert.deepEqual(input, { id: WORKSPACE_ID });
        state.reads++;
        return { ...workspace };
      },
    },
    userWorkspaceRepository: {
      find: async (input) => {
        assert.deepEqual(input.where, {
          workspaceId: WORKSPACE_ID,
          user: { canAccessFullAdminPanel: true },
        });
        assert.equal(input.take, 2);
        assert.equal(input.select.user.passwordHash, undefined);
        assert.equal(input.select.user.email, undefined);
        return state.owners;
      },
    },
    approvedAccessDomainService: {
      getApprovedAccessDomains: async (selected) => {
        assert.equal(selected.id, WORKSPACE_ID);
        return state.domains;
      },
    },
    buildSystemAuthContext: (id) => ({ type: 'system', workspace: { id } }),
    withWorkspaceAuthContext: async (context, run) => {
      state.context = context;
      try {
        return await run();
      } finally {
        state.context = null;
      }
    },
    workspaceService: {
      updateWorkspaceById: async (input) => {
        assert.deepEqual(state.context, {
          type: 'system',
          workspace: { id: WORKSPACE_ID },
        });
        state.updates.push(input);
        Object.assign(workspace, input.payload);
      },
    },
  };
  return { workspace, owner, state, dependencies };
};

test('closes general invitations using the real owner membership and reads back native private settings', async () => {
  const stub = fixture();
  await closeLumberWorkspaceSecurity(WORKSPACE_ID, stub.dependencies);
  assert.deepEqual(stub.state.updates, [
    {
      payload: {
        id: WORKSPACE_ID,
        isPublicInviteLinkEnabled: false,
        isPasswordAuthEnabled: true,
        workspaceDiscoverability: 'MEMBERS_AND_INVITEES',
      },
      userWorkspaceId: MEMBERSHIP_ID,
    },
  ]);
  assert.equal(stub.state.reads, 2);
  assert.equal(stub.state.context, null);
  await closeLumberWorkspaceSecurity(WORKSPACE_ID, stub.dependencies);
  assert.equal(stub.state.updates.length, 1);
});

for (const invalid of [
  'missing',
  'multiple',
  'foreign workspace',
  'foreign user',
  'not admin',
  'deleted membership',
  'deleted user',
]) {
  test(`refuses ${invalid} owner selection before changing workspace security`, async () => {
    const stub = fixture();
    if (invalid === 'missing') stub.state.owners = [];
    if (invalid === 'multiple')
      stub.state.owners.push({ ...stub.owner, id: USER_ID });
    if (invalid === 'foreign workspace')
      stub.owner.workspaceId = OTHER_WORKSPACE_ID;
    if (invalid === 'foreign user') stub.owner.user.id = MEMBERSHIP_ID;
    if (invalid === 'not admin')
      stub.owner.user.canAccessFullAdminPanel = false;
    if (invalid === 'deleted membership') stub.owner.deletedAt = new Date();
    if (invalid === 'deleted user') stub.owner.user.deletedAt = new Date();
    await assert.rejects(
      closeLumberWorkspaceSecurity(WORKSPACE_ID, stub.dependencies),
      /installation verification/,
    );
    assert.equal(stub.state.updates.length, 0);
  });
}

test('leaves an unexpected approved domain untouched and refuses to report privacy closure', async () => {
  const stub = fixture();
  stub.state.domains.push({ id: USER_ID, domain: 'example.test' });
  await assert.rejects(
    closeLumberWorkspaceSecurity(WORKSPACE_ID, stub.dependencies),
    /installation verification/,
  );
  assert.equal(stub.state.updates.length, 0);
  assert.equal(stub.state.domains.length, 1);
});

test('rejects a native update that did not actually close public access', async () => {
  const stub = fixture();
  stub.dependencies.workspaceService.updateWorkspaceById = async (input) =>
    stub.state.updates.push(input);
  await assert.rejects(
    closeLumberWorkspaceSecurity(WORKSPACE_ID, stub.dependencies),
    /installation verification/,
  );
  assert.equal(stub.state.reads, 2);
});

test('detects an approved access domain added while settings were updated', async () => {
  const stub = fixture();
  const update = stub.dependencies.workspaceService.updateWorkspaceById;
  stub.dependencies.workspaceService.updateWorkspaceById = async (input) => {
    await update(input);
    stub.state.domains.push({ id: USER_ID });
  };
  await assert.rejects(
    closeLumberWorkspaceSecurity(WORKSPACE_ID, stub.dependencies),
    /installation verification/,
  );
});

test('does not expose native provider messages or credentials on failure', async () => {
  const stub = fixture();
  stub.dependencies.workspaceService.updateWorkspaceById = async () => {
    throw new Error('secret-provider-password');
  };
  await assert.rejects(
    closeLumberWorkspaceSecurity(WORKSPACE_ID, stub.dependencies),
    (error) => {
      assert.equal(error.phase, 'installation verification');
      assert.doesNotMatch(
        error.stack + JSON.stringify(error),
        /secret-provider-password/,
      );
      return true;
    },
  );
});
