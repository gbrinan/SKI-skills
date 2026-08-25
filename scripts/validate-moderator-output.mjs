#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [, , htmlArg] = process.argv;
if (!htmlArg) {
  console.error('사용법: node scripts/validate-moderator-output.mjs <output.html>');
  process.exit(2);
}

const html = await readFile(resolve(process.cwd(), htmlArg), 'utf8');
const errors = [];
const moderatorMatch = html.match(/<script id="moderator-data" type="application\/json">([\s\S]*?)<\/script>/);
if (!moderatorMatch) errors.push('moderator-data 블록이 없습니다.');

let data;
if (moderatorMatch) {
  try { data = JSON.parse(moderatorMatch[1]); }
  catch (error) { errors.push(`moderator-data JSON 오류: ${error.message}`); }
}

const requiredPages = ['intro', 'overview', 'lv4', 'lv5', 'lv6', 'final'];
for (const page of requiredPages) {
  if (!html.includes(`data-page-panel="${page}"`)) errors.push(`필수 페이지 누락: ${page}`);
}

if (data) {
  if (!Array.isArray(data.lv4s) || data.lv4s.length === 0) errors.push('LV4 데이터가 없습니다.');
  const lv5Ids = new Set();
  const lv6Ids = new Set();
  for (const lv4 of data.lv4s ?? []) {
    if (!Array.isArray(lv4.lv5s)) errors.push(`${lv4.id}: LV5 배열이 없습니다.`);
    for (const lv5 of lv4.lv5s ?? []) {
      if (lv5Ids.has(lv5.id)) errors.push(`중복 LV5 ID: ${lv5.id}`);
      lv5Ids.add(lv5.id);
      if (!['green', 'yellow', 'red', 'excluded'].includes(lv5.status)) errors.push(`${lv5.id}: 알 수 없는 상태 ${lv5.status}`);
      if (!Number.isInteger(lv5.painPoints?.count) || lv5.painPoints.count < 0) errors.push(`${lv5.id}: Pain Point 수는 0 이상의 정수여야 합니다.`);
      if (!Number.isInteger(lv5.aiRecommendationCount) || lv5.aiRecommendationCount < 0) errors.push(`${lv5.id}: AI 전환 추천 수는 0 이상의 정수여야 합니다.`);
      const machineScope = (lv5.lv6s ?? []).filter(task => ['ai', 'assisted'].includes(task.role)).length;
      if (lv5.eligible && machineScope < 2) errors.push(`${lv5.id}: AI 처리·보조가 2개 미만인데 후보로 표시되었습니다.`);
      if ((lv5.lv6s ?? []).length < 3 && lv5.eligible) errors.push(`${lv5.id}: 세부 업무가 3개 미만인데 후보로 표시되었습니다.`);
      for (const lv6 of lv5.lv6s ?? []) {
        if (lv6Ids.has(lv6.id)) errors.push(`중복 LV6 ID: ${lv6.id}`);
        lv6Ids.add(lv6.id);
        if (!['ai', 'assisted', 'human_input', 'integration', 'human_final'].includes(lv6.role)) errors.push(`${lv6.id}: 알 수 없는 역할 ${lv6.role}`);
      }
    }
  }
  const atfMatch = html.match(/<script id="atf-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (data.selection?.finalized && !atfMatch) errors.push('판정 완료 HTML에 atf-data가 없습니다.');
  if (!data.selection?.finalized && atfMatch) errors.push('판정 전 HTML에 atf-data가 있습니다.');
  if (data.selection?.finalized && !lv5Ids.has(data.selection.selectedLv5Id)) errors.push('선택한 LV5가 트리에 없습니다.');
  if (atfMatch) {
    try {
      const atf = JSON.parse(atfMatch[1]);
      if (atf.verdict !== data.selection.verdict) errors.push('atf-data 판정과 화면 판정이 다릅니다.');
      if (!['권장', '조건부 권장', '대안 권장'].includes(atf.verdict)) errors.push(`허용되지 않은 판정: ${atf.verdict}`);
      if (typeof atf.process !== 'string' || atf.process.trim() === '') errors.push('atf-data process가 없습니다.');
      if (!atf.targetTask || !Number.isInteger(atf.targetTask.no) || typeof atf.targetTask.name !== 'string' || atf.targetTask.name.trim() === '') errors.push('atf-data targetTask가 불완전합니다.');
      if (!Array.isArray(atf.engines) || atf.engines.length === 0) errors.push('atf-data engines가 없습니다.');
      for (const [index, engine] of (atf.engines ?? []).entries()) {
        if (!Number.isInteger(engine.no) || typeof engine.name !== 'string' || !['자동', '증강', '사람고유'].includes(engine.human) || !['자동화', '스킬', '사람'].includes(engine.engine)) errors.push(`atf-data engines[${index}]가 불완전합니다.`);
      }
      if (!['개인용', '여러사람_미니앱', '여러사람_공유만'].includes(atf.wrap)) errors.push('atf-data wrap이 허용값이 아닙니다.');
      for (const gate of ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']) {
        if (!['충족', '미충족', '미확인'].includes(atf.gates?.[gate])) errors.push(`atf-data ${gate}가 없거나 허용값이 아닙니다.`);
      }
      if (typeof atf.condition !== 'string' || typeof atf.alternative !== 'string') errors.push('atf-data 조건·대안 문자열이 없습니다.');
      if (atf.hoursPerWeek !== null && (typeof atf.hoursPerWeek !== 'number' || !Number.isFinite(atf.hoursPerWeek) || atf.hoursPerWeek < 0)) errors.push('atf-data 주당시간이 잘못되었습니다.');
    } catch (error) { errors.push(`atf-data JSON 오류: ${error.message}`); }
  }
}

const visible = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ');
const forbidden = [
  [/\bPP\b/i, 'PP'], [/\bHITL\b/i, 'HITL'], [/\bAX\b/i, 'AX'],
  [/\bSTEP\b/i, 'STEP'], [/\bLEVEL\b/i, 'LEVEL'], [/\bGate\b/i, 'Gate'], [/\bLoopback\b/i, 'Loopback'],
];
for (const [pattern, label] of forbidden) {
  if (pattern.test(visible)) errors.push(`화면에 설명 없는 약어·개념이 있습니다: ${label}`);
}
if (data) {
  const visibleData = [
    data.meta?.team,
    ...(data.meta?.inputs ?? []),
    ...(data.glossary ?? []).flatMap(item => [item.term, item.meaning]),
    ...(data.lv4s ?? []).flatMap(lv4 => [
      lv4.name, lv4.lv3, lv4.frequency,
      ...(lv4.lv5s ?? []).flatMap(lv5 => [
        lv5.name, lv5.evidence, lv5.painPoints?.severity,
        ...(lv5.lv6s ?? []).flatMap(lv6 => [lv6.name, lv6.reason]),
      ]),
    ]),
    data.selection?.condition,
  ].filter(Boolean).join(' ');
  for (const [pattern, label] of forbidden) {
    if (pattern.test(visibleData)) errors.push(`화면 데이터에 설명 없는 약어·개념이 있습니다: ${label}`);
  }
}

if (!html.includes('Pain Point')) errors.push('Pain Point의 쉬운 설명이 없습니다.');
if (!html.includes('Human in the Loop')) errors.push('Human in the Loop의 쉬운 설명이 없습니다.');
if (!html.includes('사람이 준비') || !html.includes('사람이 최종 책임')) errors.push('사람 업무 시작·정지 경계가 없습니다.');
if (!html.includes('data-page="lv4"') || !html.includes('data-pager')) errors.push('단계·내부 페이지 탐색 계약이 없습니다.');

if (errors.length) {
  console.error(`검증 실패 (${errors.length}건)`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`검증 통과: 6개 페이지, LV4 ${data.lv4s.length}개, LV5 ${[...new Set(data.lv4s.flatMap(item => item.lv5s.map(lv5 => lv5.id)))].length}개, LV6 ${[...new Set(data.lv4s.flatMap(item => item.lv5s.flatMap(lv5 => lv5.lv6s.map(lv6 => lv6.id))))].length}개`);
