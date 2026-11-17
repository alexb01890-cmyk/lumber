'use strict';

const { spawn } = require('node:child_process');

const runProcess = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const {
      environment = process.env,
      signal,
      spawnProcess = spawn,
      label = command,
      shutdownTimeoutMs = 55000,
    } = options;
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const child = spawnProcess(command, args, {
      env: environment,
      stdio: 'inherit',
    });
    let shutdownTimer;
    let settled = false;
    let terminating = false;
    const cleanup = () => {
      clearTimeout(shutdownTimer);
      signal?.removeEventListener('abort', terminate);
    };
    const fail = (exitCode = 1) => {
      if (settled) return;
      settled = true;
      cleanup();
      const error = new Error(`The ${label} process failed.`);
      error.code = 'VERCEL_PROCESS';
      error.exitCode = exitCode;
      reject(error);
    };
    const terminate = () => {
      if (terminating || settled) return;
      terminating = true;
      child.kill(signal.reason === 'SIGINT' ? 'SIGINT' : 'SIGTERM');
      shutdownTimer = setTimeout(
        () => child.kill('SIGKILL'),
        shutdownTimeoutMs,
      );
      shutdownTimer.unref?.();
    };
    child.once('error', () => fail());
    child.once('exit', (code, exitSignal) => {
      if (code !== 0 || exitSignal) {
        fail(
          code ||
            (exitSignal === 'SIGINT'
              ? 130
              : exitSignal === 'SIGTERM'
                ? 143
                : 1),
        );
        return;
      }
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    });
    signal?.addEventListener('abort', terminate, { once: true });
    if (signal?.aborted) terminate();
  });

module.exports = { runProcess };
