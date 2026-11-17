'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { lstat, readFile } = require('node:fs/promises');
const path = require('node:path');

const LUMBER_APPLICATION_IDENTIFIER = 'c7eab9b8-4256-4712-8b56-74a7f04b00b9';
const FILE_FOLDER_BY_ROLE = Object.freeze({
  'built-logic-function': 'built-logic-function',
  'built-front-component': 'built-front-component',
  source: 'source',
  dependencies: 'dependencies',
  'public-asset': 'public-asset',
});

const INSTALLATION_PHASES = new Set([
  'runtime validation',
  'bundle validation',
  'operator startup',
  'workspace validation',
  'installation lock',
  'registration ownership validation',
  'application registration',
  'development application creation',
  'manifest plan validation',
  'artifact upload',
  'manifest application',
  'installation verification',
  'operator shutdown',
  'cancellation',
  'installer process',
  'workspace polling',
  'marker storage',
]);

const installationError = (phase) => {
  const safePhase = INSTALLATION_PHASES.has(phase)
    ? phase
    : 'runtime validation';
  const error = new Error(
    `Lumber application installation failed during ${safePhase}.`,
  );
  error.code = 'LUMBER_INSTALLATION';
  error.phase = safePhase;
  return error;
};

const assertRegularPath = async (root, relativePath, isDirectory = false) => {
  if (
    typeof relativePath !== 'string' ||
    relativePath.length === 0 ||
    relativePath.includes('\\') ||
    relativePath.includes('\0') ||
    relativePath.includes(':') ||
    relativePath
      .split('/')
      .some((part) => !part || part === '.' || part === '..')
  ) {
    throw installationError('bundle validation');
  }
  const parts = relativePath.split('/');
  let current = root;
  for (let index = 0; index < parts.length; index++) {
    current = path.join(current, parts[index]);
    const entry = await lstat(current);
    const shouldBeDirectory = index < parts.length - 1 || isDirectory;
    if (
      entry.isSymbolicLink() ||
      (shouldBeDirectory ? !entry.isDirectory() : !entry.isFile())
    ) {
      throw installationError('bundle validation');
    }
  }
  return current;
};

const loadLumberBundle = async (bundleDirectory) => {
  try {
    const root = path.resolve(bundleDirectory);
    const directory = await lstat(root);
    if (!directory.isDirectory() || directory.isSymbolicLink())
      throw installationError('bundle validation');
    const buildPath = await assertRegularPath(root, 'build.json');
    const filesDirectory = await assertRegularPath(root, 'files', true);
    const manifestPath = await assertRegularPath(
      filesDirectory,
      'manifest.json',
    );
    const build = JSON.parse(await readFile(buildPath, 'utf8'));
    const manifestBytes = await readFile(manifestPath);
    const manifest = JSON.parse(manifestBytes);
    if (
      build.manifestFormat !== 'twenty-application' ||
      build.application?.universalIdentifier !==
        LUMBER_APPLICATION_IDENTIFIER ||
      manifest.application?.universalIdentifier !==
        LUMBER_APPLICATION_IDENTIFIER ||
      typeof build.application?.displayName !== 'string' ||
      !build.application.displayName.trim() ||
      !Array.isArray(build.files) ||
      build.files.length === 0 ||
      build.files.length > 1000 ||
      !/^[a-f0-9]{64}$/.test(build.contentHash)
    ) {
      throw installationError('bundle validation');
    }
    assert.deepEqual(build.manifest, manifest);
    const files = [];
    const seen = new Set();
    let totalBytes = 0;
    for (const artifact of build.files) {
      if (
        !Object.hasOwn(FILE_FOLDER_BY_ROLE, artifact.role) ||
        seen.has(artifact.path) ||
        !Number.isSafeInteger(artifact.size) ||
        artifact.size < 0 ||
        artifact.size > 32 * 1024 * 1024 ||
        !/^[a-f0-9]{64}$/.test(artifact.sha256)
      ) {
        throw installationError('bundle validation');
      }
      seen.add(artifact.path);
      const absolutePath = await assertRegularPath(
        filesDirectory,
        artifact.path,
      );
      const bytes = await readFile(absolutePath);
      totalBytes += bytes.length;
      if (
        bytes.length !== artifact.size ||
        totalBytes > 64 * 1024 * 1024 ||
        createHash('sha256').update(bytes).digest('hex') !== artifact.sha256
      ) {
        throw installationError('bundle validation');
      }
      files.push({
        filePath: artifact.path,
        fileFolder: FILE_FOLDER_BY_ROLE[artifact.role],
        bytes,
      });
    }
    const digestEntries = [...build.files]
      .sort((first, second) =>
        first.path < second.path ? -1 : first.path > second.path ? 1 : 0,
      )
      .map(({ path: filePath, role, sha256 }) => ({
        path: filePath,
        role,
        sha256,
      }));
    const contentHash = createHash('sha256')
      .update(JSON.stringify(digestEntries))
      .update('\n')
      .update(manifestBytes)
      .digest('hex');
    if (contentHash !== build.contentHash)
      throw installationError('bundle validation');
    return { application: build.application, manifest, files, contentHash };
  } catch {
    throw installationError('bundle validation');
  }
};

module.exports = {
  LUMBER_APPLICATION_IDENTIFIER,
  INSTALLATION_PHASES,
  installationError,
  loadLumberBundle,
};
