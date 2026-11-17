'use strict';

const { setTimeout: delay } = require('node:timers/promises');
const { createDatabaseClient } = require('./create-database-client.cjs');
const {
  LUMBER_APPLICATION_IDENTIFIER,
  INSTALLATION_PHASES,
  installationError,
  loadLumberBundle,
} = require('./lumber-bundle.cjs');
const {
  isInstallerResult,
  runLumberInstaller,
} = require('./run-lumber-installer.cjs');
const { isReadyLumberWorkspace } = require('./install-lumber-application.cjs');

const watchLumberInstallation = async (
  environment,
  {
    signal,
    createClient = createDatabaseClient,
    loadBundle = loadLumberBundle,
    runInstaller = runLumberInstaller,
    pollMilliseconds = 15000,
    delay: wait = delay,
    log = console.log,
  } = {},
) => {
  if (environment.LUMBER_AUTO_INSTALL !== 'true') return { status: 'disabled' };
  let client;
  let phase = 'bundle validation';
  try {
    const bundleDirectory =
      environment.LUMBER_APPLICATION_DIRECTORY ||
      '/app/vercel/lumber-application';
    const bundle = await loadBundle(bundleDirectory);
    if (signal?.aborted) return { status: 'aborted' };
    phase = 'workspace polling';
    client = createClient(environment);
    await client.connect();
    phase = 'marker storage';
    await client.query(`CREATE TABLE IF NOT EXISTS vercel_runtime.lumber_installation (
      workspace_id uuid NOT NULL,
      application_universal_identifier uuid NOT NULL,
      content_hash text NOT NULL,
      application_id uuid NOT NULL,
      installed_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (workspace_id, application_universal_identifier, content_hash)
    )`);
    while (!signal?.aborted) {
      phase = 'workspace polling';
      const { rows } =
        await client.query(`SELECT id, "activationStatus", "databaseSchema", "defaultRoleId", "workspaceCustomApplicationId"
        FROM core.workspace WHERE "deletedAt" IS NULL ORDER BY "createdAt" LIMIT 2`);
      if (rows.length > 1) throw installationError('workspace validation');
      const workspace = rows[0];
      if (
        !workspace ||
        !['CREATED', 'ACTIVE'].includes(workspace.activationStatus)
      ) {
        await wait(pollMilliseconds, undefined, { signal });
        continue;
      }
      if (!isReadyLumberWorkspace(workspace))
        throw installationError('workspace validation');
      phase = 'marker storage';
      const key = [
        workspace.id,
        LUMBER_APPLICATION_IDENTIFIER,
        bundle.contentHash,
      ];
      const existing = await client.query(
        `SELECT application_id FROM vercel_runtime.lumber_installation
        WHERE workspace_id = $1 AND application_universal_identifier = $2 AND content_hash = $3`,
        key,
      );
      if (existing.rows.length > 0) return { status: 'already-installed' };
      if (signal?.aborted) return { status: 'aborted' };
      phase = 'installer process';
      const expected = {
        bundleDirectory,
        workspaceId: workspace.id,
        contentHash: bundle.contentHash,
      };
      const result = await runInstaller(expected, { environment, signal });
      if (signal?.aborted) return { status: 'aborted' };
      if (!isInstallerResult(result, expected))
        throw installationError('installation verification');
      phase = 'marker storage';
      await client.query(
        `INSERT INTO vercel_runtime.lumber_installation
        (workspace_id, application_universal_identifier, content_hash, application_id)
        VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [...key, result.applicationId],
      );
      log('Lumber application installation completed.');
      return { status: 'installed', ...result };
    }
    return { status: 'aborted' };
  } catch (error) {
    if (signal?.aborted) return { status: 'aborted' };
    const safePhase =
      error?.code === 'LUMBER_INSTALLATION' &&
      INSTALLATION_PHASES.has(error.phase)
        ? error.phase
        : phase;
    log(`Lumber application installation failed during ${safePhase}.`);
    return { status: 'failed', phase: safePhase };
  } finally {
    if (client) {
      try {
        await client.end();
      } catch {}
    }
  }
};

module.exports = { watchLumberInstallation };
