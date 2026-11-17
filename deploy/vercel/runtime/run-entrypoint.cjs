'use strict';

const ERROR_CATEGORIES = new Map([
  ['MODULE_NOT_FOUND', 'a required runtime dependency is missing'],
  ['ERR_MODULE_NOT_FOUND', 'a required runtime dependency is missing'],
  ['28P01', 'PostgreSQL authentication failed'],
  ['28000', 'PostgreSQL authentication or host authorization failed'],
  ['42501', 'PostgreSQL permissions are insufficient'],
  ['3D000', 'the PostgreSQL database does not exist'],
  ['3F000', 'a PostgreSQL schema is unavailable'],
  ['42P01', 'a PostgreSQL table is unavailable'],
  ['53300', 'PostgreSQL connection capacity is exhausted'],
  ['57P03', 'PostgreSQL is not accepting connections'],
  ['08001', 'a PostgreSQL connection could not be established'],
  ['08006', 'a PostgreSQL connection failed'],
  ['DEPTH_ZERO_SELF_SIGNED_CERT', 'TLS certificate verification failed'],
  ['SELF_SIGNED_CERT_IN_CHAIN', 'TLS certificate verification failed'],
  ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'TLS certificate verification failed'],
  ['UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'TLS certificate verification failed'],
  ['CERT_HAS_EXPIRED', 'TLS certificate verification failed'],
  ['CERT_NOT_YET_VALID', 'TLS certificate verification failed'],
  ['ERR_TLS_CERT_ALTNAME_INVALID', 'TLS certificate verification failed'],
  ['ERR_SSL_WRONG_VERSION_NUMBER', 'TLS protocol negotiation failed'],
  ['ENOTFOUND', 'a dependency hostname could not be resolved'],
  ['EAI_AGAIN', 'DNS resolution is temporarily unavailable'],
  ['ETIMEDOUT', 'a connection timed out'],
  ['ECONNREFUSED', 'a connection was refused'],
  ['ECONNRESET', 'a connection was reset'],
  ['EHOSTUNREACH', 'a dependency host is unreachable'],
  ['ENETUNREACH', 'a dependency network is unreachable'],
  ['EACCES', 'filesystem access was denied'],
  ['EROFS', 'a write targeted a read-only filesystem'],
  ['ENOENT', 'a required filesystem path is missing'],
]);

const classifyError = (error) => {
  const pending = [error];
  const visited = new Set();
  while (pending.length > 0 && visited.size < 16) {
    const candidate = pending.shift();
    if (!candidate || typeof candidate !== 'object' || visited.has(candidate))
      continue;
    visited.add(candidate);
    if (
      typeof candidate.code === 'string' &&
      ERROR_CATEGORIES.has(candidate.code)
    ) {
      return `${candidate.code}: ${ERROR_CATEGORIES.get(candidate.code)}`;
    }
    if (candidate.cause) pending.push(candidate.cause);
    if (Array.isArray(candidate.errors))
      pending.push(...candidate.errors.slice(0, 16));
  }
  return null;
};

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
      const category = classifyError(error);
      const diagnostic = category ? ` [${category}]` : '';
      runtimeProcess.stderr.write(
        `${error?.code === 'VERCEL_CONFIGURATION' || error?.code === 'VERCEL_PROCESS' ? error.message : `Twenty startup failed${diagnostic}. Check the database, Redis, storage and worker bootstrap logs.`}\n`,
      );
      runtimeProcess.exitCode =
        Number.isInteger(error?.exitCode) &&
        error.exitCode > 0 &&
        error.exitCode <= 255
          ? error.exitCode
          : 1;
    }
  } finally {
    runtimeProcess.removeListener('SIGTERM', terminate);
    runtimeProcess.removeListener('SIGINT', interrupt);
  }
};

module.exports = { runEntrypoint };
