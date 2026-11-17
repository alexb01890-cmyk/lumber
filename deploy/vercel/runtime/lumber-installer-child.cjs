'use strict';

const {
  installLumberApplication,
} = require('./install-lumber-application.cjs');
const { INSTALLATION_PHASES } = require('./lumber-bundle.cjs');
const { isInstallerResult } = require('./run-lumber-installer.cjs');

const runInstallerChild = async (
  message,
  { runtimeProcess = process, install = installLumberApplication, signal } = {},
) => {
  let response;
  try {
    if (
      message?.type !== 'lumber-installation-request' ||
      typeof message.bundleDirectory !== 'string' ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        message.workspaceId,
      ) ||
      !/^[a-f0-9]{64}$/.test(message.contentHash) ||
      (message.preserveWorkspaceSecurity !== undefined &&
        typeof message.preserveWorkspaceSecurity !== 'boolean')
    )
      throw new Error();
    const result = await install(
      {
        bundleDirectory: message.bundleDirectory,
        workspaceId: message.workspaceId,
        expectedContentHash: message.contentHash,
        ...(message.preserveWorkspaceSecurity !== undefined && {
          preserveWorkspaceSecurity: message.preserveWorkspaceSecurity,
        }),
      },
      { signal },
    );
    if (!isInstallerResult(result, message)) throw new Error();
    response = { type: 'lumber-installation-success', result };
    runtimeProcess.exitCode = 0;
  } catch (error) {
    response = {
      type: 'lumber-installation-failure',
      phase:
        error?.code === 'LUMBER_INSTALLATION' &&
        INSTALLATION_PHASES.has(error.phase)
          ? error.phase
          : 'installer process',
    };
    runtimeProcess.exitCode = 1;
  }
  if (runtimeProcess.connected) {
    await new Promise((resolve) =>
      runtimeProcess.send(response, () => resolve()),
    );
    runtimeProcess.disconnect();
  }
};

module.exports = { runInstallerChild };

if (require.main === module) {
  const controller = new AbortController();
  process.once('SIGTERM', () => controller.abort());
  process.once('SIGINT', () => controller.abort());
  process.once('message', (message) => {
    void runInstallerChild(message, { signal: controller.signal });
  });
}
