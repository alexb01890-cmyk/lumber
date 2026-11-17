'use strict';

const { createDatabaseClient } = require('./create-database-client.cjs');
const { runEntrypoint } = require('./run-entrypoint.cjs');
const { runProcess } = require('./run-process.cjs');
const { validateEnvironment } = require('./validate-environment.cjs');
const { waitForBootstrap } = require('./wait-for-bootstrap.cjs');

const startWeb = async (
  input,
  {
    signal,
    createClient = createDatabaseClient,
    wait = waitForBootstrap,
    run = runProcess,
  } = {},
) => {
  const { environment, scope } = validateEnvironment(input, 'web');
  await wait(createClient(environment), scope, { signal });
  await run('node', ['dist/main'], {
    environment,
    signal,
    label: 'Twenty web server',
  });
};

module.exports = { startWeb };
if (require.main === module) void runEntrypoint(startWeb);
