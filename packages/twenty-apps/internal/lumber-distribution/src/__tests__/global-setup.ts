import { runTwenty } from './run-twenty';

const validateEnvironmentOrThrow = (): { apiUrl: string; apiKey: string } => {
  const apiUrl = process.env.TWENTY_API_URL;
  const apiKey = process.env.TWENTY_API_KEY;

  if (
    apiUrl !== 'http://localhost:2021' &&
    apiUrl !== 'http://127.0.0.1:2021'
  ) {
    throw new Error(
      'Refusing app installation or removal outside the isolated test instance on localhost:2021.',
    );
  }

  if (!apiKey?.trim()) {
    throw new Error(
      'Set TWENTY_API_KEY explicitly for the isolated test instance.',
    );
  }

  if (process.env.TWENTY_REMOTE?.trim()) {
    throw new Error(
      'Unset TWENTY_REMOTE before running isolated integration tests.',
    );
  }

  return { apiUrl, apiKey };
};

const checkServerOrThrow = async (apiUrl: string) => {
  const response = await fetch(`${apiUrl}/healthz`, {
    signal: AbortSignal.timeout(5_000),
    redirect: 'error',
  }).catch(() => {
    throw new Error(
      `The isolated Twenty test server is not reachable at ${apiUrl}. Start it with twenty local start --test.`,
    );
  });

  if (!response.ok) {
    throw new Error(`Test server at ${apiUrl} returned ${response.status}`);
  }
};

export const setup = async () => {
  const { apiUrl } = validateEnvironmentOrThrow();

  await checkServerOrThrow(apiUrl);
  await teardown();

  const result = await runTwenty(['app', 'apply', '--create', '--no-input']);

  if (!result.ok) {
    throw new Error(
      `App apply failed: ${result.error.code} ${result.error.message}`,
    );
  }
};

export const teardown = async () => {
  validateEnvironmentOrThrow();

  const result = await runTwenty(['app', 'uninstall', '--yes', '--no-input']);

  if (!result.ok && result.error.code !== 'APP_NOT_INSTALLED') {
    throw new Error(
      `App uninstall failed: ${result.error.code} ${result.error.message}`,
    );
  }
};
