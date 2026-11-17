'use strict';

const { installationError } = require('./lumber-bundle.cjs');

const WORKSPACE_TOOLS_IDENTIFIER = 'edcb212e-9658-4dfd-b3cc-0b175a294ca8';
const RETIRED_SHORTCUT_IDENTIFIERS = new Set([
  '700774e4-4b33-4fe9-b965-ef76570fdd75',
  '0088447e-cede-45a5-850c-1a85c8957709',
  '7024013f-0dc1-49fb-9734-f7fe86ffa981',
  'ead489f7-fd62-4b17-8446-0320202bfa19',
  'c1e7a4bd-f13e-41e6-a287-ee93b710da09',
  'eda1f57b-0d84-4d59-8df5-5a2f48cdb9ac',
  '6d72aad3-db26-464e-9d33-b3087d5cccfc',
]);
const STANDARD_ITEMS = [
  ['20202020-b001-4b01-8b01-c0aba11c0001', 'Customers & suppliers', 1, false],
  ['20202020-b005-4b05-8b05-c0aba11c0005', 'Contacts', 2, false],
  ['20202020-b006-4b06-8b06-c0aba11c0006', 'Tasks', 9, false],
  ['20202020-b003-4b03-8b03-c0aba11c0003', 'Notes', 10, false],
  ['20202020-b004-4b04-8b04-c0aba11c0004', 'Legacy opportunities', 1, true],
  ['20202020-b002-4b02-8b02-c0aba11c0002', 'Custom reports', 2, true],
  ['20202020-b008-4b08-8b08-c0aba11c0008', 'Automations', 3, true],
  ['20202020-b009-4b09-8b09-c0aba11c0009', 'Automation runs', 4, true],
  ['20202020-b00a-4b0a-8b0a-c0aba11c000a', 'Automation versions', 5, true],
  ['20202020-b00b-4b0b-8b0b-c0aba11c000b', 'Email campaigns', 6, true],
  ['20202020-b00d-4b0d-8b0d-c0aba11c000d', 'Mailing lists', 7, true],
];
const STANDARD_FOLDER_IDENTIFIERS = new Set([
  '20202020-b007-4b07-8b07-c0aba11c0007',
  '20202020-b00c-4b0c-8b0c-c0aba11c000c',
]);
const STANDARD_OBJECT_LABELS = new Map([
  [
    '20202020-b001-4b01-8b01-c0aba11c0001',
    ['company', 'Business', 'Customers & suppliers'],
  ],
  ['20202020-b005-4b05-8b05-c0aba11c0005', ['person', 'Contact', 'Contacts']],
  [
    '20202020-b004-4b04-8b04-c0aba11c0004',
    ['opportunity', 'Legacy opportunity', 'Legacy opportunities'],
  ],
  [
    '20202020-b002-4b02-8b02-c0aba11c0002',
    ['dashboard', 'Custom report', 'Custom reports'],
  ],
]);

const simplifyLumberNavigation = async (
  { workspaceId, applicationId },
  {
    navigationRepository,
    navigationService,
    readObjectMetadata,
    objectMetadataService,
    withWorkspaceAuthContext,
    buildSystemAuthContext,
  },
) => {
  try {
    const read = () => navigationRepository.find({ where: { workspaceId } });
    const items = await read();
    const shared = items.filter((item) => item.userWorkspaceId == null);
    if (items.some((item) => item.workspaceId !== workspaceId))
      throw new Error();
    const folders = shared.filter(
      (item) => item.universalIdentifier === WORKSPACE_TOOLS_IDENTIFIER,
    );
    const folder = folders[0];
    if (
      folders.length !== 1 ||
      folder.type !== 'FOLDER' ||
      folder.applicationId !== applicationId
    )
      throw new Error();
    const updates = [];
    const objectUpdates = [];
    const expectedLabels = [];
    const objects = await readObjectMetadata(workspaceId);
    for (const [
      universalIdentifier,
      name,
      position,
      useTools,
    ] of STANDARD_ITEMS) {
      const matches = shared.filter(
        (item) => item.universalIdentifier === universalIdentifier,
      );
      if (matches.length > 1) throw new Error();
      const item = matches[0];
      if (!item) continue;
      const labels = STANDARD_OBJECT_LABELS.get(universalIdentifier);
      if (labels) {
        const [nameSingular, labelSingular, labelPlural] = labels;
        const object = objects.find(
          (candidate) => candidate.id === item.targetObjectMetadataId,
        );
        if (
          item.type !== 'OBJECT' ||
          !object ||
          object.workspaceId !== workspaceId ||
          object.nameSingular !== nameSingular ||
          object.isStandard !== true
        )
          throw new Error();
        // Object menu labels come from object metadata; changing only the menu name has no visible effect.
        const labelUpdate = { labelSingular, labelPlural };
        expectedLabels.push({ id: object.id, ...labelUpdate });
        if (
          Object.entries(labelUpdate).some(
            ([key, value]) => object[key] !== value,
          )
        )
          objectUpdates.push({ id: object.id, update: labelUpdate });
      }
      const update = { name, position, folderId: useTools ? folder.id : null };
      if (Object.entries(update).some(([key, value]) => item[key] !== value)) {
        updates.push({ id: item.id, update });
      }
    }
    await withWorkspaceAuthContext(
      buildSystemAuthContext(workspaceId),
      async () => {
        if (objectUpdates.length)
          await objectMetadataService.updateManyObjects({
            updateObjectInputs: objectUpdates,
            workspaceId,
          });
        if (updates.length)
          await navigationService.updateMany({ inputs: updates, workspaceId });
        const moved = await read();
        // A folder deletion cascades to its children. Preserve folders with custom or personal items.
        const emptyFolders = moved.filter(
          (item) =>
            item.userWorkspaceId == null &&
            item.type === 'FOLDER' &&
            STANDARD_FOLDER_IDENTIFIERS.has(item.universalIdentifier) &&
            !moved.some((child) => child.folderId === item.id),
        );
        if (emptyFolders.length)
          await navigationService.deleteMany({
            ids: emptyFolders.map((item) => item.id),
            workspaceId,
          });
      },
    );
    const verified = (await read()).filter(
      (item) => item.userWorkspaceId == null,
    );
    const verifiedObjects = await readObjectMetadata(workspaceId);
    for (const expected of expectedLabels) {
      const object = verifiedObjects.find(
        (candidate) => candidate.id === expected.id,
      );
      if (
        !object ||
        Object.entries(expected).some(([key, value]) => object[key] !== value)
      )
        throw new Error();
    }
    for (const [
      universalIdentifier,
      name,
      position,
      useTools,
    ] of STANDARD_ITEMS) {
      if (
        !shared.some((item) => item.universalIdentifier === universalIdentifier)
      )
        continue;
      const item = verified.find(
        (candidate) => candidate.universalIdentifier === universalIdentifier,
      );
      if (
        !item ||
        item.name !== name ||
        item.position !== position ||
        item.folderId !== (useTools ? folder.id : null)
      )
        throw new Error();
    }
  } catch {
    throw installationError('navigation setup');
  }
};

module.exports = {
  RETIRED_SHORTCUT_IDENTIFIERS,
  WORKSPACE_TOOLS_IDENTIFIER,
  simplifyLumberNavigation,
};
