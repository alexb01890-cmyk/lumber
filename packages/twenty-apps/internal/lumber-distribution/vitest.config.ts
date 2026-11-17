import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const TWENTY_API_URL = (
  process.env.TWENTY_API_URL ?? 'http://localhost:2021'
).replace(/\/$/, '');
const TWENTY_API_KEY = process.env.TWENTY_API_KEY;
const ISOLATED_TEST_URLS = ['http://localhost:2021', 'http://127.0.0.1:2021'];

if (!ISOLATED_TEST_URLS.includes(TWENTY_API_URL)) {
  throw new Error(
    'Integration tests install and uninstall the app. Use only the isolated Twenty test instance on localhost:2021.',
  );
}

if (!TWENTY_API_KEY?.trim()) {
  throw new Error(
    'Set TWENTY_API_KEY explicitly for the isolated test instance.',
  );
}

if (process.env.TWENTY_REMOTE?.trim()) {
  throw new Error(
    'Unset TWENTY_REMOTE before running isolated integration tests.',
  );
}

process.env.TWENTY_API_URL = TWENTY_API_URL;

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: ['tsconfig.spec.json'],
      ignoreConfigErrors: true,
    }),
  ],
  test: {
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    include: ['src/**/*.integration-test.ts'],
    globalSetup: ['src/__tests__/global-setup.ts'],
    env: {
      TWENTY_API_URL,
      TWENTY_API_KEY,
    },
  },
});
