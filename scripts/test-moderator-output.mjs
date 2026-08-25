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

  const incompleteAtf = structuredClone(data);
  incompleteAtf.atfData = { verdict: '권장' };
  const incompleteAtfJson = join(temp, 'incomplete-atf.json');
  await writeFile(incompleteAtfJson, JSON.stringify(incompleteAtf), 'utf8');
  expect(run(renderer, incompleteAtfJson, join(temp, 'incomplete-atf.html')).status !== 0, '불완전한 atf-data가 허용됨');
  const editedAtfHtml = join(temp, 'edited-atf.html');
  await writeFile(editedAtfHtml, finalSource.replace(/<script id="atf-data" type="application\/json">[\s\S]*?<\/script>/, '<script id="atf-data" type="application/json">{"verdict":"권장"}</script>'), 'utf8');
  expect(run(validator, editedAtfHtml).status !== 0, '수동 편집된 불완전 atf-data가 validator를 통과함');

  const invalidStatus = structuredClone(data);
  invalidStatus.lv4s[0].lv5s[0].status = 'invalid-status';
  const invalidStatusJson = join(temp, 'invalid-status.json');
  await writeFile(invalidStatusJson, JSON.stringify(invalidStatus), 'utf8');
  expect(run(renderer, invalidStatusJson, join(temp, 'invalid-status.html')).status !== 0, '허용 목록 밖 상태가 허용됨');
  const editedStatusHtml = join(temp, 'edited-status.html');
  await writeFile(editedStatusHtml, finalSource.replace('"status":"green"', '"status":"invalid-status"'), 'utf8');
  expect(run(validator, editedStatusHtml).status !== 0, '수동 편집된 허용 목록 밖 상태가 validator를 통과함');

  const hostileCount = structuredClone(data);
  hostileCount.lv4s[0].lv5s[0].painPoints.count = '</span><img src=x onerror=alert(1)>';
  const hostileCountJson = join(temp, 'hostile-count.json');
  await writeFile(hostileCountJson, JSON.stringify(hostileCount), 'utf8');
  expect(run(renderer, hostileCountJson, join(temp, 'hostile-count.html')).status !== 0, 'HTML 삽입형 수치가 허용됨');

  const hostileRole = structuredClone(data);
  hostileRole.lv4s[0].lv5s[0].lv6s[0].role = 'x" autofocus onfocus=alert(1) x="';
  const hostileRoleJson = join(temp, 'hostile-role.json');
  await writeFile(hostileRoleJson, JSON.stringify(hostileRole), 'utf8');
  expect(run(renderer, hostileRoleJson, join(temp, 'hostile-role.html')).status !== 0, '속성 삽입형 역할이 허용됨');

  const scriptBreak = structuredClone(data);
  scriptBreak.meta.team = '</script><script>alert(1)</script>';
  const scriptBreakJson = join(temp, 'script-break.json');
  const scriptBreakHtml = join(temp, 'script-break.html');
  await writeFile(scriptBreakJson, JSON.stringify(scriptBreak), 'utf8');
  expect(run(renderer, scriptBreakJson, scriptBreakHtml).status === 0, '스크립트 종료 문자열을 안전하게 렌더하지 못함');
  expect(!(await readFile(scriptBreakHtml, 'utf8')).includes('</script><script>alert(1)</script>'), '스크립트 종료 문자열이 HTML에 그대로 삽입됨');

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
