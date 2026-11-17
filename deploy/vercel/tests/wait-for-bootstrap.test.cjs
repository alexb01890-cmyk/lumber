'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { waitForBootstrap } = require('../runtime/wait-for-bootstrap.cjs');
const { databaseStub } = require('./fixtures/database-stub.cjs');

const scope = {
  serverUrl: 'https://lumber.example.com',
  runtimeVersion: '2.58.0',
  deploymentId: 'dpl_test',
};

test('web waits for readiness of its exact origin, release and deployment', async () => {
  const stub = databaseStub({ readyResults: [false, true] });
  let sleeps = 0;
  await waitForBootstrap(stub.client, scope, {
    sleep: async () => {
      sleeps++;
    },
  });
  assert.equal(sleeps, 1);
  for (const query of stub.queries.filter(({ sql }) =>
    sql.startsWith('SELECT 1'),
  )) {
    assert.deepEqual(query.values, Object.values(scope));
  }
  assert.equal(
    stub.queries.some(({ sql }) => /CREATE|INSERT|UPDATE|DELETE/.test(sql)),
    false,
  );
  assert.equal(stub.ends(), 1);
});

test('missing bootstrap schema times out without creating tables', async () => {
  const stub = databaseStub({ tableExists: false });
  let clock = 0;
  await assert.rejects(
    waitForBootstrap(stub.client, scope, {
      timeoutMs: 1000,
      now: () => clock,
      sleep: async () => {
        clock += 1000;
      },
    }),
    /not ready for this deployment/,
  );
  assert.equal(
    stub.queries.every(({ sql }) => sql.startsWith('SELECT to_regclass')),
    true,
  );
  assert.equal(stub.ends(), 1);
});

test('an old deployment marker cannot satisfy the current deployment', async () => {
  const stub = databaseStub({ readyResults: [false] });
  let clock = 0;
  await assert.rejects(
    waitForBootstrap(
      stub.client,
      { ...scope, deploymentId: 'dpl_new' },
      {
        timeoutMs: 1000,
        now: () => clock,
        sleep: async () => {
          clock += 1000;
        },
      },
    ),
    /not ready/,
  );
  assert.equal(
    stub.queries.find(({ sql }) => sql.startsWith('SELECT 1')).values[2],
    'dpl_new',
  );
});

test('aborted readiness checks close their connection', async () => {
  const stub = databaseStub({ readyResults: [false] });
  const controller = new AbortController();
  await assert.rejects(
    waitForBootstrap(stub.client, scope, {
      signal: controller.signal,
      sleep: async () => controller.abort(new Error('stopping')),
    }),
    /stopping/,
  );
  assert.equal(stub.ends(), 1);
});

test('readiness database errors do not get hidden by cleanup failures', async () => {
  const stub = databaseStub({
    failOnQuery: () => true,
    endFailure: new Error('end failed'),
  });
  await assert.rejects(
    waitForBootstrap(stub.client, scope),
    /database-test-failure/,
  );
  assert.equal(stub.ends(), 1);
});
