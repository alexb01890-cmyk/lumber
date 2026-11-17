'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const {
  LUMBER_APPLICATION_IDENTIFIER,
  loadLumberBundle,
} = require('../runtime/lumber-bundle.cjs');

const createBundle = async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'lumber-bundle-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, 'files'));
  const bytes = Buffer.from('export default () => "healthy";');
  const manifest = {
    application: { universalIdentifier: LUMBER_APPLICATION_IDENTIFIER },
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2));
  const files = [
    {
      path: 'health.mjs',
      role: 'built-logic-function',
      sourcePath: 'health.ts',
      size: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
  ];
  const contentHash = createHash('sha256')
    .update(
      JSON.stringify(
        files.map(({ path, role, sha256 }) => ({ path, role, sha256 })),
      ),
    )
    .update('\n')
    .update(manifestBytes)
    .digest('hex');
  const build = {
    application: {
      universalIdentifier: LUMBER_APPLICATION_IDENTIFIER,
      displayName: 'Lumber Distribution',
    },
    manifestFormat: 'twenty-application',
    manifest,
    files,
    contentHash,
  };
  await writeFile(path.join(directory, 'build.json'), JSON.stringify(build));
  await writeFile(path.join(directory, 'files/manifest.json'), manifestBytes);
  await writeFile(path.join(directory, 'files/health.mjs'), bytes);
  return { directory, build, bytes };
};

const rewriteBuild = async (fixture) =>
  writeFile(
    path.join(fixture.directory, 'build.json'),
    JSON.stringify(fixture.build),
  );

test('loads exact verified bytes and canonical upload folders from a retained CLI snapshot', async (context) => {
  const fixture = await createBundle(context);
  const bundle = await loadLumberBundle(fixture.directory);
  assert.equal(bundle.contentHash, fixture.build.contentHash);
  assert.deepEqual(bundle.files, [
    {
      filePath: 'health.mjs',
      fileFolder: 'built-logic-function',
      bytes: fixture.bytes,
    },
  ]);
});

test('changing any executable byte rejects the bundle before installation', async (context) => {
  const fixture = await createBundle(context);
  await writeFile(
    path.join(fixture.directory, 'files/health.mjs'),
    'secret=provider-password',
  );
  await assert.rejects(loadLumberBundle(fixture.directory), (error) => {
    assert.equal(error.code, 'LUMBER_INSTALLATION');
    assert.doesNotMatch(error.stack, /provider-password|health\.mjs/);
    return true;
  });
});

test('manifest bytes are covered even though manifest.json is not an artifact', async (context) => {
  const fixture = await createBundle(context);
  const manifestPath = path.join(fixture.directory, 'files/manifest.json');
  await writeFile(manifestPath, `${await readFile(manifestPath, 'utf8')}\n`);
  await assert.rejects(
    loadLumberBundle(fixture.directory),
    /bundle validation/,
  );
});

test('metadata manifest must match the retained manifest', async (context) => {
  const fixture = await createBundle(context);
  fixture.build.manifest.application.displayName = 'different';
  await rewriteBuild(fixture);
  await assert.rejects(
    loadLumberBundle(fixture.directory),
    /bundle validation/,
  );
});

for (const invalidPath of [
  '../outside.mjs',
  '/etc/passwd',
  'nested/../health.mjs',
  'nested\\health.mjs',
  'x:y',
  './health.mjs',
]) {
  test(`rejects unsafe artifact path ${JSON.stringify(invalidPath)}`, async (context) => {
    const fixture = await createBundle(context);
    fixture.build.files[0].path = invalidPath;
    await rewriteBuild(fixture);
    await assert.rejects(
      loadLumberBundle(fixture.directory),
      /bundle validation/,
    );
  });
}

test('symlinks cannot make artifact verification read outside the package', async (context) => {
  const fixture = await createBundle(context);
  const artifactPath = path.join(fixture.directory, 'files/health.mjs');
  await rm(artifactPath);
  await writeFile(path.join(fixture.directory, 'outside.mjs'), fixture.bytes);
  await symlink('../outside.mjs', artifactPath);
  await assert.rejects(
    loadLumberBundle(fixture.directory),
    /bundle validation/,
  );
});

for (const modification of [
  'foreign identifier',
  'unsupported role',
  'duplicate artifact',
  'wrong content hash',
  'wrong size',
]) {
  test(`rejects ${modification}`, async (context) => {
    const fixture = await createBundle(context);
    if (modification === 'foreign identifier')
      fixture.build.application.universalIdentifier = 'other';
    if (modification === 'unsupported role')
      fixture.build.files[0].role = '__proto__';
    if (modification === 'duplicate artifact')
      fixture.build.files.push({ ...fixture.build.files[0] });
    if (modification === 'wrong content hash')
      fixture.build.contentHash = 'a'.repeat(64);
    if (modification === 'wrong size') fixture.build.files[0].size += 1;
    await rewriteBuild(fixture);
    await assert.rejects(
      loadLumberBundle(fixture.directory),
      /bundle validation/,
    );
  });
}
