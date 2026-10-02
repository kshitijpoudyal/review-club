#!/usr/bin/env node
// Bumps the patch segment in src/utils/version.ts (e.g. 2.120 -> 2.121, 2.999 -> 3.000).
// Invoked by .husky/pre-push before a push to main.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const versionFilePath = join(__dirname, '..', 'src', 'utils', 'version.ts');

const contents = readFileSync(versionFilePath, 'utf8');
const match = contents.match(/APP_VERSION = '(\d+)\.(\d+)'/);

if (!match) {
  console.error(`bump-version: couldn't find APP_VERSION in ${versionFilePath}`);
  process.exit(1);
}

const major = Number(match[1]);
const minor = Number(match[2]);
let nextMajor = major;
let nextMinor = minor + 1;

if (nextMinor >= 1000) {
  nextMajor = major + 1;
  nextMinor = 0;
}

const nextVersion = `${nextMajor}.${String(nextMinor).padStart(3, '0')}`;

const updated = contents.replace(/APP_VERSION = '\d+\.\d+'/, `APP_VERSION = '${nextVersion}'`);
writeFileSync(versionFilePath, updated);

console.log(nextVersion);
