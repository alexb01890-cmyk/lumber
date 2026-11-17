const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const APPLICATION_IDENTIFIER = 'c7eab9b8-4256-4712-8b56-74a7f04b00b9';
const SCRIPT_PATH = path.join(
  __dirname,
  '../scripts/package-lumber-application.cjs',
);

const withFixture = async (options, run) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'lumber-package-test-'));
  const script = path.join(root, 'deploy/vercel/scripts/package.cjs');
  const output = path.join(root, 'deploy/vercel/lumber-application');
  const app = path.join(
    root,
    'packages/twenty-apps/internal/lumber-distribution',
  );
  const lease = path.join(app, '.twenty/cli/snapshots/build-fixture');
  const files = path.join(lease, 'files');
  const tooling = path.join(root, 'tooling/twenty');
  const releasedMarker = path.join(root, 'released');
  const packageBytes = Buffer.from('{"name":"lumber-distribution"}\n');
  const manifest = {
    application: { universalIdentifier: APPLICATION_IDENTIFIER },
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifest));
  const artifacts = [
    {
      path: 'package.json',
      role: 'dependencies',
      sourcePath: 'package.json',
      size: packageBytes.length,
      sha256: createHash('sha256').update(packageBytes).digest('hex'),
    },
  ];
  const contentHash = createHash('sha256')
    .update(
      JSON.stringify(
        artifacts.map(({ path: artifactPath, role, sha256 }) => ({
          path: artifactPath,
          role,
          sha256,
        })),
      ),
    )
    .update('\n')
    .update(manifestBytes)
    .digest('hex');
  const build = {
    buildId: 'ephemeral-build-id',
    directory: files,
    application: { universalIdentifier: APPLICATION_IDENTIFIER },
    manifestFormat: 'twenty-application',
    manifest,
    contentHash,
    files: artifacts,
  };

  await mkdir(path.dirname(script), { recursive: true });
  await mkdir(output, { recursive: true });
  await mkdir(files, { recursive: true });
  await mkdir(path.join(tooling, 'dist'), { recursive: true });
  await copyFile(SCRIPT_PATH, script);
  await writeFile(path.join(output, 'previous-package'), 'preserve on failure');
  await writeFile(path.join(files, 'package.json'), packageBytes);
  await writeFile(path.join(files, 'manifest.json'), manifestBytes);
  await writeFile(
    path.join(tooling, 'package.json'),
    JSON.stringify({ name: 'twenty', version: options.version ?? '2.58.0' }),
  );

  if (options.corruptArtifact) {
    await writeFile(path.join(files, 'package.json'), 'tampered');
  }

  if (options.corruptContentHash) {
    build.contentHash = '0'.repeat(64);
  }

  if (options.symlinkArtifact) {
    await rm(path.join(files, 'package.json'));
    await writeFile(path.join(root, 'outside-package.json'), packageBytes);
    await symlink(
      path.join(root, 'outside-package.json'),
      path.join(files, 'package.json'),
    );
  }

  await writeFile(
    path.join(tooling, 'dist/app-worker.cjs'),
    `const fs = require('node:fs');
process.on('message', (message) => {
  if (message.type === 'bundleSnapshot') {
    if (!message.holdSnapshot || Object.keys(process.env).some((name) => /^TWENTY_/i.test(name))) {
      process.send({type: 'failure', message: 'Invalid worker isolation or lease request'}, () => process.exit(1));
      return;
    }
    process.send({type: 'result', result: {success: true, data: ${JSON.stringify(build)}}, isSnapshotHeld: true});
  } else if (message.type === 'release') {
    fs.rmSync(${JSON.stringify(lease)}, {recursive: true, force: true});
    fs.writeFileSync(${JSON.stringify(releasedMarker)}, 'released');
    process.send({type: 'released', release: {success: ${!options.failRelease}}}, () => process.exit(0));
  }
});
`,
  );

  try {
    await run({
      packageApplication: require(script).packageLumberApplication,
      output,
      tooling,
      releasedMarker,
      root,
      contentHash,
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
};

test('retains verified files while held, scrubs workspace credentials, and releases the snapshot', async () => {
  const previous = process.env.TWENTY_API_KEY;

  process.env.TWENTY_API_KEY = 'test-sentinel-never-inherited';

  try {
    await withFixture(
      {},
      async ({
        packageApplication,
        output,
        tooling,
        releasedMarker,
        contentHash,
      }) => {
        const result = await packageApplication(tooling);
        const retained = JSON.parse(
          await readFile(path.join(output, 'build.json'), 'utf8'),
        );

        assert.equal(result.contentHash, contentHash);
        assert.equal(result.fileCount, 1);
        assert.equal(retained.contentHash, contentHash);
        assert.equal('directory' in retained, false);
        assert.equal('buildId' in retained, false);
        assert.equal(await readFile(releasedMarker, 'utf8'), 'released');
        assert.deepEqual(await readdir(path.join(output, 'files')), [
          'manifest.json',
          'package.json',
        ]);
        await assert.rejects(readFile(path.join(output, 'previous-package')));
      },
    );
  } finally {
    if (previous === undefined) {
      delete process.env.TWENTY_API_KEY;
    } else {
      process.env.TWENTY_API_KEY = previous;
    }
  }
});

for (const [name, options] of [
  ['changed artifact bytes', { corruptArtifact: true }],
  ['changed manifest content hash', { corruptContentHash: true }],
  ['a symbolic-link artifact', { symlinkArtifact: true }],
  ['a failed snapshot release', { failRelease: true }],
]) {
  test(`rejects ${name}, releases its lease and preserves the previous package`, async () => {
    await withFixture(
      options,
      async ({ packageApplication, output, tooling, releasedMarker, root }) => {
        await assert.rejects(packageApplication(tooling));
        assert.equal(await readFile(releasedMarker, 'utf8'), 'released');
        assert.equal(
          await readFile(path.join(output, 'previous-package'), 'utf8'),
          'preserve on failure',
        );
        assert.equal(
          (await readdir(path.join(root, 'deploy/vercel'))).some((name) =>
            name.startsWith('.lumber-application-build-'),
          ),
          false,
        );
      },
    );
  });
}

test('rejects a different CLI version before changing the saved package', async () => {
  await withFixture(
    { version: '2.59.0' },
    async ({ packageApplication, output, tooling, releasedMarker }) => {
      await assert.rejects(
        packageApplication(tooling),
        /official twenty@2\.58\.0/,
      );
      assert.equal(
        await readFile(path.join(output, 'previous-package'), 'utf8'),
        'preserve on failure',
      );
      await assert.rejects(readFile(releasedMarker));
    },
  );
});
