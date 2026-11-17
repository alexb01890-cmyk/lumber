'use strict';

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
  const url = (name, protocols) => {
    let parsed;
    try {
      parsed = new URL(required(name));
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
  url('REDIS_URL', ['redis:', 'rediss:']);
  if (input.REDIS_QUEUE_URL) url('REDIS_QUEUE_URL', ['redis:', 'rediss:']);
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
  const deploymentId =
    input.VERCEL_DEPLOYMENT_ID || input.VERCEL_GIT_COMMIT_SHA;
  if (typeof deploymentId !== 'string' || !deploymentId.trim()) {
    fail(
      'Expose VERCEL_DEPLOYMENT_ID or VERCEL_GIT_COMMIT_SHA to both runtimes.',
    );
  }
  const port = input.PORT === undefined ? 3000 : Number(input.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    fail('PORT must be an integer from 1 to 65535.');
  const environment = {
    ...input,
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
  if (role === 'web')
    environment.SERVER_INTERNAL_URL = `http://127.0.0.1:${port}`;
  return {
    environment,
    scope: {
      serverUrl: publicUrl.origin,
      runtimeVersion: '2.58.0',
      deploymentId: deploymentId.trim(),
    },
  };
};

module.exports = { validateEnvironment };
