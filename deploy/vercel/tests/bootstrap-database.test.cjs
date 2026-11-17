'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { bootstrapDatabase } = require('../runtime/bootstrap-database.cjs');
const { databaseStub } = require('./fixtures/database-stub.cjs');

const scope = {
  serverUrl: 'https://lumber.example.com',
  runtimeVersion: '2.58.0',
  deploymentId: 'dpl_test',
};

test('empty database initializes, upgrades and registers jobs before marking readiness', async () => {
  const stub = databaseStub();
  const commands = [];
  await bootstrapDatabase(stub.client, scope, {
    runCommand: async (command, args) => {
      assert.equal(
        stub.queries.some(({ sql }) => sql.startsWith('INSERT INTO')),
        false,
      );
      commands.push([command, args]);
    },
  });
  assert.deepEqual(commands, [
    ['node', ['dist/database/scripts/setup-db.js']],
    [
      'node',
      [
        'dist/command/command',
        'run-instance-commands',
        '--force',
        '--include-slow',
      ],
    ],
    ['node', ['dist/command/command', 'cache:flush']],
    ['node', ['dist/command/command', 'upgrade']],
    ['node', ['dist/command/command', 'cache:flush']],
    ['node', ['dist/command/command', 'cron:register:all']],
  ]);
  assert.deepEqual(
    stub.queries.find(({ sql }) => sql.startsWith('INSERT INTO')).values,
    Object.values(scope),
  );
  assert.ok(stub.queries.at(-1).sql.includes('pg_advisory_unlock'));
  assert.equal(stub.ends(), 1);
});

test('existing schema skips initialization while still checking upgrades and cron jobs', async () => {
  const stub = databaseStub({ initialized: true });
  const commands = [];
  await bootstrapDatabase(stub.client, scope, {
    runCommand: async (_command, args) => commands.push(args),
  });
  assert.equal(commands.length, 4);
  assert.equal(
    commands.some((args) => args.includes('run-instance-commands')),
    false,
  );
  assert.deepEqual(commands.at(-1), [
    'dist/command/command',
    'cron:register:all',
  ]);
});

test('managed UUID compatibility runs under the lock without replacing existing functions', async () => {
  const stub = databaseStub({ initialized: true });
  await bootstrapDatabase(stub.client, scope, { runCommand: async () => {} });
  const compatibilityIndex = stub.queries.findIndex(({ sql }) =>
    sql.startsWith('DO $compatibility$'),
  );
  assert.ok(
    compatibilityIndex >
      stub.queries.findIndex(({ sql }) => sql.includes('pg_try_advisory_lock')),
  );
  assert.match(
    stub.queries[compatibilityIndex].sql,
    /IF to_regprocedure\('public.uuid_generate_v4\(\)'\) IS NULL/,
  );
  assert.equal(
    stub.queries[compatibilityIndex].sql.includes('OR REPLACE'),
    false,
  );
  const verificationIndex = stub.queries.findIndex(({ sql }) =>
    sql.startsWith('SELECT public.uuid_generate_v4()'),
  );
  assert.ok(
    verificationIndex <
      stub.queries.findIndex(({ sql }) => sql.startsWith('INSERT INTO')),
  );
  assert.deepEqual(stub.queries[verificationIndex].values, ['café']);
});

test('database compatibility failure blocks readiness and releases the bootstrap lock', async () => {
  const stub = databaseStub({
    initialized: true,
    failOnQuery: (sql) => sql.startsWith('DO $compatibility$'),
  });
  await assert.rejects(
    bootstrapDatabase(stub.client, scope, {
      runCommand: async () => assert.fail('must not migrate'),
    }),
    /database-test-failure/,
  );
  assert.equal(
    stub.queries.some(({ sql }) => sql.startsWith('INSERT INTO')),
    false,
  );
  assert.ok(stub.queries.at(-1).sql.includes('pg_advisory_unlock'));
  assert.equal(stub.ends(), 1);
});

for (const partial of [
  { workspaceTableExists: false },
  { workspaceTableExists: true, hasWorkspaces: false },
]) {
  test(`partial initial setup can recover when ${partial.workspaceTableExists ? 'no workspace has been created' : 'the workspace table is missing'}`, async () => {
    const stub = databaseStub({ initialized: true, ...partial });
    const commands = [];
    await bootstrapDatabase(stub.client, scope, {
      runCommand: async (_command, args) => commands.push(args),
    });
    assert.deepEqual(commands[0], ['dist/database/scripts/setup-db.js']);
    assert.deepEqual(commands[1], [
      'dist/command/command',
      'run-instance-commands',
      '--force',
      '--include-slow',
    ]);
    assert.ok(stub.queries.some(({ sql }) => sql.startsWith('INSERT INTO')));
  });
}

test('failed migration never marks readiness and always releases the lock', async () => {
  const stub = databaseStub();
  const failure = new Error('migration failed');
  let commands = 0;
  await assert.rejects(
    bootstrapDatabase(stub.client, scope, {
      runCommand: async () => {
        if (++commands === 2) throw failure;
      },
    }),
    (error) => error === failure,
  );
  assert.equal(commands, 2);
  assert.equal(
    stub.queries.some(({ sql }) => sql.startsWith('INSERT INTO')),
    false,
  );
  assert.ok(stub.queries.at(-1).sql.includes('pg_advisory_unlock'));
  assert.equal(stub.ends(), 1);
});

test('cron registration failure is a bootstrap failure rather than a successful startup', async () => {
  const stub = databaseStub({ initialized: true });
  await assert.rejects(
    bootstrapDatabase(stub.client, scope, {
      runCommand: async (_command, args) => {
        if (args.includes('cron:register:all')) throw new Error('cron failed');
      },
    }),
    /cron failed/,
  );
  assert.equal(
    stub.queries.some(({ sql }) => sql.startsWith('INSERT INTO')),
    false,
  );
});

test('another bootstrap must release the advisory lock before schema work begins', async () => {
  const stub = databaseStub({ lockResults: [false, true], initialized: true });
  let sleeps = 0;
  await bootstrapDatabase(stub.client, scope, {
    runCommand: async () => {},
    sleep: async () => {
      sleeps++;
      assert.equal(
        stub.queries.some(({ sql }) => sql.startsWith('CREATE')),
        false,
      );
    },
  });
  assert.equal(sleeps, 1);
  assert.equal(
    stub.queries.filter(({ sql }) => sql.includes('pg_try_advisory_lock'))
      .length,
    2,
  );
});

test('a busy bootstrap lock times out without performing migrations or unlocking another session', async () => {
  const stub = databaseStub({ lockResults: [false] });
  let clock = 0;
  await assert.rejects(
    bootstrapDatabase(stub.client, scope, {
      runCommand: async () => assert.fail('must not migrate'),
      lockTimeoutMs: 1000,
      now: () => clock,
      sleep: async () => {
        clock += 1000;
      },
    }),
    /bootstrap lock/,
  );
  assert.equal(
    stub.queries.some(({ sql }) => sql.includes('pg_advisory_unlock')),
    false,
  );
  assert.equal(stub.ends(), 1);
});

test('abort during lock wait closes the database without running migrations', async () => {
  const stub = databaseStub({ lockResults: [false] });
  const controller = new AbortController();
  await assert.rejects(
    bootstrapDatabase(stub.client, scope, {
      signal: controller.signal,
      runCommand: async () => assert.fail('must not migrate'),
      sleep: async () => controller.abort(new Error('stopping')),
    }),
    /stopping/,
  );
  assert.equal(stub.ends(), 1);
});

test('bootstrap preserves its original failure if lock cleanup also fails', async () => {
  const stub = databaseStub({
    failOnQuery: (sql) => sql.includes('pg_advisory_unlock'),
  });
  await assert.rejects(
    bootstrapDatabase(stub.client, scope, {
      runCommand: async () => {
        throw new Error('original migration failure');
      },
    }),
    /original migration failure/,
  );
  assert.equal(stub.ends(), 1);
});

test('failed database connection is cleaned up', async () => {
  const stub = databaseStub({ connectFailure: new Error('connection failed') });
  await assert.rejects(
    bootstrapDatabase(stub.client, scope, { runCommand: async () => {} }),
    /connection failed/,
  );
  assert.equal(stub.ends(), 1);
});
