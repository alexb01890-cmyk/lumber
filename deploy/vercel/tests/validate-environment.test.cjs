'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { validateEnvironment } = require('../runtime/validate-environment.cjs');
const { validEnvironment } = require('./fixtures/valid-environment.cjs');

test('valid web environment separates the platform listener from the private API and temporary scratch', () => {
  const input = {
    ...validEnvironment(),
    PORT: '4300',
    NODE_PORT: '9999',
    STORAGE_LOCAL_PATH: '/app/persistent',
  };
  const result = validateEnvironment(input, 'web');
  assert.equal(result.environment.NODE_PORT, '3001');
  assert.equal(result.environment.PORT, '4300');
  assert.equal(result.environment.SERVER_INTERNAL_URL, 'http://127.0.0.1:3001');
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

for (const role of ['web', 'worker']) {
  for (const protocol of ['rediss', 'valkeys']) {
    test(`${role} selects one encrypted ${protocol} replacement for cache and queues`, () => {
      const input = {
        ...validEnvironment(),
        REDIS_QUEUE_URL: 'rediss://old-queue.example.test:6379',
        LUMBER_REDIS_URL: `${protocol}://default:encoded%40password@new-cache.example.test:23790/0`,
      };
      const original = { ...input };
      const { environment } = validateEnvironment(input, role);
      assert.equal(
        environment.REDIS_URL,
        'rediss://default:encoded%40password@new-cache.example.test:23790/0',
      );
      assert.equal(environment.REDIS_QUEUE_URL, environment.REDIS_URL);
      assert.deepEqual(input, original);
    });
  }
}

test('a replacement works without credentials for the old provider', () => {
  const input = {
    ...validEnvironment(),
    LUMBER_REDIS_URL: 'valkeys://default:password@new-cache.example.test:23790',
  };
  delete input.REDIS_URL;
  assert.equal(
    validateEnvironment(input, 'worker').environment.REDIS_QUEUE_URL,
    'rediss://default:password@new-cache.example.test:23790',
  );
});

test('without an override, an explicitly separate queue database is preserved', () => {
  const input = {
    ...validEnvironment(),
    REDIS_QUEUE_URL: 'rediss://separate-queue.example.test:6379',
  };
  const { environment } = validateEnvironment(input, 'worker');
  assert.equal(environment.REDIS_URL, input.REDIS_URL);
  assert.equal(environment.REDIS_QUEUE_URL, input.REDIS_QUEUE_URL);
});

for (const value of [
  '',
  'redis://user:private-credential@provider.example.test:6379',
  'valkey://user:private-credential@provider.example.test:6379',
  'https://user:private-credential@provider.example.test',
]) {
  test(`rejects an invalid or unencrypted override without falling back: ${value.split(':')[0]}`, () => {
    assert.throws(
      () =>
        validateEnvironment(
          { ...validEnvironment(), LUMBER_REDIS_URL: value },
          'web',
        ),
      (error) => {
        assert.equal(error.code, 'VERCEL_CONFIGURATION');
        assert.doesNotMatch(
          error.stack,
          /private-credential|provider\.example\.test/,
        );
        return true;
      },
    );
  });
}

test('moving Redis or its queue invalidates bootstrap readiness, while rotating a password preserves it', () => {
  const input = {
    ...validEnvironment(),
    LUMBER_REDIS_URL:
      'rediss://default:first-password@provider.example.test:23790/0',
  };
  const identity = validateEnvironment(input, 'worker').scope.deploymentId;
  assert.equal(
    validateEnvironment(
      {
        ...input,
        LUMBER_REDIS_URL: input.LUMBER_REDIS_URL.replace(
          'first-password',
          'rotated-password',
        ),
      },
      'web',
    ).scope.deploymentId,
    identity,
  );
  assert.notEqual(
    validateEnvironment(
      {
        ...input,
        LUMBER_REDIS_URL: input.LUMBER_REDIS_URL.replace(
          'provider.example.test',
          'replacement.example.test',
        ),
      },
      'worker',
    ).scope.deploymentId,
    identity,
  );
  assert.notEqual(
    validateEnvironment(
      {
        ...input,
        LUMBER_REDIS_URL: input.LUMBER_REDIS_URL.replace('/0', '/1'),
      },
      'worker',
    ).scope.deploymentId,
    identity,
  );
  const separate = {
    ...validEnvironment(),
    REDIS_QUEUE_URL: 'rediss://queue.example.test:6379/0',
  };
  assert.notEqual(
    validateEnvironment(separate, 'worker').scope.deploymentId,
    validateEnvironment(
      {
        ...separate,
        REDIS_QUEUE_URL: 'rediss://new-queue.example.test:6379/0',
      },
      'worker',
    ).scope.deploymentId,
  );
  assert.match(identity, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(identity, /provider|password/);
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

test('readiness scope contains the runtime release and public origin', () => {
  const input = {
    ...validEnvironment(),
    SERVER_URL: 'https://lumber.example.com/',
  };
  assert.deepEqual(validateEnvironment(input, 'web').scope, {
    serverUrl: 'https://lumber.example.com',
    runtimeVersion: '2.58.0',
    deploymentId: validateEnvironment(input, 'worker').scope.deploymentId,
  });
});

test('service and daemon revision metadata cannot disagree about readiness', () => {
  const web = { ...validEnvironment(), VERCEL_DEPLOYMENT_ID: 'dpl_web' };
  const worker = {
    ...validEnvironment(),
    VERCEL_GIT_COMMIT_SHA: 'worker-commit',
  };
  delete worker.VERCEL_DEPLOYMENT_ID;
  assert.equal(
    validateEnvironment(web, 'web').scope.deploymentId,
    validateEnvironment(worker, 'worker').scope.deploymentId,
  );
});

test('runtime source identifies a release without platform revision metadata', () => {
  const input = validEnvironment();
  delete input.VERCEL_DEPLOYMENT_ID;
  delete input.VERCEL_GIT_COMMIT_SHA;
  assert.match(
    validateEnvironment(input, 'web').scope.deploymentId,
    /^[a-f0-9]{64}$/,
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
