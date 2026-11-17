'use strict';

const { createRequire } = require('node:module');
const path = require('node:path');
const { installationError } = require('./lumber-bundle.cjs');
const { simplifyLumberNavigation } = require('./lumber-navigation.cjs');

const SERVER_ROOT = '/app/packages/twenty-server';
const UUID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const closeLumberWorkspaceSecurity = async (
  workspaceId,
  {
    workspaceRepository,
    userWorkspaceRepository,
    workspaceService,
    approvedAccessDomainService,
    withWorkspaceAuthContext,
    buildSystemAuthContext,
  },
) => {
  try {
    if (!UUID_PATTERN.test(workspaceId)) throw new Error();
    const workspace = await workspaceRepository.findOneBy({ id: workspaceId });
    if (
      workspace?.id !== workspaceId ||
      !['CREATED', 'ACTIVE'].includes(workspace.activationStatus) ||
      workspace.deletedAt != null
    )
      throw new Error();

    const owners = await userWorkspaceRepository.find({
      where: { workspaceId, user: { canAccessFullAdminPanel: true } },
      relations: { user: true },
      select: {
        id: true,
        userId: true,
        workspaceId: true,
        deletedAt: true,
        user: { id: true, canAccessFullAdminPanel: true, deletedAt: true },
      },
      take: 2,
    });
    const owner = owners[0];
    if (
      owners.length !== 1 ||
      !UUID_PATTERN.test(owner?.id) ||
      !UUID_PATTERN.test(owner?.userId) ||
      owner.workspaceId !== workspaceId ||
      owner.deletedAt != null ||
      owner.user?.id !== owner.userId ||
      owner.user?.canAccessFullAdminPanel !== true ||
      owner.user?.deletedAt != null
    )
      throw new Error();

    const domains =
      await approvedAccessDomainService.getApprovedAccessDomains(workspace);
    if (!Array.isArray(domains) || domains.length !== 0) throw new Error();

    if (
      workspace.isPublicInviteLinkEnabled !== false ||
      workspace.isPasswordAuthEnabled !== true ||
      workspace.workspaceDiscoverability !== 'MEMBERS_AND_INVITEES'
    ) {
      await withWorkspaceAuthContext(buildSystemAuthContext(workspaceId), () =>
        workspaceService.updateWorkspaceById({
          payload: {
            id: workspaceId,
            isPublicInviteLinkEnabled: false,
            isPasswordAuthEnabled: true,
            workspaceDiscoverability: 'MEMBERS_AND_INVITEES',
          },
          userWorkspaceId: owner.id,
        }),
      );
    }

    const verified = await workspaceRepository.findOneBy({ id: workspaceId });
    if (
      verified?.id !== workspaceId ||
      verified.deletedAt != null ||
      !['CREATED', 'ACTIVE'].includes(verified.activationStatus) ||
      verified.isPublicInviteLinkEnabled !== false ||
      verified.isPasswordAuthEnabled !== true ||
      verified.workspaceDiscoverability !== 'MEMBERS_AND_INVITEES'
    )
      throw new Error();
    const verifiedDomains =
      await approvedAccessDomainService.getApprovedAccessDomains(verified);
    if (!Array.isArray(verifiedDomains) || verifiedDomains.length !== 0)
      throw new Error();
  } catch {
    throw installationError('installation verification');
  }
};

const createLumberOperator = async ({ serverRoot = SERVER_ROOT } = {}) => {
  const load = createRequire(path.join(serverRoot, 'package.json'));
  load('reflect-metadata');
  const { CommandFactory } = load('nest-commander');
  const { getRepositoryToken } = load('@nestjs/typeorm');
  const fromServer = (relativePath) =>
    load(path.join(serverRoot, 'dist', relativePath));
  const { CommandModule } = fromServer('command/command.module.js');
  const { WorkspaceEntity } = fromServer(
    'engine/core-modules/workspace/workspace.entity.js',
  );
  const { UserWorkspaceEntity } = fromServer(
    'engine/core-modules/user-workspace/user-workspace.entity.js',
  );
  const { WorkspaceService } = fromServer(
    'engine/core-modules/workspace/services/workspace.service.js',
  );
  const { ApprovedAccessDomainService } = fromServer(
    'engine/core-modules/approved-access-domain/services/approved-access-domain.service.js',
  );
  const { withWorkspaceAuthContext } = fromServer(
    'engine/core-modules/auth/storage/workspace-auth-context.storage.js',
  );
  const { buildSystemAuthContext } = fromServer(
    'engine/twenty-orm/utils/build-system-auth-context.util.js',
  );
  const { ApplicationRegistrationLookupService } = fromServer(
    'engine/core-modules/application/application-registration/application-registration-lookup/application-registration-lookup.service.js',
  );
  const { ApplicationRegistrationService } = fromServer(
    'engine/core-modules/application/application-registration/application-registration.service.js',
  );
  const { ApplicationDevelopmentService } = fromServer(
    'engine/core-modules/application/application-development/application-development.service.js',
  );
  const { ApplicationLookupService } = fromServer(
    'engine/core-modules/application/application-lookup/application-lookup.service.js',
  );
  const { CacheLockService } = fromServer(
    'engine/core-modules/cache-lock/cache-lock.service.js',
  );
  const { NavigationMenuItemEntity } = fromServer(
    'engine/metadata-modules/navigation-menu-item/entities/navigation-menu-item.entity.js',
  );
  const { NavigationMenuItemService } = fromServer(
    'engine/metadata-modules/navigation-menu-item/navigation-menu-item.service.js',
  );
  const { ObjectMetadataService } = fromServer(
    'engine/metadata-modules/object-metadata/object-metadata.service.js',
  );
  const { ApplicationService } = fromServer(
    'engine/core-modules/application/application.service.js',
  );
  const { belongsToTwentyStandardApp } = fromServer(
    'engine/metadata-modules/utils/belongs-to-twenty-standard-app.util.js',
  );
  const { resolveEffectiveFlatEntityProperty } = fromServer(
    'engine/metadata-modules/overrides/utils/resolve-effective-flat-entity-property.util.js',
  );
  const { MetadataEventEmitter } = fromServer(
    'engine/subscriptions/metadata-event/metadata-event-emitter.js',
  );
  const app = await CommandFactory.createWithoutRunning(CommandModule, {
    logger: false,
    abortOnError: false,
    bufferLogs: false,
  });
  try {
    const securityDependencies = {
      workspaceRepository: app.get(getRepositoryToken(WorkspaceEntity)),
      userWorkspaceRepository: app.get(getRepositoryToken(UserWorkspaceEntity)),
      workspaceService: app.get(WorkspaceService),
      approvedAccessDomainService: app.get(ApprovedAccessDomainService),
      withWorkspaceAuthContext,
      buildSystemAuthContext,
    };
    return {
      workspaceRepository: securityDependencies.workspaceRepository,
      registrationLookup: app.get(ApplicationRegistrationLookupService),
      registrationService: app.get(ApplicationRegistrationService),
      developmentService: app.get(ApplicationDevelopmentService),
      applicationLookup: app.get(ApplicationLookupService),
      cacheLock: app.get(CacheLockService),
      closeWorkspaceSecurity: (workspaceId) =>
        closeLumberWorkspaceSecurity(workspaceId, securityDependencies),
      simplifyNavigation: (input) =>
        simplifyLumberNavigation(input, {
          navigationRepository: app.get(
            getRepositoryToken(NavigationMenuItemEntity),
          ),
          navigationService: app.get(NavigationMenuItemService),
          readObjectMetadata: async (workspaceId) => {
            const { workspaceCustomFlatApplication } = await app
              .get(ApplicationService)
              .findWorkspaceTwentyStandardAndCustomApplicationOrThrow({
                workspaceId,
              });
            const objects = await app
              .get(ObjectMetadataService)
              .findManyWithinWorkspace(workspaceId);
            return objects.map((object) => ({
              ...object,
              isStandard: belongsToTwentyStandardApp(object),
              ...Object.fromEntries(
                ['labelSingular', 'labelPlural'].map((property) => [
                  property,
                  resolveEffectiveFlatEntityProperty({
                    metadataName: 'objectMetadata',
                    flatEntity: object,
                    property,
                    authorContext: {
                      workspaceCustomApplicationUniversalIdentifier:
                        workspaceCustomFlatApplication.universalIdentifier,
                    },
                  }),
                ]),
              ),
            }));
          },
          objectMetadataService: app.get(ObjectMetadataService),
          withWorkspaceAuthContext,
          buildSystemAuthContext,
        }),
      close: async () => {
        try {
          await app.get(MetadataEventEmitter).drain();
        } finally {
          await app.close();
        }
      },
    };
  } catch (error) {
    await app.close();
    throw error;
  }
};

module.exports = { createLumberOperator, closeLumberWorkspaceSecurity };
