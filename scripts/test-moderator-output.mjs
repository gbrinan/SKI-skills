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
function editJsonBlock(html, id, mutate) {
  const pattern = new RegExp(`(<script id="${id}" type="application/json">)([\\s\\S]*?)(</script>)`);
  const match = html.match(pattern);
  if (!match) throw new Error(`${id} 블록이 없습니다.`);
  const value = JSON.parse(match[2]);
  mutate(value);
  return html.replace(pattern, `$1${JSON.stringify(value).replaceAll('<', '\\u003c')}$3`);
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

  const malformedCases = [
    ['team-object', 'moderator-data', value => { value.meta.team = {}; }],
    ['eligible-string', 'moderator-data', value => { value.lv4s[0].lv5s[0].eligible = 'true'; }],
    ['finalized-string', 'moderator-data', value => { value.selection.finalized = 'true'; }],
    ['severity-number', 'moderator-data', value => { value.lv4s[0].lv5s[0].painPoints.severity = 7; }],
    ['signal-markup', 'moderator-data', value => { value.lv4s[0].lv5s[0].signals['반복성'] = '<img src=x onerror=alert(1)>'; }],
    ['target-negative', 'atf-data', value => { value.targetTask.no = -1; }],
    ['engine-name-empty', 'atf-data', value => { value.engines[0].name = ''; }],
  ];
  for (const [name, id, mutate] of malformedCases) {
    const editedHtml = join(temp, `${name}.html`);
    await writeFile(editedHtml, editJsonBlock(finalSource, id, mutate), 'utf8');
    expect(run(validator, editedHtml).status !== 0, `수동 편집된 ${name} 데이터가 validator를 통과함`);
  }

  const semanticTarget = value => {
    value.targetTask = { no: 999, name: '다른 업무' };
  };
  const targetMismatchHtml = join(temp, 'target-mismatch.html');
  let targetMismatchSource = editJsonBlock(finalSource, 'moderator-data', value => semanticTarget(value.atfData));
  targetMismatchSource = editJsonBlock(targetMismatchSource, 'atf-data', semanticTarget);
  await writeFile(targetMismatchHtml, targetMismatchSource, 'utf8');
  expect(run(validator, targetMismatchHtml).status !== 0, '선정 LV5와 다른 ATF 대상이 validator를 통과함');

  const semanticEngine = value => {
    value.engines[0] = { no: 999, name: '다른 세부 업무', human: '자동', engine: '자동화' };
  };
  const engineMismatchHtml = join(temp, 'engine-mismatch.html');
  let engineMismatchSource = editJsonBlock(finalSource, 'moderator-data', value => semanticEngine(value.atfData));
  engineMismatchSource = editJsonBlock(engineMismatchSource, 'atf-data', semanticEngine);
  await writeFile(engineMismatchHtml, engineMismatchSource, 'utf8');
  expect(run(validator, engineMismatchHtml).status !== 0, 'LV6와 다른 ATF 엔진이 validator를 통과함');

  const splitBrainHtml = join(temp, 'split-brain.html');
  await writeFile(splitBrainHtml, editJsonBlock(finalSource, 'atf-data', semanticTarget), 'utf8');
  expect(run(validator, splitBrainHtml).status !== 0, '서로 다른 moderator-data와 atf-data가 validator를 통과함');

  const brokenPanelHtml = join(temp, 'broken-panel.html');
  await writeFile(brokenPanelHtml, finalSource.replace('id="page-lv4"', 'id="page-lv4-broken"'), 'utf8');
  expect(run(validator, brokenPanelHtml).status !== 0, '필수 페이지 패널 ID 누락이 validator를 통과함');

  const duplicateDataHtml = join(temp, 'duplicate-data.html');
  await writeFile(duplicateDataHtml, finalSource.replace('</body>', '<script id="moderator-data" type="application/json">{}</script></body>'), 'utf8');
  expect(run(validator, duplicateDataHtml).status !== 0, '중복 moderator-data 블록이 validator를 통과함');

  const duplicateAtfHtml = join(temp, 'duplicate-atf.html');
  await writeFile(duplicateAtfHtml, finalSource.replace('</body>', '<script id="atf-data" type="application/json">{}</script></body>'), 'utf8');
  expect(run(validator, duplicateAtfHtml).status !== 0, '중복 atf-data 블록이 validator를 통과함');

  const reorderedDuplicateHtml = join(temp, 'reordered-duplicate.html');
  await writeFile(reorderedDuplicateHtml, finalSource.replace('<body>', '<body><script type="application/json" id="moderator-data">{}</script>'), 'utf8');
  expect(run(validator, reorderedDuplicateHtml).status !== 0, '속성 순서를 바꾼 중복 moderator-data가 validator를 통과함');

  const reorderedAtfHtml = join(temp, 'reordered-atf.html');
  await writeFile(reorderedAtfHtml, finalSource.replace('</body>', '<script type="application/json" id="atf-data">{}</script></body>'), 'utf8');
  expect(run(validator, reorderedAtfHtml).status !== 0, '속성 순서를 바꾼 중복 atf-data가 validator를 통과함');

  const unquotedDuplicateHtml = join(temp, 'unquoted-duplicate.html');
  await writeFile(unquotedDuplicateHtml, finalSource.replace('<body>', '<body><script id=moderator-data type=application/json>{}</script>'), 'utf8');
  expect(run(validator, unquotedDuplicateHtml).status !== 0, '따옴표 없는 중복 moderator-data가 validator를 통과함');

  const encodedDuplicateHtml = join(temp, 'encoded-duplicate.html');
  await writeFile(encodedDuplicateHtml, finalSource.replace('<body>', '<body><script id="moderator&#45;data" type="application/json">{}</script>'), 'utf8');
  expect(run(validator, encodedDuplicateHtml).status !== 0, '문자 참조로 숨긴 중복 moderator-data가 validator를 통과함');

  const encodedAtfHtml = join(temp, 'encoded-atf.html');
  await writeFile(encodedAtfHtml, finalSource.replace('</body>', '<script id="atf&#x2d;data" type="application/json">{}</script></body>'), 'utf8');
  expect(run(validator, encodedAtfHtml).status !== 0, '16진 문자 참조로 숨긴 중복 atf-data가 validator를 통과함');

  const malformedCloseHtml = join(temp, 'malformed-close.html');
  await writeFile(malformedCloseHtml, finalSource.replace('</script>', '</scripture>'), 'utf8');
  expect(run(validator, malformedCloseHtml).status !== 0, '잘못된 script 닫는 태그가 validator를 통과함');

  const solidusDuplicateHtml = join(temp, 'solidus-duplicate.html');
  await writeFile(solidusDuplicateHtml, finalSource.replace('<body>', '<body><script/id="moderator-data" type="application/json">{}</script>'), 'utf8');
  expect(run(validator, solidusDuplicateHtml).status !== 0, 'solidus 뒤 중복 moderator-data가 validator를 통과함');

  const solidusAtfHtml = join(temp, 'solidus-atf.html');
  await writeFile(solidusAtfHtml, finalSource.replace('</body>', '<script/ id="atf-data" type="application/json">{}</script></body>'), 'utf8');
  expect(run(validator, solidusAtfHtml).status !== 0, 'solidus 뒤 중복 atf-data가 validator를 통과함');

  const scriptureHtml = join(temp, 'scripture-visible.html');
  await writeFile(scriptureHtml, finalSource.replace('<body>', '<body><scripture><p>PP</p></scripture>'), 'utf8');
  expect(run(validator, scriptureHtml).status !== 0, 'scripture 요소의 화면 약어가 validator를 통과함');

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
  expect(run(renderer, humanOnlyJson, humanOnlyHtml).status !== 0, '사람 업무만 있는 후보가 렌더러를 통과함');
  const editedHumanOnlyHtml = join(temp, 'edited-human-only.html');
  await writeFile(editedHumanOnlyHtml, editJsonBlock(finalSource, 'moderator-data', value => {
    value.lv4s[1].lv5s[1].eligible = true;
  }), 'utf8');
  expect(run(validator, editedHumanOnlyHtml).status !== 0, '사람 업무만 있는 후보가 validator를 통과함');

  const noSignal = structuredClone(data);
  const noSignalCandidate = noSignal.lv4s[0].lv5s[0];
  noSignalCandidate.painPoints.count = 0;
  noSignalCandidate.aiRecommendationCount = 0;
  const noSignalJson = join(temp, 'no-signal.json');
  await writeFile(noSignalJson, JSON.stringify(noSignal), 'utf8');
  expect(run(renderer, noSignalJson, join(temp, 'no-signal.html')).status !== 0, '근거 없는 후보가 렌더러를 통과함');
  const editedNoSignalHtml = join(temp, 'edited-no-signal.html');
  await writeFile(editedNoSignalHtml, editJsonBlock(finalSource, 'moderator-data', value => {
    value.lv4s[0].lv5s[0].painPoints.count = 0;
    value.lv4s[0].lv5s[0].aiRecommendationCount = 0;
  }), 'utf8');
  expect(run(validator, editedNoSignalHtml).status !== 0, '근거 없는 후보가 validator를 통과함');

  noSignalCandidate.candidateOverrideReason = '팀 토의에서 반복 민원이 확인됨';
  const overrideJson = join(temp, 'candidate-override.json');
  const overrideHtml = join(temp, 'candidate-override.html');
  await writeFile(overrideJson, JSON.stringify(noSignal), 'utf8');
  expect(run(renderer, overrideJson, overrideHtml).status === 0, '팀 재검토 이유가 있는 후보를 렌더하지 못함');
  expect(run(validator, overrideHtml).status === 0, '팀 재검토 이유가 있는 후보를 validator가 거부함');

  const acronymHtml = join(temp, 'bare-acronym.html');
  await writeFile(acronymHtml, finalSource.replace('</body>', '<p>PP</p></body>'), 'utf8');
  expect(run(validator, acronymHtml).status !== 0, '설명 없는 약어가 검증을 통과함');

  const encodedAcronymHtml = join(temp, 'encoded-acronym.html');
  await writeFile(encodedAcronymHtml, finalSource.replace('</body>', '<p>P&#80;</p></body>'), 'utf8');
  expect(run(validator, encodedAcronymHtml).status !== 0, '문자 참조로 숨긴 화면 약어가 검증을 통과함');

  const explainedTermHtml = join(temp, 'explained-term.html');
  await writeFile(explainedTermHtml, finalSource.replace('</body>', '<p>Gate(판정 기준)</p></body>'), 'utf8');
  expect(run(validator, explainedTermHtml).status === 0, '뜻을 설명한 전문어가 거부됨');

  console.log(`테스트 통과: ${passed}개 계약 검증 (오류·공격성 fixture 포함)`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
