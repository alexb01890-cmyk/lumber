'use strict';

const { fork } = require('node:child_process');
const path = require('node:path');
const {
  LUMBER_APPLICATION_IDENTIFIER,
  INSTALLATION_PHASES,
  installationError,
} = require('./lumber-bundle.cjs');

const UUID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const isInstallerResult = (result, expected) =>
  Boolean(
    result &&
    typeof result === 'object' &&
    !Array.isArray(result) &&
    Object.keys(result).length === 4 &&
    [
      'workspaceId',
      'applicationId',
      'applicationUniversalIdentifier',
      'contentHash',
    ].every((key) => Object.hasOwn(result, key)) &&
    result.workspaceId === expected.workspaceId &&
    UUID_PATTERN.test(result.workspaceId) &&
    UUID_PATTERN.test(result.applicationId) &&
    result.applicationUniversalIdentifier === LUMBER_APPLICATION_IDENTIFIER &&
    result.contentHash === expected.contentHash &&
    /^[a-f0-9]{64}$/.test(result.contentHash),
  );

const runLumberInstaller = (
  input,
  {
    environment,
    signal,
    forkProcess = fork,
    timeoutMilliseconds = 600000,
    killGraceMilliseconds = 5000,
  } = {},
) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(installationError('cancellation'));
      return;
    }
    let child;
    try {
      child = forkProcess(
        path.join(__dirname, 'lumber-installer-child.cjs'),
        [],
        {
          env: environment,
          execArgv: [],
          serialization: 'json',
          stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
        },
      );
    } catch {
      reject(installationError('installer process'));
      return;
    }
    let response;
    let failure;
    let killTimer;
    let settled = false;
    const settle = (callback) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearTimeout(killTimer);
      signal?.removeEventListener('abort', abort);
      callback();
    };
    const stop = (phase) => {
      failure = installationError(phase);
      child.kill('SIGTERM');
      killTimer ??= setTimeout(
        () => child.kill('SIGKILL'),
        Math.min(killGraceMilliseconds, 55000),
      );
    };
    const abort = () => stop('cancellation');
    const timeout = setTimeout(
      () => stop('installer process'),
      timeoutMilliseconds,
    );
    signal?.addEventListener('abort', abort, { once: true });
    child.on('message', (message) => {
      if (
        message?.type === 'lumber-installation-success' &&
        isInstallerResult(message.result, input)
      ) {
        response = message.result;
      } else if (
        message?.type === 'lumber-installation-failure' &&
        INSTALLATION_PHASES.has(message.phase)
      ) {
        failure = installationError(message.phase);
      } else {
        stop('installer process');
      }
    });
    child.once('error', () => {
      stop('installer process');
    });
    const complete = (code) =>
      settle(() => {
        if (failure || code !== 0 || !response)
          reject(failure || installationError('installer process'));
        else resolve(response);
      });
    child.once('exit', complete);
    child.once('close', complete);
    try {
      if (signal?.aborted) abort();
      else child.send({ type: 'lumber-installation-request', ...input });
    } catch {
      stop('installer process');
    }
  });

module.exports = { isInstallerResult, runLumberInstaller };
