'use strict';

const validEnvironment = () => ({
  VERCEL_ENV: 'production',
  VERCEL_DEPLOYMENT_ID: 'dpl_test',
  PG_DATABASE_URL:
    'postgresql://test-user:test-password@db.example.com/twenty?sslmode=require',
  REDIS_URL: 'rediss://default:test-password@redis.example.com:6379',
  SERVER_URL: 'https://lumber.example.com',
  SERVER_INTERNAL_URL: 'https://crm.service.example.com',
  ENCRYPTION_KEY: 'test-encryption-key-that-is-at-least-thirty-two-characters',
  STORAGE_TYPE: 'S_3',
  STORAGE_S3_NAME: 'test-bucket',
  STORAGE_S3_REGION: 'us-east-1',
  STORAGE_S3_ACCESS_KEY_ID: 'test-access-key',
  STORAGE_S3_SECRET_ACCESS_KEY: 'test-secret-key',
});

module.exports = { validEnvironment };
