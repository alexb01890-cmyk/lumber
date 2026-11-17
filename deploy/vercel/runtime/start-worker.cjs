'use strict';

const { bootstrapDatabase } = require('./bootstrap-database.cjs');
const { createDatabaseClient } = require('./create-database-client.cjs');
const { runEntrypoint } = require('./run-entrypoint.cjs');
const { runProcess } = require('./run-process.cjs');
const { validateEnvironment } = require('./validate-environment.cjs');
const { watchLumberInstallation } = require('./watch-lumber-installation.cjs');

const startWorker = async (
  input,
  {
    signal,
    createClient = createDatabaseClient,
    bootstrap = bootstrapDatabase,
    run = runProcess,
    install = watchLumberInstallation,
  } = {},
) => {
  const { environment, scope } = validateEnvironment(input, 'worker');
  const runCommand = (command, args) =>
    run(command, args, {
      environment,
      signal,
      label: `bootstrap ${args.join(' ')}`,
    });
  console.info(
    `Twenty worker: bootstrapping runtime ${scope.deploymentId.slice(0, 12)}.`,
  );
  await bootstrap(createClient(environment), scope, { runCommand, signal });
  console.info('Twenty worker: database ready; starting queue worker.');
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal?.throwIfAborted();
  signal?.addEventListener('abort', abort, { once: true });
  let installation;
  try {
    const consuming = run('node', ['dist/queue-worker/queue-worker'], {
      environment,
      signal: controller.signal,
      label: 'Twenty queue worker',
    });
    installation = Promise.resolve()
      .then(() => install(environment, { signal: controller.signal }))
      .catch(() => {
        console.error(
          'Lumber application installation did not complete; check the installer logs.',
        );
      });
    await consuming;
  } finally {
    controller.abort();
    signal?.removeEventListener('abort', abort);
    await installation;
  }
};

module.exports = { startWorker };
if (require.main === module) void runEntrypoint(startWorker);
