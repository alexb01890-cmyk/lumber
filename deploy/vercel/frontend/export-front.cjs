const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createWriteStream } = require('node:fs');
const { setGlobalProxyFromEnv } = require('node:http');
const {
  lstat,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
} = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Readable, Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const IMAGE_DIGEST =
  'sha256:3f1b5140a2d0ce590462c7636c109ec30fd4008d6f31dd5e7f3149b4f8a0dbb4';
const AMD64_MANIFEST_DIGEST =
  'sha256:d6ead86f5d757e4cdeebe1560c59e2bbe279a59c360ffb407110b120cc4443d7';
const FRONTEND_LAYER_DIGEST =
  'sha256:2e7dd957bb3c35d75c875613c2ca79bf1d0a4a61a81924443620872076003d16';
const FRONTEND_LAYER_SIZE = 21_470_729;
const FRONTEND_PREFIX = 'app/packages/twenty-server/dist/front';
const REPOSITORY_URL = 'https://registry-1.docker.io/v2/twentycrm/twenty';
const MANIFEST_ACCEPT = [
  'application/vnd.oci.image.index.v1+json',
  'application/vnd.oci.image.manifest.v1+json',
  'application/vnd.docker.distribution.manifest.list.v2+json',
  'application/vnd.docker.distribution.manifest.v2+json',
].join(', ');

if (typeof setGlobalProxyFromEnv === 'function') {
  setGlobalProxyFromEnv();
}

const fetchManifest = async (digest, token) => {
  const response = await fetch(`${REPOSITORY_URL}/manifests/${digest}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: MANIFEST_ACCEPT },
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(
      `Public image manifest request failed (${response.status}).`,
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());

  if (`sha256:${createHash('sha256').update(bytes).digest('hex')}` !== digest) {
    throw new Error(
      'Public image manifest checksum does not match its pinned digest.',
    );
  }

  return JSON.parse(bytes);
};

const downloadFrontendLayer = async (archivePath) => {
  const response = await fetch(
    'https://auth.docker.io/token?service=registry.docker.io&scope=repository:twentycrm/twenty:pull',
    { signal: AbortSignal.timeout(60_000) },
  );

  if (!response.ok) {
    throw new Error(
      `Public registry authorization failed (${response.status}).`,
    );
  }

  const authorization = await response.json();
  const token = authorization.token ?? authorization.access_token;

  if (typeof token !== 'string' || !token) {
    throw new Error(
      'Public registry authorization did not return a pull token.',
    );
  }

  const index = await fetchManifest(IMAGE_DIGEST, token);
  const platform = index.manifests?.find(
    (manifest) =>
      manifest.platform?.os === 'linux' &&
      manifest.platform?.architecture === 'amd64',
  );

  if (platform?.digest !== AMD64_MANIFEST_DIGEST) {
    throw new Error(
      'Pinned image no longer identifies the expected amd64 manifest.',
    );
  }

  const manifest = await fetchManifest(AMD64_MANIFEST_DIGEST, token);
  const frontendLayer = manifest.layers?.at(-1);

  if (
    frontendLayer?.digest !== FRONTEND_LAYER_DIGEST ||
    frontendLayer.size !== FRONTEND_LAYER_SIZE ||
    frontendLayer.mediaType !== 'application/vnd.oci.image.layer.v1.tar+gzip'
  ) {
    throw new Error(
      'Pinned image does not contain the expected final frontend layer.',
    );
  }

  const layerResponse = await fetch(
    `${REPOSITORY_URL}/blobs/${FRONTEND_LAYER_DIGEST}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(180_000),
    },
  );

  if (!layerResponse.ok || !layerResponse.body) {
    throw new Error(
      `Public frontend layer request failed (${layerResponse.status}).`,
    );
  }

  const hash = createHash('sha256');
  let downloadedSize = 0;

  await pipeline(
    Readable.fromWeb(layerResponse.body),
    new Transform({
      transform(chunk, _encoding, callback) {
        downloadedSize += chunk.length;

        if (downloadedSize > FRONTEND_LAYER_SIZE) {
          callback(new Error('Public frontend layer exceeds its pinned size.'));

          return;
        }

        hash.update(chunk);
        callback(null, chunk);
      },
    }),
    createWriteStream(archivePath, { flags: 'wx' }),
  );

  if (
    downloadedSize !== FRONTEND_LAYER_SIZE ||
    `sha256:${hash.digest('hex')}` !== FRONTEND_LAYER_DIGEST
  ) {
    throw new Error(
      'Downloaded frontend layer failed its pinned size or checksum check.',
    );
  }
};

const runTar = (argumentsList) => {
  const result = spawnSync('tar', argumentsList, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: 60_000,
    env: { ...process.env, LC_ALL: 'C', TAR_OPTIONS: '' },
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      'The system tar command could not inspect or extract the frontend.',
    );
  }

  return result.stdout;
};

const validateArchive = (archivePath) => {
  const names = runTar(['--list', '--gzip', '--file', archivePath])
    .trimEnd()
    .split('\n');
  const entries = runTar([
    '--list',
    '--verbose',
    '--gzip',
    '--file',
    archivePath,
  ])
    .trimEnd()
    .split('\n');

  if (!names.length || names.length !== entries.length) {
    throw new Error('Frontend layer archive listing is invalid.');
  }

  const seen = new Set();

  for (let index = 0; index < names.length; index += 1) {
    const name = names[index].replace(/\/$/, '');
    const type = entries[index][0];
    const ancestor = FRONTEND_PREFIX.startsWith(`${name}/`);
    const frontend =
      name === FRONTEND_PREFIX || name.startsWith(`${FRONTEND_PREFIX}/`);

    if (
      !name ||
      /[\\:\x00-\x1f\x7f]/.test(name) ||
      name.split('/').some((part) => !part || part === '.' || part === '..') ||
      !['d', '-'].includes(type) ||
      (!frontend && !(ancestor && type === 'd')) ||
      seen.has(name)
    ) {
      throw new Error(
        'Frontend layer contains an unsafe path or unsupported archive entry.',
      );
    }

    seen.add(name);
  }

  if (!seen.has(`${FRONTEND_PREFIX}/index.html`)) {
    throw new Error('Frontend layer does not contain the expected index.html.');
  }
};

const verifyStaticFiles = async (directory) => {
  let fileCount = 0;
  let totalSize = 0;
  const visit = async (currentDirectory) => {
    for (const name of await readdir(currentDirectory)) {
      const filePath = path.join(currentDirectory, name);
      const metadata = await lstat(filePath);

      if (metadata.isDirectory()) {
        await visit(filePath);
      } else if (metadata.isFile()) {
        fileCount += 1;
        totalSize += metadata.size;
      } else {
        throw new Error(
          'Extracted frontend contains an unsupported file type.',
        );
      }
    }
  };

  await visit(directory);

  const index = await readFile(path.join(directory, 'index.html'), 'utf8');
  const assets = await readdir(path.join(directory, 'assets'));

  if (
    !index.includes('<html') ||
    !assets.some((name) => name.endsWith('.js'))
  ) {
    throw new Error(
      'Extracted frontend is missing its HTML document or JavaScript assets.',
    );
  }

  return { fileCount, totalSize };
};

const exportFrontend = async () => {
  const downloadDirectory = await mkdtemp(
    path.join(os.tmpdir(), 'lumber-front-layer-'),
  );
  const stagingDirectory = await mkdtemp(
    path.join(__dirname, '.front-export-'),
  );

  try {
    const archivePath = path.join(downloadDirectory, 'frontend.tar.gz');

    await downloadFrontendLayer(archivePath);
    validateArchive(archivePath);
    runTar([
      '--extract',
      '--gzip',
      '--file',
      archivePath,
      '--directory',
      stagingDirectory,
      '--strip-components=5',
      '--no-same-owner',
      '--no-same-permissions',
      FRONTEND_PREFIX,
    ]);

    const summary = await verifyStaticFiles(stagingDirectory);

    await rm(path.join(__dirname, 'public'), { recursive: true, force: true });
    await rename(stagingDirectory, path.join(__dirname, 'public'));

    console.log(
      `Exported pinned Twenty 2.58.0 frontend: ${summary.fileCount} files, ${summary.totalSize} bytes.`,
    );
  } finally {
    await rm(downloadDirectory, { recursive: true, force: true });
    await rm(stagingDirectory, { recursive: true, force: true });
  }
};

if (require.main === module) {
  exportFrontend().catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'Frontend export failed.',
    );
    process.exitCode = 1;
  });
}

module.exports = { exportFrontend };
