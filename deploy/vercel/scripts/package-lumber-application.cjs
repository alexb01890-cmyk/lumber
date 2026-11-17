const { fork } = require('node:child_process');
const { createHash } = require('node:crypto');
const {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} = require('node:fs/promises');
const { createRequire } = require('node:module');
const path = require('node:path');

const REPOSITORY_DIRECTORY = path.resolve(__dirname, '../../..');
const APPLICATION_DIRECTORY = path.join(
  REPOSITORY_DIRECTORY,
  'packages/twenty-apps/internal/lumber-distribution',
);
const OUTPUT_DIRECTORY = path.join(
  REPOSITORY_DIRECTORY,
  'deploy/vercel/lumber-application',
);
const APPLICATION_UNIVERSAL_IDENTIFIER = 'c7eab9b8-4256-4712-8b56-74a7f04b00b9';
const TOOLING_VERSION = '2.58.0';
const ARTIFACT_ROLES = new Set([
  'built-logic-function',
  'built-front-component',
  'source',
  'dependencies',
  'public-asset',
]);

const safeRelativePath = (value) => {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.includes('\\') ||
    value.includes(':') ||
    value.includes('\0') ||
    value.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    throw new Error('Snapshot contains an unsafe artifact path.');
  }

  return value;
};

const readVerifiedFile = async (directory, artifact) => {
  const relativePath = safeRelativePath(artifact.path);
  let filePath = directory;

  for (const part of relativePath.split('/')) {
    filePath = path.join(filePath, part);

    if ((await lstat(filePath)).isSymbolicLink()) {
      throw new Error('Snapshot artifacts must not contain symbolic links.');
    }
  }

  if (!(await lstat(filePath)).isFile()) {
    throw new Error('Snapshot artifact is not a regular file.');
  }

  const bytes = await readFile(filePath);
  const checksum = createHash('sha256').update(bytes).digest('hex');

  if (bytes.length !== artifact.size || checksum !== artifact.sha256) {
    throw new Error(`Snapshot integrity check failed for ${relativePath}.`);
  }

  return bytes;
};

const retainSnapshot = async (build, stagingDirectory) => {
  if (
    build?.application?.universalIdentifier !==
      APPLICATION_UNIVERSAL_IDENTIFIER ||
    build.manifest?.application?.universalIdentifier !==
      APPLICATION_UNIVERSAL_IDENTIFIER ||
    build.manifestFormat !== 'twenty-application' ||
    typeof build.directory !== 'string' ||
    !Array.isArray(build.files) ||
    !/^[a-f0-9]{64}$/.test(build.contentHash)
  ) {
    throw new Error(
      'Worker did not return the expected Lumber application build.',
    );
  }

  const snapshotDirectory = await realpath(build.directory);
  const snapshotRoot = await realpath(
    path.join(APPLICATION_DIRECTORY, '.twenty/cli/snapshots'),
  );
  const snapshotRelativePath = path.relative(snapshotRoot, snapshotDirectory);

  if (
    !snapshotRelativePath ||
    snapshotRelativePath.startsWith('..') ||
    path.isAbsolute(snapshotRelativePath)
  ) {
    throw new Error(
      'Worker snapshot is outside the application snapshot directory.',
    );
  }

  const filesDirectory = path.join(stagingDirectory, 'files');
  const artifactPaths = new Set();
  const sortedFiles = [...build.files].sort((first, second) =>
    first.path < second.path ? -1 : first.path > second.path ? 1 : 0,
  );

  for (const artifact of sortedFiles) {
    const relativePath = safeRelativePath(artifact.path);

    if (
      artifactPaths.has(relativePath) ||
      !ARTIFACT_ROLES.has(artifact.role) ||
      !Number.isSafeInteger(artifact.size) ||
      artifact.size < 0 ||
      !/^[a-f0-9]{64}$/.test(artifact.sha256)
    ) {
      throw new Error(
        'Worker returned invalid or duplicate artifact metadata.',
      );
    }

    artifactPaths.add(relativePath);

    const bytes = await readVerifiedFile(snapshotDirectory, artifact);
    const destination = path.join(filesDirectory, relativePath);

    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, bytes, { flag: 'wx' });
    await readVerifiedFile(filesDirectory, artifact);
  }

  if (!artifactPaths.has('package.json')) {
    throw new Error('Snapshot is missing its package metadata.');
  }

  const manifestPath = path.join(snapshotDirectory, 'manifest.json');

  if (!(await lstat(manifestPath)).isFile()) {
    throw new Error('Snapshot manifest must be a regular file.');
  }

  const manifestBytes = await readFile(manifestPath);

  await writeFile(path.join(filesDirectory, 'manifest.json'), manifestBytes, {
    flag: 'wx',
  });

  const retainedManifestBytes = await readFile(
    path.join(filesDirectory, 'manifest.json'),
  );

  if (!manifestBytes.equals(retainedManifestBytes)) {
    throw new Error('Retained manifest differs from the held snapshot.');
  }

  const contentHash = createHash('sha256')
    .update(
      JSON.stringify(
        sortedFiles.map(({ path: filePath, role, sha256 }) => ({
          path: filePath,
          role,
          sha256,
        })),
      ),
    )
    .update('\n')
    .update(manifestBytes)
    .digest('hex');

  if (
    contentHash !== build.contentHash ||
    JSON.stringify(JSON.parse(manifestBytes)) !== JSON.stringify(build.manifest)
  ) {
    throw new Error(
      'Snapshot manifest or content hash does not match the build.',
    );
  }

  // Leases and local snapshot paths are ephemeral; deployment identity is the content hash.
  const { buildId: _buildId, directory: _directory, ...retainedBuild } = build;

  await writeFile(
    path.join(stagingDirectory, 'build.json'),
    `${JSON.stringify(retainedBuild, null, 2)}\n`,
    { flag: 'wx' },
  );

  return {
    contentHash,
    fileCount: sortedFiles.length,
    size: sortedFiles.reduce((total, artifact) => total + artifact.size, 0),
  };
};

const bundleWithWorker = (workerPath, stagingDirectory) =>
  new Promise((resolve, reject) => {
    const worker = fork(workerPath, [], {
      cwd: APPLICATION_DIRECTORY,
      env: Object.fromEntries(
        Object.entries(process.env).filter(([name]) => !/^TWENTY_/i.test(name)),
      ),
      execArgv: [],
      serialization: 'json',
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    });
    let heldWork;
    let heldError;
    let summary;
    let released = false;
    let terminationTimeout;
    const timeout = setTimeout(() => {
      heldError = new Error(
        'Lumber snapshot build exceeded its three-minute limit.',
      );

      if (worker.connected) {
        worker.send({ type: heldWork ? 'release' : 'cancel' });
      }

      terminationTimeout = setTimeout(() => {
        if (worker.connected) {
          worker.disconnect();
        }
      }, 5_000);
    }, 180_000);

    worker.on('message', (message) => {
      if (message?.type === 'failure') {
        heldError = new Error('The Twenty snapshot worker reported a failure.');
      } else if (message?.type === 'released') {
        released = message.release?.success === true;
      } else if (message?.type === 'result' && !heldWork) {
        if (message.result?.success !== true || !message.isSnapshotHeld) {
          heldError = new Error(
            'The Twenty worker did not hold a successful snapshot.',
          );

          return;
        }

        heldWork = retainSnapshot(message.result.data, stagingDirectory)
          .then((result) => {
            summary = result;
          })
          .catch((error) => {
            heldError = error;
          })
          .finally(() => {
            if (worker.connected) {
              worker.send({ type: 'release' });
            }
          });
      }
    });
    worker.on('error', (error) => {
      heldError = error;
      clearTimeout(timeout);
      clearTimeout(terminationTimeout);
      reject(error);
    });
    worker.on('exit', async (code) => {
      clearTimeout(timeout);
      clearTimeout(terminationTimeout);
      await heldWork;

      if (heldError || code !== 0 || !summary || !released) {
        reject(
          heldError ??
            new Error('Worker exited before releasing its snapshot.'),
        );
      } else {
        resolve(summary);
      }
    });
    worker.send({
      type: 'bundleSnapshot',
      appPath: APPLICATION_DIRECTORY,
      holdSnapshot: true,
    });
  });

const packageLumberApplication = async (twentyPackageDirectory) => {
  const packageJsonPath = twentyPackageDirectory
    ? path.join(path.resolve(twentyPackageDirectory), 'package.json')
    : createRequire(path.join(APPLICATION_DIRECTORY, 'package.json')).resolve(
        'twenty/package.json',
      );
  const tooling = JSON.parse(await readFile(packageJsonPath, 'utf8'));

  if (tooling.name !== 'twenty' || tooling.version !== TOOLING_VERSION) {
    throw new Error(
      `Packaging requires the official twenty@${TOOLING_VERSION} CLI.`,
    );
  }

  const workerPath = path.join(
    path.dirname(packageJsonPath),
    'dist/app-worker.cjs',
  );
  const stagingDirectory = await mkdtemp(
    path.join(path.dirname(OUTPUT_DIRECTORY), '.lumber-application-build-'),
  );

  try {
    const summary = await bundleWithWorker(workerPath, stagingDirectory);

    await rm(OUTPUT_DIRECTORY, { recursive: true, force: true });
    await rename(stagingDirectory, OUTPUT_DIRECTORY);

    return summary;
  } finally {
    await rm(stagingDirectory, { recursive: true, force: true });
  }
};

module.exports = { packageLumberApplication };

if (require.main === module) {
  const argumentsList = process.argv.slice(2);

  if (
    argumentsList.length > 0 &&
    (argumentsList.length !== 2 || argumentsList[0] !== '--twenty-package')
  ) {
    console.error(
      'Usage: node deploy/vercel/scripts/package-lumber-application.cjs [--twenty-package /path/to/node_modules/twenty]',
    );
    process.exitCode = 1;
  } else {
    packageLumberApplication(argumentsList[1]).then(
      ({ contentHash, fileCount, size }) => {
        console.log(
          `Retained ${fileCount} files (${size} bytes), SHA-256 ${contentHash}.`,
        );
      },
      (error) => {
        console.error(
          error instanceof Error ? error.message : 'Lumber packaging failed.',
        );
        process.exitCode = 1;
      },
    );
  }
}
