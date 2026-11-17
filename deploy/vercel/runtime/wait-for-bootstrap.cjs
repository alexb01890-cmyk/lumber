'use strict';

const { setTimeout: delay } = require('node:timers/promises');

const waitForBootstrap = async (
  client,
  scope,
  {
    signal,
    timeoutMs = 120000,
    pollMs = 1000,
    sleep = delay,
    now = Date.now,
  } = {},
) => {
  let failure;
  try {
    signal?.throwIfAborted();
    await client.connect();
    const deadline = now() + timeoutMs;
    while (now() <= deadline) {
      signal?.throwIfAborted();
      const table = await client.query(
        "SELECT to_regclass('vercel_runtime.bootstrap') AS bootstrap_table",
      );
      if (table.rows[0]?.bootstrap_table) {
        const result = await client.query(
          'SELECT 1 FROM vercel_runtime.bootstrap WHERE server_url = $1 AND runtime_version = $2 AND deployment_id = $3',
          [scope.serverUrl, scope.runtimeVersion, scope.deploymentId],
        );
        if (result.rows.length > 0) return;
      }
      await sleep(pollMs, undefined, { signal });
    }
    throw new Error(
      'Database bootstrap is not ready for this deployment. Check the worker bootstrap logs.',
    );
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    try {
      await client.end();
    } catch (error) {
      if (!failure) throw error;
    }
  }
};

module.exports = { waitForBootstrap };
