'use strict';

const { createHash } = require('node:crypto');
const { getRuntimeRelease, RUNTIME_VERSION } = require('./runtime-release.cjs');

const validateEnvironment = (input, role) => {
  const fail = (message) => {
    const error = new Error(message);
    error.code = 'VERCEL_CONFIGURATION';
    throw error;
  };
  const required = (name) => {
    const value = input[name];
    if (typeof value !== 'string' || value.trim().length === 0) {
      fail(`Set the required environment variable ${name}.`);
    }
    return value.trim();
  };
  const url = (name, protocols, value = required(name)) => {
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      fail(`Set ${name} to a valid URL.`);
    }
    if (!protocols.includes(parsed.protocol) || !parsed.hostname) {
      fail(`Set ${name} to a supported connection URL.`);
    }
    return parsed;
  };
  if (role !== 'web' && role !== 'worker') {
    fail('Choose the web or worker runtime.');
  }
  if (input.VERCEL_ENV && input.VERCEL_ENV !== 'production') {
    fail(
      'This Twenty deployment requires production: Vercel preview daemons are unavailable.',
    );
  }
  url('PG_DATABASE_URL', ['postgres:', 'postgresql:']);
  const hasRedisOverride = input.LUMBER_REDIS_URL !== undefined;
  const redisVariable = hasRedisOverride ? 'LUMBER_REDIS_URL' : 'REDIS_URL';
  const redisUrl = hasRedisOverride
    ? required(redisVariable).replace(/^valkeys:/, 'rediss:')
    : required(redisVariable);
  const parsedRedis = url(
    redisVariable,
    hasRedisOverride ? ['rediss:'] : ['redis:', 'rediss:'],
    redisUrl,
  );
  const redisQueueUrl = hasRedisOverride ? redisUrl : input.REDIS_QUEUE_URL;
  const parsedQueue = redisQueueUrl
    ? url('REDIS_QUEUE_URL', ['redis:', 'rediss:'], redisQueueUrl)
    : parsedRedis;
  // A replacement queue needs cron registration even when the runtime source is unchanged.
  const deploymentId = createHash('sha256')
    .update(getRuntimeRelease())
    .update(
      JSON.stringify(
        [parsedRedis, parsedQueue].map((connection) => [
          connection.protocol,
          connection.hostname,
          connection.port || '6379',
          connection.pathname || '/0',
        ]),
      ),
    )
    .digest('hex');
  const publicUrl = url('SERVER_URL', ['http:', 'https:']);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(
    publicUrl.hostname,
  );
  if (publicUrl.protocol !== 'https:' && (!local || input.VERCEL_ENV)) {
    fail('SERVER_URL must use HTTPS; HTTP is allowed only for a local test.');
  }
  if (
    publicUrl.username ||
    publicUrl.password ||
    publicUrl.search ||
    publicUrl.hash ||
    publicUrl.pathname !== '/'
  ) {
    fail(
      'SERVER_URL must be an origin without credentials, a path, or query parameters.',
    );
  }
  if (required('ENCRYPTION_KEY').length < 32) {
    fail('ENCRYPTION_KEY must contain at least 32 characters.');
  }
  if (required('STORAGE_TYPE') !== 'S_3') {
    fail(
      'STORAGE_TYPE must be S_3: Vercel containers do not provide persistent disk.',
    );
  }
  for (const name of [
    'STORAGE_S3_NAME',
    'STORAGE_S3_REGION',
    'STORAGE_S3_ACCESS_KEY_ID',
    'STORAGE_S3_SECRET_ACCESS_KEY',
  ]) {
    required(name);
  }
  if (input.STORAGE_S3_ENDPOINT) {
    const endpoint = url('STORAGE_S3_ENDPOINT', ['https:', 'http:']);
    if (endpoint.protocol !== 'https:' && !(local && !input.VERCEL_ENV)) {
      fail('STORAGE_S3_ENDPOINT must use HTTPS outside a local test.');
    }
  }
  if (role === 'worker') url('SERVER_INTERNAL_URL', ['http:', 'https:']);
  const port = input.PORT === undefined ? 3000 : Number(input.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    fail('PORT must be an integer from 1 to 65535.');
  const environment = {
    ...input,
    REDIS_URL: redisUrl,
    ...(redisQueueUrl !== undefined && { REDIS_QUEUE_URL: redisQueueUrl }),
    SERVER_URL: publicUrl.origin,
    NODE_ENV: 'production',
    NODE_PORT: String(port),
    LOGIC_FUNCTION_TYPE: 'LOCAL',
    DISABLE_DB_MIGRATIONS: 'true',
    DISABLE_CRON_JOBS_REGISTRATION: 'true',
    ANALYTICS_ENABLED: 'false',
    IS_BILLING_ENABLED: 'false',
    TMPDIR: '/tmp',
    TMP: '/tmp',
    TEMP: '/tmp',
  };
  if (role === 'web') {
    environment.NODE_PORT = String(port === 3001 ? 3002 : 3001);
    environment.SERVER_INTERNAL_URL = `http://127.0.0.1:${environment.NODE_PORT}`;
  }
  return {
    environment,
    scope: {
      serverUrl: publicUrl.origin,
      runtimeVersion: RUNTIME_VERSION,
      deploymentId,
    },
  };
};

module.exports = { validateEnvironment };
