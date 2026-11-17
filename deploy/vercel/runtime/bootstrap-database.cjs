'use strict';

const { setTimeout: delay } = require('node:timers/promises');

// Image upgrades must share the same lock as older deployments.
const BOOTSTRAP_LOCK_KEY = [83133, 25800];

const bootstrapDatabase = async (
  client,
  scope,
  {
    runCommand,
    signal,
    lockTimeoutMs = 240000,
    sleep = delay,
    now = Date.now,
  } = {},
) => {
  let locked = false;
  let failure;
  try {
    signal?.throwIfAborted();
    await client.connect();
    const deadline = now() + lockTimeoutMs;
    while (!locked) {
      signal?.throwIfAborted();
      const result = await client.query(
        'SELECT pg_try_advisory_lock($1, $2) AS locked',
        BOOTSTRAP_LOCK_KEY,
      );
      locked = result.rows[0]?.locked === true;
      if (locked) break;
      if (now() >= deadline)
        throw new Error('Timed out waiting for the database bootstrap lock.');
      await sleep(1000, undefined, { signal });
    }
    await client.query('CREATE SCHEMA IF NOT EXISTS vercel_runtime');
    await client.query(`CREATE TABLE IF NOT EXISTS vercel_runtime.bootstrap (
      server_url text NOT NULL,
      runtime_version text NOT NULL,
      deployment_id text NOT NULL,
      ready_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (server_url, runtime_version, deployment_id)
    )`);
    const identity = [
      scope.serverUrl,
      scope.runtimeVersion,
      scope.deploymentId,
    ];
    await client.query(
      'DELETE FROM vercel_runtime.bootstrap WHERE server_url = $1 AND runtime_version = $2 AND deployment_id = $3',
      identity,
    );
    const result = await client.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'core') AS initialized",
    );
    let needsInitialization = !result.rows[0]?.initialized;
    if (!needsInitialization) {
      const workspaceTable = await client.query(
        "SELECT to_regclass('core.workspace') AS workspace_table",
      );
      if (!workspaceTable.rows[0]?.workspace_table) {
        needsInitialization = true;
      } else {
        const workspaces = await client.query(
          'SELECT EXISTS (SELECT 1 FROM core.workspace) AS has_workspaces',
        );
        needsInitialization = !workspaces.rows[0]?.has_workspaces;
      }
    }
    const commands = [
      ...(needsInitialization
        ? [
            ['dist/database/scripts/setup-db.js'],
            [
              'dist/command/command',
              'run-instance-commands',
              '--force',
              '--include-slow',
            ],
          ]
        : []),
      ['dist/command/command', 'cache:flush'],
      ['dist/command/command', 'upgrade'],
      ['dist/command/command', 'cache:flush'],
      ['dist/command/command', 'cron:register:all'],
    ];
    for (const args of commands) {
      signal?.throwIfAborted();
      await runCommand('node', args);
    }
    signal?.throwIfAborted();
    await client.query(
      'INSERT INTO vercel_runtime.bootstrap (server_url, runtime_version, deployment_id) VALUES ($1, $2, $3) ON CONFLICT (server_url, runtime_version, deployment_id) DO UPDATE SET ready_at = now()',
      identity,
    );
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    let cleanupFailure;
    try {
      if (locked)
        await client.query('SELECT pg_advisory_unlock($1, $2)', BOOTSTRAP_LOCK_KEY);
    } catch (error) {
      cleanupFailure = error;
    } finally {
      try {
        await client.end();
      } catch (error) {
        cleanupFailure ||= error;
      }
    }
    if (!failure && cleanupFailure) throw cleanupFailure;
  }
};

module.exports = { bootstrapDatabase };
