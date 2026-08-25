#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateModeratorData } from './moderator-schema.mjs';

const [, , inputArg, outputArg] = process.argv;
if (!inputArg || !outputArg) {
  console.error('사용법: node scripts/render-moderator.mjs <data.json> <output.html>');
  process.exit(2);
}

const root = resolve(import.meta.dirname, '..');
const templatePath = resolve(root, 'assets/moderator-selection-tree-template.html');
const inputPath = resolve(process.cwd(), inputArg);
const outputPath = resolve(process.cwd(), outputArg);

const [template, rawData] = await Promise.all([
  readFile(templatePath, 'utf8'),
  readFile(inputPath, 'utf8'),
]);
const data = JSON.parse(rawData);
validateModeratorData(data);
const safeJson = JSON.stringify(data).replaceAll('<', '\\u003c');
const atf = data.selection.finalized
  ? `<script id="atf-data" type="application/json">${JSON.stringify(data.atfData).replaceAll('<', '\\u003c')}</script>`
  : '';

const output = template
  .replace('__MODERATOR_DATA__', safeJson)
  .replace('__ATF_DATA__', atf);
await writeFile(outputPath, output, 'utf8');
console.log(`생성 완료: ${outputPath}`);
