'use strict';

const { bootstrapDatabase } = require('./bootstrap-database.cjs');
const { createDatabaseClient } = require('./create-database-client.cjs');
const { runEntrypoint } = require('./run-entrypoint.cjs');
const { runProcess } = require('./run-process.cjs');
const { validateEnvironment } = require('./validate-environment.cjs');

const startWorker = async (
  input,
  {
    signal,
    createClient = createDatabaseClient,
    bootstrap = bootstrapDatabase,
    run = runProcess,
  } = {},
) => {
  const { environment, scope } = validateEnvironment(input, 'worker');
  const runCommand = (command, args) =>
    run(command, args, {
      environment,
      signal,
      label: `bootstrap ${args.join(' ')}`,
    });
  await bootstrap(createClient(environment), scope, { runCommand, signal });
  await run('node', ['dist/queue-worker/queue-worker'], {
    environment,
    signal,
    label: 'Twenty queue worker',
  });
};

module.exports = { startWorker };
if (require.main === module) void runEntrypoint(startWorker);
