'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { validateEnvironment } = require('../runtime/validate-environment.cjs');
const { validEnvironment } = require('./fixtures/valid-environment.cjs');

test('valid web environment uses the platform port, loopback calls and temporary scratch', () => {
  const input = {
    ...validEnvironment(),
    PORT: '4300',
    NODE_PORT: '9999',
    STORAGE_LOCAL_PATH: '/app/persistent',
  };
  const result = validateEnvironment(input, 'web');
  assert.equal(result.environment.NODE_PORT, '4300');
  assert.equal(result.environment.SERVER_INTERNAL_URL, 'http://127.0.0.1:4300');
  assert.equal(result.environment.TMPDIR, '/tmp');
  assert.equal(result.environment.LOGIC_FUNCTION_TYPE, 'LOCAL');
  assert.equal(result.environment.DISABLE_DB_MIGRATIONS, 'true');
  assert.equal(result.environment.DISABLE_CRON_JOBS_REGISTRATION, 'true');
  assert.equal(result.environment.STORAGE_TYPE, 'S_3');
  assert.equal(input.NODE_PORT, '9999');
});

test('worker preserves its private service binding', () => {
  const input = validEnvironment();
  assert.equal(
    validateEnvironment(input, 'worker').environment.SERVER_INTERNAL_URL,
    input.SERVER_INTERNAL_URL,
  );
});

for (const name of [
  'PG_DATABASE_URL',
  'REDIS_URL',
  'SERVER_URL',
  'ENCRYPTION_KEY',
  'STORAGE_TYPE',
  'STORAGE_S3_NAME',
  'STORAGE_S3_REGION',
  'STORAGE_S3_ACCESS_KEY_ID',
  'STORAGE_S3_SECRET_ACCESS_KEY',
]) {
  test(`missing ${name} fails before runtime startup`, () => {
    const input = validEnvironment();
    delete input[name];
    assert.throws(() => validateEnvironment(input, 'web'), {
      code: 'VERCEL_CONFIGURATION',
    });
  });
}

for (const [name, value] of [
  ['PG_DATABASE_URL', 'https://database.example.com'],
  ['REDIS_URL', 'https://redis-rest.example.com'],
  ['REDIS_QUEUE_URL', 'https://redis-rest.example.com'],
  ['SERVER_URL', 'http://lumber.example.com'],
  ['SERVER_URL', 'https://lumber.example.com/a-path'],
  ['SERVER_URL', 'https://lumber.example.com?secret=do-not-print'],
  ['SERVER_URL', 'https://user:password@lumber.example.com'],
  ['STORAGE_TYPE', 'LOCAL'],
  ['ENCRYPTION_KEY', 'short'],
  ['PORT', 'not-a-number'],
  ['PORT', '0'],
  ['PORT', '65536'],
  ['PORT', '3000.5'],
  ['STORAGE_S3_ENDPOINT', 'http://storage.example.com'],
]) {
  test(`invalid ${name} is rejected without exposing its value`, () => {
    const input = { ...validEnvironment(), [name]: value };
    assert.throws(
      () => validateEnvironment(input, 'web'),
      (error) => {
        assert.equal(error.code, 'VERCEL_CONFIGURATION');
        assert.equal(error.message.includes(value), false);
        return true;
      },
    );
  });
}

test('production deployment refuses unsupported preview and development environments', () => {
  for (const VERCEL_ENV of ['preview', 'development']) {
    assert.throws(
      () =>
        validateEnvironment({ ...validEnvironment(), VERCEL_ENV }, 'worker'),
      /requires production/,
    );
  }
});

test('an actual local test can use HTTP', () => {
  const input = {
    ...validEnvironment(),
    SERVER_URL: 'http://localhost:3000',
    STORAGE_S3_ENDPOINT: 'http://lumber-vercel-test-storage:9000',
  };
  delete input.VERCEL_ENV;
  assert.equal(
    validateEnvironment(input, 'web').scope.serverUrl,
    'http://localhost:3000',
  );
  assert.equal(
    validateEnvironment(input, 'web').environment.STORAGE_S3_ENDPOINT,
    input.STORAGE_S3_ENDPOINT,
  );
});

test('production localhost HTTP does not pass as a local test', () => {
  assert.throws(
    () =>
      validateEnvironment(
        { ...validEnvironment(), SERVER_URL: 'http://localhost:3000' },
        'web',
      ),
    /HTTPS/,
  );
});

test('readiness scope contains release, origin and deployment identity', () => {
  const input = {
    ...validEnvironment(),
    SERVER_URL: 'https://lumber.example.com/',
  };
  assert.deepEqual(validateEnvironment(input, 'web').scope, {
    serverUrl: 'https://lumber.example.com',
    runtimeVersion: '2.58.0',
    deploymentId: 'dpl_test',
  });
});

test('Git SHA is a supported deployment-identity fallback', () => {
  const input = { ...validEnvironment(), VERCEL_GIT_COMMIT_SHA: 'test-commit' };
  delete input.VERCEL_DEPLOYMENT_ID;
  assert.equal(
    validateEnvironment(input, 'web').scope.deploymentId,
    'test-commit',
  );
});

test('missing identity cannot borrow readiness from another release', () => {
  const input = validEnvironment();
  delete input.VERCEL_DEPLOYMENT_ID;
  assert.throws(
    () => validateEnvironment(input, 'web'),
    /VERCEL_DEPLOYMENT_ID/,
  );
});

test('worker requires the private service binding', () => {
  const input = validEnvironment();
  delete input.SERVER_INTERNAL_URL;
  assert.throws(
    () => validateEnvironment(input, 'worker'),
    /SERVER_INTERNAL_URL/,
  );
});

test('an unknown role cannot select default privileges', () => {
  assert.throws(
    () => validateEnvironment(validEnvironment(), 'unknown'),
    /web or worker/,
  );
});
