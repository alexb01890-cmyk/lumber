'use strict';

const { randomUUID } = require('node:crypto');
const {
  LUMBER_APPLICATION_IDENTIFIER,
  installationError,
  loadLumberBundle,
} = require('./lumber-bundle.cjs');
const { createLumberOperator } = require('./lumber-operator.cjs');

const UUID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const isReadyLumberWorkspace = (workspace) =>
  Boolean(
    workspace &&
    ['CREATED', 'ACTIVE'].includes(workspace.activationStatus) &&
    workspace.deletedAt == null &&
    UUID_PATTERN.test(workspace.id) &&
    typeof workspace.databaseSchema === 'string' &&
    workspace.databaseSchema.trim() &&
    UUID_PATTERN.test(workspace.defaultRoleId) &&
    UUID_PATTERN.test(workspace.workspaceCustomApplicationId),
  );

const installLumberApplication = async (
  { bundleDirectory, workspaceId, expectedContentHash },
  {
    environment = process.env,
    signal,
    loadBundle = loadLumberBundle,
    createOperator = createLumberOperator,
  } = {},
) => {
  let phase = 'runtime validation';
  let operator;
  let result;
  let failed = false;
  const checkAborted = () => {
    if (signal?.aborted) throw installationError('cancellation');
  };
  const validatePlan = (plan) => {
    if (
      plan?.applicationUniversalIdentifier !== LUMBER_APPLICATION_IDENTIFIER ||
      !Array.isArray(plan.actions) ||
      plan.actions.some(
        (action) => !['create', 'update'].includes(action?.type),
      )
    ) {
      throw installationError('manifest plan validation');
    }
  };
  try {
    checkAborted();
    if (
      environment.NODE_ENV !== 'production' ||
      environment.APP_VERSION?.replace(/^v/, '') !== '2.58.0' ||
      (workspaceId !== undefined && !UUID_PATTERN.test(workspaceId))
    ) {
      throw installationError(phase);
    }
    phase = 'bundle validation';
    const bundle = await loadBundle(bundleDirectory);
    if (
      expectedContentHash !== undefined &&
      bundle.contentHash !== expectedContentHash
    )
      throw installationError(phase);
    checkAborted();
    phase = 'operator startup';
    operator = await createOperator();
    phase = 'workspace validation';
    const workspaces = await operator.workspaceRepository.find({
      select: [
        'id',
        'activationStatus',
        'databaseSchema',
        'defaultRoleId',
        'workspaceCustomApplicationId',
        'deletedAt',
      ],
      take: 2,
    });
    if (
      workspaces.length !== 1 ||
      (workspaceId !== undefined && workspaces[0].id !== workspaceId) ||
      !isReadyLumberWorkspace(workspaces[0])
    ) {
      throw installationError(phase);
    }
    const workspace = workspaces[0];
    checkAborted();
    phase = 'installation lock';
    result = await operator.cacheLock.withLock(
      async () => {
        checkAborted();
        phase = 'registration ownership validation';
        const existing =
          await operator.registrationLookup.findOneByUniversalIdentifierGlobal(
            LUMBER_APPLICATION_IDENTIFIER,
          );
        if (
          existing &&
          (existing.ownerWorkspaceId !== workspace.id ||
            existing.sourceType !== 'local')
        )
          throw installationError(phase);
        if (!existing) {
          phase = 'application registration';
          await operator.registrationService.create({
            universalIdentifier: LUMBER_APPLICATION_IDENTIFIER,
            name: bundle.application.displayName,
            ownerWorkspaceId: workspace.id,
            createdByUserId: null,
            sourceType: 'local',
            oAuthClientId: randomUUID(),
            oAuthClientSecretHash: null,
            oAuthRedirectUris: [],
            oAuthScopes: [],
          });
        }
        checkAborted();
        phase = 'development application creation';
        await operator.developmentService.createDevelopmentApplication({
          universalIdentifier: LUMBER_APPLICATION_IDENTIFIER,
          name: bundle.application.displayName,
          workspaceId: workspace.id,
        });
        const syncInput = {
          manifest: bundle.manifest,
          workspaceId: workspace.id,
          workspaceCustomApplicationId: workspace.workspaceCustomApplicationId,
          inferDeletionFromMissingEntities: false,
        };
        checkAborted();
        phase = 'manifest plan validation';
        validatePlan(
          await operator.developmentService.syncApplication({
            ...syncInput,
            dryRun: true,
          }),
        );
        phase = 'artifact upload';
        for (const file of bundle.files) {
          checkAborted();
          await operator.developmentService.uploadApplicationFile({
            workspaceId: workspace.id,
            applicationUniversalIdentifier: LUMBER_APPLICATION_IDENTIFIER,
            fileFolder: file.fileFolder,
            filePath: file.filePath,
            getFileBuffer: async () => file.bytes,
          });
        }
        checkAborted();
        phase = 'manifest application';
        validatePlan(
          await operator.developmentService.syncApplication({
            ...syncInput,
            dryRun: false,
          }),
        );
        checkAborted();
        phase = 'installation verification';
        const installed =
          await operator.applicationLookup.findByUniversalIdentifier({
            universalIdentifier: LUMBER_APPLICATION_IDENTIFIER,
            workspaceId: workspace.id,
          });
        const verification = await operator.developmentService.syncApplication({
          ...syncInput,
          dryRun: true,
        });
        validatePlan(verification);
        if (!installed?.id || verification.actions.length !== 0)
          throw installationError(phase);
        checkAborted();
        await operator.closeWorkspaceSecurity(workspace.id);
        checkAborted();
        return {
          workspaceId: workspace.id,
          applicationId: installed.id,
          applicationUniversalIdentifier: LUMBER_APPLICATION_IDENTIFIER,
          contentHash: bundle.contentHash,
        };
      },
      `vercel:lumber-install:${workspace.id}`,
      { ttl: 300000, maxRetries: 1, ms: 1 },
    );
  } catch (error) {
    failed = true;
    throw installationError(
      error?.code === 'LUMBER_INSTALLATION' ? error.phase : phase,
    );
  } finally {
    if (operator) {
      try {
        await operator.close();
      } catch {
        if (!failed) throw installationError('operator shutdown');
      }
    }
  }
  return result;
};

module.exports = { installLumberApplication, isReadyLumberWorkspace };
