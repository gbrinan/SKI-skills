#!/usr/bin/env node
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const renderer = resolve(root, 'scripts/render-moderator.mjs');
const validator = resolve(root, 'scripts/validate-moderator-output.mjs');
const source = resolve(root, 'examples/moderator-ui/strategy-team-data.json');
const temp = await mkdtemp(join(tmpdir(), 'moderator-v14-'));
let passed = 0;

function run(script, ...args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}
function expect(condition, message) {
  if (!condition) throw new Error(message);
  passed += 1;
}

try {
  const data = JSON.parse(await readFile(source, 'utf8'));

  const finalData = join(temp, 'final.json');
  const finalHtml = join(temp, 'final.html');
  await writeFile(finalData, JSON.stringify(data), 'utf8');
  expect(run(renderer, finalData, finalHtml).status === 0, '판정 완료본 렌더 실패');
  expect(run(validator, finalHtml).status === 0, '판정 완료본 검증 실패');
  const finalSource = await readFile(finalHtml, 'utf8');
  expect(finalSource.includes('id="atf-data"'), '판정 완료본에 atf-data 없음');
  const runtimeScripts = [...finalSource.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  const runtimePath = join(temp, 'runtime.js');
  await writeFile(runtimePath, runtimeScripts.at(-1)[1], 'utf8');
  expect(spawnSync(process.execPath, ['--check', runtimePath], { encoding: 'utf8' }).status === 0, '브라우저 런타임 문법 오류');

  const preData = structuredClone(data);
  preData.selection = { finalized: false, selectedLv5Id: null, verdict: null, condition: null };
  delete preData.atfData;
  const preJson = join(temp, 'pre.json');
  const preHtml = join(temp, 'pre.html');
  await writeFile(preJson, JSON.stringify(preData), 'utf8');
  expect(run(renderer, preJson, preHtml).status === 0, '판정 전 본 렌더 실패');
  expect(run(validator, preHtml).status === 0, '판정 전 본 검증 실패');
  expect(!(await readFile(preHtml, 'utf8')).includes('id="atf-data"'), '판정 전 본에 atf-data가 생김');

  const missingAtf = structuredClone(data);
  delete missingAtf.atfData;
  const missingAtfJson = join(temp, 'missing-atf.json');
  await writeFile(missingAtfJson, JSON.stringify(missingAtf), 'utf8');
  expect(run(renderer, missingAtfJson, join(temp, 'missing-atf.html')).status !== 0, 'atf-data 없는 판정 완료본이 허용됨');

  const humanOnly = structuredClone(data);
  humanOnly.lv4s[1].lv5s[1].eligible = true;
  const humanOnlyJson = join(temp, 'human-only.json');
  const humanOnlyHtml = join(temp, 'human-only.html');
  await writeFile(humanOnlyJson, JSON.stringify(humanOnly), 'utf8');
  expect(run(renderer, humanOnlyJson, humanOnlyHtml).status === 0, '사람 업무 부정 fixture 렌더 실패');
  expect(run(validator, humanOnlyHtml).status !== 0, '사람 업무만 있는 후보가 검증을 통과함');

  const acronymHtml = join(temp, 'bare-acronym.html');
  await writeFile(acronymHtml, finalSource.replace('업무 후보 선정 · 팀 토의용', 'PP'), 'utf8');
  expect(run(validator, acronymHtml).status !== 0, '설명 없는 약어가 검증을 통과함');

  console.log(`테스트 통과: ${passed}개 경계`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
