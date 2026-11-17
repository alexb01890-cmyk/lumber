'use strict';

const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test } = require('node:test');
const {
  getRuntimeRelease,
  RUNTIME_IMAGE_DIGEST,
  RUNTIME_VERSION,
} = require('../runtime/runtime-release.cjs');

test('runtime identity ignores filesystem ordering and unrelated files but changes with code or image', () => {
  const first = mkdtempSync(join(tmpdir(), 'lumber-release-'));
  const second = mkdtempSync(join(tmpdir(), 'lumber-release-'));
  try {
    writeFileSync(join(first, 'b.cjs'), 'second');
    writeFileSync(join(first, 'a.cjs'), 'first');
    writeFileSync(join(second, 'a.cjs'), 'first');
    writeFileSync(join(second, 'b.cjs'), 'second');
    writeFileSync(join(second, 'ignored.txt'), 'unrelated');
    const original = getRuntimeRelease(first);
    assert.equal(original, getRuntimeRelease(second));
    assert.notEqual(
      original,
      getRuntimeRelease(first, { runtimeVersion: 'next' }),
    );
    assert.notEqual(
      original,
      getRuntimeRelease(first, { imageDigest: 'next-image' }),
    );
    writeFileSync(join(second, 'a.cjs'), 'changed');
    assert.notEqual(original, getRuntimeRelease(second));
  } finally {
    rmSync(first, { recursive: true, force: true });
    rmSync(second, { recursive: true, force: true });
  }
});

test('the readiness image identity matches both pinned Docker bases', () => {
  for (const filename of ['Dockerfile.web', 'Dockerfile.worker']) {
    const dockerfile = readFileSync(join(__dirname, '..', filename), 'utf8');
    assert.ok(
      dockerfile.startsWith(
        `FROM twentycrm/twenty:v${RUNTIME_VERSION}@sha256:${RUNTIME_IMAGE_DIGEST}\n`,
      ),
    );
  }
});
