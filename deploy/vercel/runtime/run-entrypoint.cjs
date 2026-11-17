'use strict';

const runEntrypoint = async (
  start,
  { runtimeProcess = process, environment = process.env } = {},
) => {
  const controller = new AbortController();
  const terminate = () => controller.abort('SIGTERM');
  const interrupt = () => controller.abort('SIGINT');
  runtimeProcess.once('SIGTERM', terminate);
  runtimeProcess.once('SIGINT', interrupt);
  try {
    await start(environment, { signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      runtimeProcess.exitCode =
        controller.signal.reason === 'SIGINT' ? 130 : 143;
    } else {
      runtimeProcess.stderr.write(
        `${error?.code === 'VERCEL_CONFIGURATION' || error?.code === 'VERCEL_PROCESS' ? error.message : 'Twenty startup failed. Check the database, Redis, storage and worker bootstrap logs.'}\n`,
      );
      runtimeProcess.exitCode = error?.exitCode || 1;
    }
  } finally {
    runtimeProcess.removeListener('SIGTERM', terminate);
    runtimeProcess.removeListener('SIGINT', interrupt);
  }
};

module.exports = { runEntrypoint };
