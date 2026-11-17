'use strict';

const { createDatabaseClient } = require('./create-database-client.cjs');
const { createRuntimeServer } = require('./create-runtime-server.cjs');
const { runEntrypoint } = require('./run-entrypoint.cjs');
const { runProcess } = require('./run-process.cjs');
const { validateEnvironment } = require('./validate-environment.cjs');
const { waitForBootstrap } = require('./wait-for-bootstrap.cjs');
const { waitForHttp } = require('./wait-for-http.cjs');

const startWeb = async (
  input,
  {
    signal,
    createClient = createDatabaseClient,
    createServer = createRuntimeServer,
    wait = waitForBootstrap,
    waitHttp = waitForHttp,
    run = runProcess,
  } = {},
) => {
  const { environment, scope } = validateEnvironment(input, 'web');
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal?.throwIfAborted();
  signal?.addEventListener('abort', abort, { once: true });
  let server;
  let child;
  try {
    server = await createServer({
      port: Number(environment.PORT || 3000),
      backendPort: Number(environment.NODE_PORT),
      signal: controller.signal,
    });
    console.info(
      `Twenty web: waiting for runtime ${scope.deploymentId.slice(0, 12)}.`,
    );
    await wait(createClient(environment), scope, { signal: controller.signal });
    console.info('Twenty web: database ready; starting HTTP server.');
    child = run('node', ['dist/main'], {
      environment,
      signal: controller.signal,
      label: 'Twenty web server',
    });
    const stopped = child.then(() => {
      const error = new Error(
        'The Twenty HTTP server stopped before becoming ready.',
      );
      error.code = 'VERCEL_PROCESS';
      throw error;
    });
    await Promise.race([
      waitHttp(Number(environment.NODE_PORT), { signal: controller.signal }),
      stopped,
    ]);
    server.markReady();
    console.info('Twenty web: HTTP server ready.');
    await child;
  } finally {
    controller.abort();
    signal?.removeEventListener('abort', abort);
    await server?.close();
    await child?.catch(() => {});
  }
};

module.exports = { startWeb };
if (require.main === module) void runEntrypoint(startWeb);
