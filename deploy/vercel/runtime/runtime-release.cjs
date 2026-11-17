'use strict';

const { createHash } = require('node:crypto');
const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const RUNTIME_VERSION = '2.58.0';
const RUNTIME_IMAGE_DIGEST =
  '3f1b5140a2d0ce590462c7636c109ec30fd4008d6f31dd5e7f3149b4f8a0dbb4';

const getRuntimeRelease = (
  directory = __dirname,
  { runtimeVersion = RUNTIME_VERSION, imageDigest = RUNTIME_IMAGE_DIGEST } = {},
) => {
  const hash = createHash('sha256');
  hash.update(runtimeVersion);
  hash.update('\0');
  hash.update(imageDigest);
  hash.update('\0');
  // Service and daemon system deployment variables can identify different revisions.
  for (const name of readdirSync(directory)
    .filter((name) => name.endsWith('.cjs'))
    .sort()) {
    hash.update(name);
    hash.update('\0');
    hash.update(readFileSync(join(directory, name)));
    hash.update('\0');
  }
  return hash.digest('hex');
};

module.exports = { getRuntimeRelease, RUNTIME_IMAGE_DIGEST, RUNTIME_VERSION };
